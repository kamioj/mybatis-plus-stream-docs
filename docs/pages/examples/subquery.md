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
    .existSubSql(
        sub -> sub.from(Demand.class)
            .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)
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
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
              UserWithDemandCountDTO::getDemandCount),
    UserWithDemandCountDTO.class);
```

## WHERE 子查询比较

积分高于平均值的用户：

```java
List<User> aboveAvg = userService.list(where -> where
    .gtSubSql(User::getCreditScore,
        sub -> sub.from(User.class)
            .select(select -> select.selectFunc(
                func -> func.avg(User::getCreditScore), SingleValue::getValue))));
```

生成 SQL：
```sql
SELECT * FROM user
WHERE credit_score > (SELECT AVG(credit_score) FROM user)
```

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
          .selectCase(c -> c
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 200), "优秀")
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "良好")
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 60), "一般")
              .elseValue("差"),
              UserDisplayDTO::getCreditLevel),
    UserDisplayDTO.class);
```
