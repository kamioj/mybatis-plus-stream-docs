# 子查询

## IN 子查询

查询有需求的用户：

```java
List<User> users = userService.list(where -> where
    .inSubSql(User::getId,
        sub -> sub.from(Demand.class)
            .select(select -> select.selectFunc(
                func -> func.column(Demand::getUserId), SingleValue::getValue))));
```

生成 SQL：
```sql
SELECT * FROM user
WHERE id IN (SELECT user_id FROM demand)
```

## NOT IN 子查询

查询没有发布需求的用户：

```java
List<User> users = userService.list(where -> where
    .notInSubSql(User::getId,
        sub -> sub.from(Demand.class)
            .select(select -> select.selectFunc(
                func -> func.column(Demand::getUserId), SingleValue::getValue))));
```

## EXISTS 子查询

```java
List<User> users = userService.list(where -> where
    .exists(sub -> sub
        .from(Demand.class)
        .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)
                      .eq(Demand::getStatus, "待接单"))));
```

生成 SQL：
```sql
SELECT * FROM user
WHERE EXISTS (
    SELECT 1 FROM demand
    WHERE demand.user_id = user.id AND demand.status = '待接单'
)
```

## SELECT 子查询

将子查询结果作为 SELECT 的一列：

```java
@Data
public class UserWithDemandCountDTO {
    private String username;
    private Long demandCount;
}

List<UserWithDemandCountDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserWithDemandCountDTO::getUsername)
          .selectSubSql(
              sub -> sub.from(Demand.class)
                  .select(subSelect -> subSelect.selectFunc(inner -> inner.count(), SingleValue::getValue))
                  .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
              UserWithDemandCountDTO::getDemandCount),
    UserWithDemandCountDTO.class);
```

## WHERE 标量比较子查询

::: warning 当前未支持
`WHERE col = (SELECT ...)` / `> (SELECT ...)` 等标量比较子查询本库**暂未提供 lambda 入口**（如 `eqSubSql` / `gtSubSql`）。需要这种形态时，临时方案：

1. 走 mapper.xml 写原生 SQL
2. 或转为两步：先 `getValue` 查出聚合标量，再用普通 `gt(col, value)` 比较

```java
// 例：积分高于平均值的用户（两步法）
Double avg = userService.getValue(
    w -> {},
    select -> select.selectFunc(inner -> inner.avg(User::getCreditScore), SingleValue::getValue),
    Double.class);

List<User> aboveAvg = userService.list(
    where -> where.gt(User::getCreditScore, avg.intValue()));
```

完整能力对照参见 [子查询专章 — 当前不支持的形态](/pages/core/wrapper/sub-query#当前不支持的形态)。
:::

## CASE WHEN 展示

```java
@Data
public class UserDisplayDTO {
    private String username;
    private Integer score;
    private String creditLevel;
}

List<UserDisplayDTO> list = userService.list(
    where -> {},
    order -> order.orderDesc(User::getCreditScore),
    100,
    select -> select.select(User::getUsername, UserDisplayDTO::getUsername)
          .select(User::getCreditScore, UserDisplayDTO::getScore)
          .selectCase(caseExpr -> caseExpr
              .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 200), "优秀")
              .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 100), "良好")
              .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 60), "一般")
              .elseValue("差"),
              UserDisplayDTO::getCreditLevel),
    UserDisplayDTO.class);
```
