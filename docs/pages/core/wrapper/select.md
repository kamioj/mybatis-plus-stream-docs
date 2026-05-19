# select

SELECT 子句的全部能力——**单字段 / 全字段映射 / 函数列 / 子查询列 / CASE 列 / 自动多表匹配**。本页以 Stream 形式为主。

## 能力总览

| 用法 | SQL 形态 | API |
|---|---|---|
| 单字段简写 | `SELECT col` | `.select(DTO::getField)` |
| 字段重命名映射 | `SELECT src AS dst` | `.select(Src::getField, DTO::getDst)` |
| 全字段自动映射 | `SELECT col1, col2, ...` | `.selectAll(SrcEntity.class)` |
| 多表按字段名优先级匹配 | 自动按 DTO 字段名找对应表的列 | `.selectAuto(DTO.class, A.class, B.class)` ⚠️ deprecated |
| 函数列 | `SELECT COUNT(*) AS cnt` | `.selectFunc(func -> func.count(), DTO::getCnt)` |
| 子查询列 | `SELECT (SELECT ...) AS x` | `.selectSubSql(sub -> ..., DTO::getX)` |
| CASE 列 | `SELECT CASE WHEN ... THEN ... END AS lvl` | `.selectCase(caseExpr -> ..., DTO::getLvl)` |
| 指定表别名 | `SELECT t.col AS dst` | `.select(Src::getField, "t", DTO::getDst)` |

## 单字段简写 {#single-field}

DTO 字段与源表字段同名时，**一个 lambda 即可**：

```sql
SELECT username FROM user
```

```java
userService.stream()
    .map(select -> select.select(User::getUsername), User.class)
    .collect(Collectors.toList());
```

::: tip
单参 `select(SFunction<R, V>)` 的 lambda 类型受 `R` 约束——`R` 是流的目标类型（DTO 或实体）。常用于"不重映射、直接选某列"的场景。
:::

## 字段重命名映射（最常用） {#rename-map}

源表字段映射到 DTO 不同名字段：

```sql
SELECT username AS username, credit_score AS score
FROM user
```

```java
@Data
class UserDTO { private String username; private Integer score; }

userService.stream()
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
                         .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .collect(Collectors.toList());
```

## selectAll — 全字段自动映射 {#select-all}

把源实体的**所有字段**按字段名映射到 DTO。DTO 字段与实体一一对应时最省事。

```sql
SELECT id, username, nickname, role, credit_score FROM user
```

```java
userService.stream()
    .map(select -> select.selectAll(User.class), User.class)
    .collect(Collectors.toList());
```

带表别名（JOIN 时区分多表）：

```java
.map(select -> select.selectAll(User.class, "u"), User.class)
// SELECT u.id, u.username, ... FROM user u
```

::: tip 何时用 selectAll
- DTO 与实体**字段完全一致**——免去逐个 select
- DTO 字段是实体字段的**子集**且同名——能匹配的自动选，没匹配的为 null
- 字段需要重命名 / 跨表取 → 用其他 select
:::

## selectAuto — 多表按字段名优先级匹配 ⚠️ {#select-auto}

按 DTO 字段名在**多个源表**中按顺序查找，找到的第一个匹配表对应字段被选中。

```sql
-- UserOrderDTO 有 id、username（来自 User）、orderNo（来自 Order）
SELECT u.id, u.username, o.order_no
FROM user u LEFT JOIN `order` o ON u.id = o.user_id
```

```java
@Data
class UserOrderDTO {
    private Long   id;
    private String username;
    private String orderNo;
}

userService.stream()
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))
    .map(select -> {
        select.selectAuto(UserOrderDTO.class, User.class, Order.class);
        //     ^ DTO 类      ^ 优先级：User 先，Order 次
        //     id 和 username 在 User 找到，orderNo 在 Order 找到
        return select;
    }, UserOrderDTO.class)
    .collect(Collectors.toList());
```

::: warning @Deprecated
`selectAuto` 标记为 `@Deprecated`，原因：
- 字段名隐式匹配，**编译期看不出字段映射关系**——重构源表字段名时不会触发编译错
- 多表优先级靠参数顺序，**容易踩坑**
- 建议改用显式 `.select(User::getId, UserOrderDTO::getId)` 逐字段映射，类型安全
:::

## selectFunc — 函数列 {#select-func}

把 SQL 函数（聚合 / 字符串 / 日期 / 数学）映射到 DTO 字段：

```sql
SELECT COUNT(*) AS cnt,
       SUM(credit_score) AS totalScore,
       AVG(credit_score) AS avgScore
FROM user
```

```java
userService.stream()
    .map(select -> select.selectFunc(func -> func.count(),                    UserDTO::getCount)
                         .selectFunc(func -> func.sum(User::getCreditScore), UserDTO::getTotalScore)
                         .selectFunc(func -> func.avg(User::getCreditScore), UserDTO::getAvgScore),
         UserDTO.class)
    .collect(Collectors.toList());
```

字符串函数列：

```sql
SELECT CONCAT(username, '@', role) AS displayName
FROM user
```

```java
.map(select -> select.selectFunc(
    func -> func.concatFunc(
        arg -> arg.column(User::getUsername),
        arg -> arg.value("@"),
        arg -> arg.column(User::getRole)),
    UserDTO::getDisplayName), UserDTO.class)
```

100+ 函数清单见 [函数表达式](/pages/core/wrapper/functions)。

## selectSubSql — 子查询列（标量子查询） {#select-sub-sql}

每行查一个聚合标量挂到 DTO 字段：

```sql
SELECT u.username,
       (SELECT COUNT(*) FROM demand WHERE demand.user_id = u.id) AS demand_count
FROM user u
```

