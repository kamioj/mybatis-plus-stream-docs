# 子查询

支持四种 SQL 子查询形态，全部 lambda 写法、SQL 形态可预测。本页以 Stream 形式为主。

| SQL 形态 | 入口方法 |
|---|---|
| `WHERE col IN (SELECT ...)` | `.filter(where -> where.inSubSql(col, sub -> ...))` |
| `WHERE col NOT IN (SELECT ...)` | `.filter(where -> where.notInSubSql(col, sub -> ...))` |
| `WHERE EXISTS (SELECT 1 FROM ...)` | `.filter(where -> where.exists(sub -> ...))` |
| `WHERE NOT EXISTS (SELECT 1 FROM ...)` | `.filter(where -> where.notExists(sub -> ...))` |
| `SELECT (SELECT ...) AS alias` | `.map(select -> select.selectSubSql(sub -> ..., alias), DTO.class)` |
| `LEFT JOIN (SELECT ...) AS t ON ...` | `.join(join -> join.leftJoin(sub -> ..., "t", on -> ...))` |
| `RIGHT JOIN (SELECT ...) AS t ON ...` | `.join(join -> join.rightJoin(sub -> ..., "t", on -> ...))` |

## WHERE col IN (SELECT ...)

```sql
SELECT * FROM user
WHERE id IN (SELECT user_id FROM demand WHERE status = 'completed')
```

```java
// Stream 形式
List<User> users = userService.stream()
    .filter(where -> where.inSubSql(User::getId,
        sub -> sub.from(Demand.class)
                  .select(select -> select.selectFunc(arg -> arg.column(Demand::getUserId), SingleValue::getValue))
                  .where(subWhere -> subWhere.eq(Demand::getStatus, "completed"))))
    .collect(Collectors.toList());

// 一行语法
List<User> users = userService.list(where -> where.inSubSql(User::getId,
    sub -> sub.from(Demand.class)
              .select(select -> select.selectFunc(arg -> arg.column(Demand::getUserId), SingleValue::getValue))
              .where(subWhere -> subWhere.eq(Demand::getStatus, "completed"))));
```

## WHERE col NOT IN (SELECT ...)

```sql
SELECT * FROM user
WHERE id NOT IN (SELECT user_id FROM demand)
```

```java
userService.stream()
    .filter(where -> where.notInSubSql(User::getId,
        sub -> sub.from(Demand.class)
                  .select(select -> select.selectFunc(arg -> arg.column(Demand::getUserId), SingleValue::getValue))))
    .collect(Collectors.toList());
```

## WHERE EXISTS

`EXISTS` 用 **`NonValueSubSqlLambdaQueryWrapper`**——子查询里**不需要 select**（框架自动 `SELECT 1`，减少 IO）。

```sql
SELECT * FROM user
WHERE EXISTS (
    SELECT 1 FROM demand
    WHERE demand.user_id = user.id AND demand.status = '待接单'
)
```

```java
userService.stream()
    .filter(where -> where.exists(
        sub -> sub.from(Demand.class)
                  .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)
                                  .eq(Demand::getStatus, "待接单"))))
    .collect(Collectors.toList());
```

::: tip eqColumn 跨表
`eqColumn(Demand::getUserId, User::getId)` 表示 **`demand.user_id = user.id`**——子查询关联回外层的关键 API。
:::

## WHERE NOT EXISTS

```sql
SELECT * FROM user
WHERE NOT EXISTS (SELECT 1 FROM demand WHERE demand.user_id = user.id)
```

```java
List<User> idleUsers = userService.stream()
    .filter(where -> where.notExists(
        sub -> sub.from(Demand.class)
                  .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId))))
    .collect(Collectors.toList());
```

## SELECT 标量子查询

`selectSubSql` 把子查询作为**结果列**塞进 SELECT，并映射到 DTO 字段。

```sql
SELECT u.username,
       (SELECT COUNT(*) FROM demand WHERE demand.user_id = u.id) AS demand_count
FROM user u
WHERE u.role = 'user'
```

