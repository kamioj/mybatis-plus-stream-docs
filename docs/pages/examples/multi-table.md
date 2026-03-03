# 多表关联查询

## 用户 + 需求（一对多）

查询用户及其发布的需求信息：

```java
@Data
public class UserDemandDTO {
    private String username;
    private String serviceType;
    private String demandStatus;
}

List<UserDemandDTO> list = userService.listJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.eq(User::getRole, "user"),
    order -> order.orderDesc(User::getId),
    20,
    select -> select.select(User::getUsername, UserDemandDTO::getUsername)
          .select(Demand::getServiceType, UserDemandDTO::getServiceType)
          .select(Demand::getStatus, UserDemandDTO::getDemandStatus),
    UserDemandDTO.class);
```

## 三表关联（用户 + 需求 + 订单）

```java
@Data
public class FullOrderDTO {
    private String username;
    private String serviceType;
    private String orderStatus;
    private LocalDateTime createTime;
}

List<FullOrderDTO> list = userService.listJoin(
    join -> join
        .innerJoin(Demand.class, User::getId, Demand::getUserId)
        .innerJoin(Order.class, Demand::getId, Order::getDemandId),
    where -> where.eq(Order::getStatus, "已完成"),
    order -> order.orderDesc(Order::getCreateTime),
    50,
    select -> select.select(User::getUsername, FullOrderDTO::getUsername)
          .select(Demand::getServiceType, FullOrderDTO::getServiceType)
          .select(Order::getStatus, FullOrderDTO::getOrderStatus)
          .select(Order::getCreateTime, FullOrderDTO::getCreateTime),
    FullOrderDTO.class);
```

## 连表 + WHERE 条件引用关联表字段

```java
// 查询有"遛狗"需求的用户
List<User> dogWalkers = userService.listJoin(
    join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where
        .eq(Demand::getServiceType, "遛狗")
        .eq(Demand::getStatus, "待接单"),
    order -> order.orderAsc(User::getId),
    10);
```

## 连表分页

```java
IPage<UserDemandDTO> page = userService.pageJoin(
    new Page<>(1, 10),
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserDemandDTO::getUsername)
          .select(Demand::getServiceType, UserDemandDTO::getServiceType)
          .select(Demand::getStatus, UserDemandDTO::getDemandStatus),
    UserDemandDTO.class);

List<UserDemandDTO> records = page.getRecords();
long total = page.getTotal();
```

## 连表更新

将有已完成订单的用户积分 +10：

```java
int updated = userService.updateJoin(
    join -> join.innerJoin(Order.class, User::getId, Order::getUserId),
    set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 10)),
    where -> where.eq(Order::getStatus, "已完成"));
```

## 自关联（推荐人查询）

假设 User 表有 `referrerId` 字段，查用户和推荐人：

```java
@Data
public class UserReferrerDTO {
    private String username;
    private String referrerName;
}

List<UserReferrerDTO> list = userService.listJoin(
    join -> join.leftJoin(User.class, "referrer", User::getReferrerId, User::getId),
    where -> where.isNotNull(User::getReferrerId),
    select -> select.select(User::getUsername, UserReferrerDTO::getUsername)
          .selectAs("referrer", User::getUsername, UserReferrerDTO::getReferrerName),
    UserReferrerDTO.class);
```
