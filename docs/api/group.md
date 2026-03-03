# GROUP BY 分组

分组查询支持聚合统计、HAVING 筛选、连表分组等。

## 基本分组

```java
List<UserDTO> list = userService.listGroup(
    g -> g.groupBy(User::getRole),
    w -> {},
    s -> s.select(User::getRole, UserDTO::getStatus)
          .selectFunc(x -> x.count(), UserDTO::getCount),
    UserDTO.class);
// SQL: SELECT role, COUNT(*) FROM user GROUP BY role
```

## 分组 + 排序 + 限制

```java
List<UserDTO> list = userService.listGroup(
    g -> g.groupBy(User::getRole),
    w -> {},
    o -> o.orderDesc(User::getRole),
    1,
    s -> s.select(User::getRole, UserDTO::getStatus)
          .selectFunc(x -> x.count(), UserDTO::getCount),
    UserDTO.class);
```

## 分组取值

```java
// 获取每个分组的计数
List<Object> counts = userService.listGroupValues(
    g -> g.groupBy(User::getRole),
    w -> {},
    x -> x.count());

// 带排序限制
List<Long> counts = userService.listGroupValues(
    g -> g.groupBy(User::getRole),
    w -> {},
    o -> o.orderDesc(User::getRole),
    10,
    x -> x.count());
```

## HAVING 筛选

```java
// 只保留计数 > 1 的分组
List<UserDTO> list = userService.listGroup(
    g -> g.groupBy(User::getRole)
          .having(h -> h.gtFunc(f -> f.count(), f -> f.value(1))),
    w -> {},
    s -> s.select(User::getRole, UserDTO::getStatus)
          .selectFunc(x -> x.count(), UserDTO::getCount),
    UserDTO.class);
// SQL: ... GROUP BY role HAVING COUNT(*) > 1
```

## 按函数分组

```java
// 按用户名前4个字符分组
List<UserDTO> list = userService.listGroup(
    g -> g.groupByFunc(f -> f.leftFunc(ff -> ff.column(User::getUsername), 4)),
    w -> {},
    s -> s.selectFunc(x -> x.leftFunc(f -> f.column(User::getUsername), 4), UserDTO::getUsername)
          .selectFunc(x -> x.count(), UserDTO::getCount),
    UserDTO.class);
```

## 连表 + 分组

```java
// 统计每个用户的需求数量
List<UserDTO> list = userService.listGroupJoin(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    g -> g.groupBy(User::getUsername),
    w -> {},
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(x -> x.count(), UserDTO::getDemandCount),
    UserDTO.class);

// 带排序限制
List<UserDTO> list = userService.listGroupJoin(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    g -> g.groupBy(User::getUsername),
    w -> {},
    o -> o.orderDesc(User::getUsername),
    3,
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(x -> x.count(), UserDTO::getDemandCount),
    UserDTO.class);
```

## 连表分组取值

```java
List<Object> counts = userService.listGroupJoinValues(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    g -> g.groupBy(User::getId),
    w -> {},
    x -> x.count(Demand::getId));

// 带排序限制
List<Object> top3 = userService.listGroupJoinValues(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    g -> g.groupBy(User::getId),
    w -> {},
    o -> o.orderFunc(x -> x.count(Demand::getId), false),
    3,
    x -> x.count(Demand::getId));
```

## 分组分页

```java
IPage<UserDTO> page = userService.pageGroup(
    new Page<>(1, 10),
    g -> g.groupBy(User::getRole),
    w -> {},
    s -> s.select(User::getRole, UserDTO::getStatus)
          .selectFunc(x -> x.count(), UserDTO::getCount),
    UserDTO.class);
```

## 常用聚合函数

```java
x -> x.count()                           // COUNT(*)
x -> x.count(User::getId)                // COUNT(id)
x -> x.sum(User::getCreditScore)         // SUM(credit_score)
x -> x.avg(User::getCreditScore)         // AVG(credit_score)
x -> x.max(User::getCreditScore)         // MAX(credit_score)
x -> x.min(User::getCreditScore)         // MIN(credit_score)
x -> x.sumDistinct(User::getCreditScore) // SUM(DISTINCT credit_score)
x -> x.avgDistinct(User::getCreditScore) // AVG(DISTINCT credit_score)
x -> x.groupConcat(User::getUsername)    // GROUP_CONCAT(username)
x -> x.groupConcat(User::getUsername, "|") // GROUP_CONCAT(username SEPARATOR '|')
x -> x.groupFirst(User::getUsername, o -> o.orderAsc(User::getId))  // 组内第一个
x -> x.countPredicate(pw -> pw.eq(User::getRole, "admin"))         // 条件计数
```