```java
@Data
class UserWithCountDTO {
    private String username;
    private Long demandCount;
}

List<UserWithCountDTO> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .map(select -> select.select(User::getUsername, UserWithCountDTO::getUsername)
               .selectSubSql(
                   sub -> sub.from(Demand.class)
                             .select(subSelect -> subSelect.selectFunc(inner -> inner.count(), SingleValue::getValue))
                             .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
                   UserWithCountDTO::getDemandCount),
         UserWithCountDTO.class)
    .collect(Collectors.toList());
```

::: warning N+1
对外层每行执行一次子查询——**外层结果集很大时会很慢**。如果可以，改用 LEFT JOIN + GROUP BY 写法。
:::

## LEFT JOIN 衍生表

子查询作为 JOIN 右表，常用于"每个 user 的订单数"这种聚合后再 JOIN 的场景。

```sql
SELECT u.*, t.order_count
FROM user u
LEFT JOIN (
    SELECT user_id, COUNT(*) AS order_count
    FROM `order`
    GROUP BY user_id
) t ON t.user_id = u.id
```

```java
userService.stream()
    .join(join -> join.leftJoin(
        sub -> sub.from(Order.class)
                  .select(select -> select.select(Order::getUserId)
                                .selectFunc(inner -> inner.count(), Order::getOrderCount))
                  .group(group -> group.groupBy(Order::getUserId)),
        "t",
        on -> on.eqColumn(Order::getUserId, User::getId)))
    .collect(Collectors.toList());
```

## 子查询内部可用 API

所有 SubSql wrapper（IN/EXISTS/SELECT/JOIN 用到的几种）都支持以下链式调用：

| 方法 | 用途 |
|---|---|
| `.from(Entity.class)` | 子查询 FROM 表 |
| `.from(Entity.class, "alias")` | 带表别名（自关联） |
| `.from(Entity.class, join -> ...)` | 子查询内部再 JOIN |
| `.select(s -> ...)` | 子查询 SELECT 列（EXISTS 用的 `NonValue` wrapper 无此方法） |
| `.where(sw -> ...)` | 子查询 WHERE |
| `.group(g -> ...)` | 子查询 GROUP BY |
| `.order(o -> ...)` | 子查询 ORDER BY |
| `.limit(n)` | 子查询 LIMIT |

子查询内部可**再嵌套子查询**（PG 默认深度 32 层，超出会报错）。

## 当前不支持的形态

| 形态 | 状态 | 解决方案 |
|---|---|---|
| `WHERE col = (SELECT ...)` 标量比较 | ❌ 未提供 `eqSubSql/gtSubSql` 等 | 暂用 mapper.xml；或两步法：先 `getValue` 拿到聚合值，再 `gt(col, value)` |
| `INNER JOIN (SELECT ...)` 子查询 | ❌ 只有 LEFT/RIGHT 接受 SubSql | 改 LEFT JOIN + WHERE 过滤 |
| `FROM (SELECT ...) AS t` 衍生表作主表 | ❌ | 暂用 mapper.xml |
| `UNION / UNION ALL` | ❌ | 暂用 mapper.xml；规划在未来版本 |
| 子查询返回多列与外层 ROW 比较 | ❌ | 不打算支持（极冷门） |

## EXISTS vs IN 的取舍

| 关联方式 | 适合 | 性能特点 |
|---|---|---|
| `EXISTS (SELECT 1 FROM ... WHERE 关联)` | 外表大、子表 selective | 子查询拿到第一条就停止，**通常更快** |
| `IN (SELECT col FROM ...)` | 子表小 / 子表结果集可缓存 | 子查询要全列出，**子表大时慢** |
| `IN (固定值列表)` | 已知离散值（< 1000 个） | 最快，DB 直接走索引 |

::: tip
PG / MySQL / DM 的优化器对 `EXISTS` 和 `IN` 通常会做等价转换，**但写法上 EXISTS 更不容易踩坑**——尤其是子查询带 NULL 时（`NOT IN` 遇到 NULL 会返回空集，`NOT EXISTS` 不会）。
:::