```java
userService.stream()
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
                         .selectSubSql(
                             sub -> sub.from(Demand.class)
                                       .select(subSelect -> subSelect.selectFunc(
                                           func -> func.count(),
                                           SingleValue::getValue))
                                       .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
                             UserDTO::getDemandCount),
         UserDTO.class)
    .collect(Collectors.toList());
```

::: warning N+1
外层每行执行一次子查询，**外层结果集大时慢**。可改 LEFT JOIN + GROUP BY。详见 [子查询专章](/pages/core/wrapper/sub-query)。
:::

## selectCase — CASE WHEN 列 {#select-case}

### 返回固定值

```sql
SELECT CASE
    WHEN credit_score >= 200 THEN 'high'
    WHEN credit_score >= 100 THEN 'medium'
    ELSE 'low'
END AS level
FROM user
```

```java
.map(select -> select.selectCase(caseExpr -> caseExpr
        .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 200), "high")
        .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 100), "medium")
        .elseValue("low"),
        UserDTO::getLevel),
     UserDTO.class)
```

### 返回列值

```sql
SELECT CASE
    WHEN credit_score >= 200 THEN nickname
    ELSE username
END AS displayName
FROM user
```

```java
.map(select -> select.selectCase(caseExpr -> caseExpr
        .whenThenColumn(caseWhere -> caseWhere.ge(User::getCreditScore, 200), User::getNickname)
        .elseColumn(User::getUsername),
        UserDTO::getDisplayName),
     UserDTO.class)
```

### 二元简写（when / else 各一）

```sql
SELECT CASE WHEN role = 'admin' THEN 'admin' ELSE 'user' END AS group
FROM user
```

```java
.map(select -> select.selectCase(
    caseWhere -> caseWhere.eq(User::getRole, "admin"),  // 条件
    "admin",                                             // then 值
    "user",                                              // else 值
    UserDTO::getGroup),
    UserDTO.class)
```

## JOIN 时指定来自哪张表 {#table-alias}

多表 JOIN 且字段名冲突时，给列加表别名：

```sql
SELECT u.username AS username, d.service_type AS serviceType
FROM user u LEFT JOIN demand d ON u.id = d.user_id
```

```java
userService.stream()
    .join(join -> join.leftJoin(Demand.class, "d", User::getId, Demand::getUserId))
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
                         .select(Demand::getServiceType, "d", UserDTO::getServiceType),
         UserDTO.class)
    .collect(Collectors.toList());
```

## 全方法签名一览

| 方法 | 签名 | 含义 |
|---|---|---|
| `select(c)` | `<V> select(SFunction<R, V>)` | 单字段简写 |
| `select(c, alias)` | `select(SFunction<R, V>, String)` | 单字段 + 表别名 |
| `select(src, dst)` | `<T,V> select(SFunction<T, V>, SFunction<R, V>)` | 源→目标字段映射 |
| `select(src, alias, dst)` | `<T,V> select(SFunction<T, V>, String, SFunction<R, V>)` | 源→目标 + 表别名 |
| `selectAll(cls)` | `selectAll(Class<R>)` | 单表全字段映射 |
| `selectAll(cls, alias)` | `selectAll(Class<R>, String)` | 同上 + 表别名 |
| `selectAuto(dto, ts...)` ⚠️ | `selectAuto(Class<R>, Class<?>...)` | 多表按字段名优先级匹配 |
| `selectFunc(f, dst)` | `selectFunc(Function<GroupFunctionLambdaQueryWrapper, V>, SFunction<R, V>)` | 函数表达式列 |
| `selectSubSql(sub, dst)` | `selectSubSql(Consumer<SingleValueSubSqlLambdaQueryWrapper<V>>, SFunction<R, V>)` | 标量子查询列 |
| `selectCase(case, dst)` | `selectCase(Consumer<GroupCaseLambdaQueryWrapper<V>>, SFunction<R, V>)` | CASE 列 |
| `selectCase(cond, then, else, dst)` | `selectCase(Consumer<Where>, V, V, SFunction<R, V>)` | 二元 CASE 简写 |

## 综合示例

```sql
SELECT u.username                                                  AS username,
       u.id                                                        AS userId,
       CHAR_LENGTH(u.username)                                     AS nameLength,
       CASE WHEN u.credit_score >= 100 THEN '优秀' ELSE '普通' END AS level,
       (SELECT COUNT(*) FROM demand WHERE demand.user_id = u.id)   AS demandCount
FROM user u
WHERE u.role = 'user'
ORDER BY u.id ASC
LIMIT 10
```

```java
List<UserDTO> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .limit(10)
    .map(select -> select
        // 1) 字段重命名映射
        .select(User::getUsername, UserDTO::getUsername)
        // 2) 单字段简写（DTO 与实体字段同名）
        .select(UserDTO::getUserId)
        // 3) 函数列
        .selectFunc(func -> func.charLengthFunc(arg -> arg.column(User::getUsername)),
                    UserDTO::getNameLength)
        // 4) CASE 列
        .selectCase(caseExpr -> caseExpr
            .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 100), "优秀")
            .elseValue("普通"),
            UserDTO::getLevel)
        // 5) 子查询列
        .selectSubSql(
            sub -> sub.from(Demand.class)
                      .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                      .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
            UserDTO::getDemandCount),
        UserDTO.class)
    .collect(Collectors.toList());
```

一条 SQL 同时用了 5 种 select 能力——这就是 select 的能力图谱。

## 相关

- [函数表达式](/pages/core/wrapper/functions) — selectFunc 可调的 100+ SQL 函数
- [子查询](/pages/core/wrapper/sub-query) — selectSubSql 标量子查询完整语义
- [join](/pages/core/wrapper/join) — 多表关联与表别名约定
- [Stream API - map](/pages/core/stream/stream#map-——-映射到-dto)
