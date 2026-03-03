# 统计报表

## 按角色统计

```java
@Data
public class RoleStatsDTO {
    private String role;
    private Long count;
    private Double avgScore;
    private Integer maxScore;
}

List<RoleStatsDTO> stats = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, RoleStatsDTO::getRole)
          .selectFunc(func -> func.count(), RoleStatsDTO::getCount)
          .selectFunc(func -> func.avg(User::getCreditScore), RoleStatsDTO::getAvgScore)
          .selectFunc(func -> func.max(User::getCreditScore), RoleStatsDTO::getMaxScore),
    RoleStatsDTO.class);
```

## 连表统计（用户 + 订单数）

统计每个用户的订单数量，按订单数降序取 Top 10：

```java
@Data
public class UserOrderStatsDTO {
    private String username;
    private Long orderCount;
    private Double avgScore;
}

List<UserOrderStatsDTO> top10 = userService.listGroupJoin(
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    group -> group.groupBy(User::getId),
    where -> where.eq(User::getRole, "user"),
    order -> order.orderFunc(func -> func.count(Order::getId), false),
    10,
    select -> select.select(User::getUsername, UserOrderStatsDTO::getUsername)
          .selectFunc(func -> func.count(Order::getId), UserOrderStatsDTO::getOrderCount),
    UserOrderStatsDTO.class);
```

## 子查询统计（无需 GROUP BY）

直接用子查询 SELECT 作为统计列，不需要 GROUP BY：

```java
@Data
public class UserDetailDTO {
    private String username;
    private Integer score;
    private Long demandCount;
    private Long orderCount;
}

List<UserDetailDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    10,
    select -> select.select(User::getUsername, UserDetailDTO::getUsername)
          .select(User::getCreditScore, UserDetailDTO::getScore)
          .selectSubSql(
              sub -> sub.from(Demand.class)
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
              UserDetailDTO::getDemandCount)
          .selectSubSql(
              sub -> sub.from(Order.class)
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Order::getUserId, User::getId)),
              UserDetailDTO::getOrderCount),
    UserDetailDTO.class);
```

## HAVING 过滤

只统计订单数 ≥ 5 的用户：

```java
List<UserOrderStatsDTO> activeUsers = userService.listGroupJoin(
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    group -> group.groupBy(User::getId)
                  .having(func -> func.count(Order::getId), 5, ">="),
    where -> {},
    select -> select.select(User::getUsername, UserOrderStatsDTO::getUsername)
          .selectFunc(func -> func.count(Order::getId), UserOrderStatsDTO::getOrderCount),
    UserOrderStatsDTO.class);
```

## 按日期分组统计

按月统计注册用户数：

```java
@Data
public class MonthlyStatsDTO {
    private String month;
    private Long count;
}

List<MonthlyStatsDTO> monthly = userService.listGroup(
    group -> group.groupByFunc(func -> func.dateFormatFunc(
        f -> f.column(User::getCreateTime), "%Y-%m")),
    where -> {},
    order -> order.orderFunc(func -> func.dateFormatFunc(
        f -> f.column(User::getCreateTime), "%Y-%m"), true),
    12,
    select -> select.selectFunc(func -> func.dateFormatFunc(
            f -> f.column(User::getCreateTime), "%Y-%m"), MonthlyStatsDTO::getMonth)
          .selectFunc(func -> func.count(), MonthlyStatsDTO::getCount),
    MonthlyStatsDTO.class);
```

## GROUP_CONCAT 聚合

每个角色下的所有用户名拼接成一行：

```java
@Data
public class RoleUsersDTO {
    private String role;
    private Long count;
    private String allUsernames;
}

List<RoleUsersDTO> result = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, RoleUsersDTO::getRole)
          .selectFunc(func -> func.count(), RoleUsersDTO::getCount)
          .selectFunc(func -> func.groupConcat(User::getUsername, ","), RoleUsersDTO::getAllUsernames),
    RoleUsersDTO.class);
// 结果: {role: "user", count: 10, allUsernames: "user1,user2,..."}
```
