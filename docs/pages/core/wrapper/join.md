# join

无需手写 SQL，用 Lambda 完成类型安全的连表查询。

## JOIN 类型

```java
// LEFT JOIN
join -> join.leftJoin(Order.class, User::getId, Order::getUserId)

// RIGHT JOIN
join -> join.rightJoin(Order.class, User::getId, Order::getUserId)

// INNER JOIN
join -> join.innerJoin(Order.class, User::getId, Order::getUserId)

// CROSS JOIN
join -> join.crossJoin(Order.class, User::getId, Order::getUserId)
```

## 基本用法

### 连表查询 + 映射 DTO

```java
List<UserOrderDTO> list = userService.listJoin(
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    where -> where.isNotNull(Order::getId),
    select -> select.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Order::getStatus, UserOrderDTO::getOrderStatus),
    UserOrderDTO.class);
```

### 连表 + 排序 + 限制

```java
// 返回主实体
List<User> users = userService.listJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.isNotNull(Demand::getId),
    order -> order.orderDesc(User::getId),
    5);
```

### 完整版：连表 + 条件 + 排序 + 限制 + 映射

```java
List<UserOrderDTO> list = userService.listJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.isNotNull(Demand::getId),
    order -> order.orderAsc(User::getUsername),
    3,
    select -> select.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Demand::getServiceType, UserOrderDTO::getServiceType),
    UserOrderDTO.class);
```

## 表别名

当同一张表被 JOIN 多次时，需要用别名区分：

```java
List<UserOrderDTO> list = userService.listJoin(
    join -> join.leftJoin(Demand.class, "d", User::getId, Demand::getUserId),
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Demand::getServiceType, "d", UserOrderDTO::getServiceType),
    UserOrderDTO.class);
```

## 自定义 ON 条件

```java
join -> join.leftJoin(Demand.class, on -> on.eqColumn(User::getId, Demand::getUserId))
```

## 子查询作为 JOIN 表

```java
List<UserOrderDTO> list = userService.listJoin(
    join -> join.leftJoin(
        sub -> sub.from(Demand.class)
            .select(subSelect -> subSelect.select(Demand::getUserId)
                            .selectFunc(func -> func.count(), "cnt"))
            .group(group -> group.groupBy(Demand::getUserId)),
        "dc",
        on -> on.eqColumn(User::getId, null, Demand::getUserId, "dc")),
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    3,
    select -> select.select(User::getUsername, UserOrderDTO::getUsername),
    UserOrderDTO.class);
```

## 连表取值

```java
// 取单个函数值
List<Object> counts = userService.listJoinValues(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.isNotNull(Demand::getId),
    func -> func.count(Demand::getId));

// 带排序限制
List<Object> vals = userService.listJoinValues(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.isNotNull(Demand::getId),
    order -> order.orderAsc(User::getUsername),
    3,
    func -> func.column(User::getUsername));
```

## 连表更新

```java
int updated = userService.updateJoin(
    join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId),
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```

## 连表分页

```java
IPage<UserOrderDTO> page = userService.pageJoin(
    new Page<>(1, 10),
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Order::getStatus, UserOrderDTO::getOrderStatus),
    UserOrderDTO.class);
```

## 方法签名一览

| 方法 | 说明 |
|------|------|
| `listJoin(j, w)` | 连表查询 → 主实体 |
| `listJoin(j, w, s, Class)` | 连表查询 → DTO |
| `listJoin(j, w, o, limit)` | 连表 + 排序限制 → 主实体 |
| `listJoin(j, w, o, limit, s, Class)` | 连表完整版 → DTO |
| `listJoinValues(j, w, func)` | 连表取函数值 |
| `listJoinValues(j, w, o, limit, func)` | 连表取函数值 + 排序限制 |
| `updateJoin(j, set, w)` | 连表更新 |
| `pageJoin(page, j, w, s, Class)` | 连表分页 |
