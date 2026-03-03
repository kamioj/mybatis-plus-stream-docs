# group

分组查询支持聚合统计、HAVING 筛选、连表分组等。

## 基本分组

```java
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserDTO::getStatus)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
// SQL: SELECT role, COUNT(*) FROM user GROUP BY role
```

## 分组 + 排序 + 限制

```java
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    order -> order.orderDesc(User::getRole),
    1,
    select -> select.select(User::getRole, UserDTO::getStatus)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
```

## 分组取值

```java
// 获取每个分组的计数
List<Object> counts = userService.listGroupValues(
    group -> group.groupBy(User::getRole),
    where -> {},
    func -> func.count());

// 带排序限制
List<Long> counts = userService.listGroupValues(
    group -> group.groupBy(User::getRole),
    where -> {},
    order -> order.orderDesc(User::getRole),
    10,
    func -> func.count());
```

## HAVING 筛选

```java
// 只保留计数 > 1 的分组
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole)
          .having(h -> h.gtFunc(f -> f.count(), f -> f.value(1))),
    where -> {},
    select -> select.select(User::getRole, UserDTO::getStatus)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
// SQL: ... GROUP BY role HAVING COUNT(*) > 1
```

## 按函数分组

```java
// 按用户名前4个字符分组
List<UserDTO> list = userService.listGroup(
    group -> group.groupByFunc(f -> f.leftFunc(ff -> ff.column(User::getUsername), 4)),
    where -> {},
    select -> select.selectFunc(func -> func.leftFunc(f -> f.column(User::getUsername), 4), UserDTO::getUsername)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
```

## 连表 + 分组

```java
// 统计每个用户的需求数量
List<UserDTO> list = userService.listGroupJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    group -> group.groupBy(User::getUsername),
    where -> {},
    select -> select.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(func -> func.count(), UserDTO::getDemandCount),
    UserDTO.class);

// 带排序限制
List<UserDTO> list = userService.listGroupJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    group -> group.groupBy(User::getUsername),
    where -> {},
    order -> order.orderDesc(User::getUsername),
    3,
    select -> select.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(func -> func.count(), UserDTO::getDemandCount),
    UserDTO.class);
```

## 连表分组取值

```java
List<Object> counts = userService.listGroupJoinValues(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    group -> group.groupBy(User::getId),
    where -> {},
    func -> func.count(Demand::getId));

// 带排序限制
List<Object> top3 = userService.listGroupJoinValues(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    group -> group.groupBy(User::getId),
    where -> {},
    order -> order.orderFunc(func -> func.count(Demand::getId), false),
    3,
    func -> func.count(Demand::getId));
```

## 分组分页

```java
IPage<UserDTO> page = userService.pageGroup(
    new Page<>(1, 10),
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserDTO::getStatus)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
```

## 常用聚合函数

```java
func -> func.count()                           // COUNT(*)
func -> func.count(User::getId)                // COUNT(id)
func -> func.sum(User::getCreditScore)         // SUM(credit_score)
func -> func.avg(User::getCreditScore)         // AVG(credit_score)
func -> func.max(User::getCreditScore)         // MAX(credit_score)
func -> func.min(User::getCreditScore)         // MIN(credit_score)
func -> func.sumDistinct(User::getCreditScore) // SUM(DISTINCT credit_score)
func -> func.avgDistinct(User::getCreditScore) // AVG(DISTINCT credit_score)
func -> func.groupConcat(User::getUsername)    // GROUP_CONCAT(username)
func -> func.groupConcat(User::getUsername, "|") // GROUP_CONCAT(username SEPARATOR '|')
func -> func.groupFirst(User::getUsername, order -> order.orderAsc(User::getId))  // 组内第一个
func -> func.countPredicate(pw -> pw.eq(User::getRole, "admin"))         // 条件计数
```
