# JOIN 连表查询

无需手写 SQL，用 Lambda 完成类型安全的连表查询。

## JOIN 类型

```java
// LEFT JOIN
j -> j.leftJoin(Order.class, User::getId, Order::getUserId)

// RIGHT JOIN
j -> j.rightJoin(Order.class, User::getId, Order::getUserId)

// INNER JOIN
j -> j.innerJoin(Order.class, User::getId, Order::getUserId)

// CROSS JOIN
j -> j.crossJoin(Order.class, User::getId, Order::getUserId)
```

## 基本用法

### 连表查询 + 映射 DTO

```java
List<UserOrderDTO> list = userService.listJoin(
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    w -> w.isNotNull(Order::getId),
    s -> s.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Order::getStatus, UserOrderDTO::getOrderStatus),
    UserOrderDTO.class);
```

### 连表 + 排序 + 限制

```java
// 返回主实体
List<User> users = userService.listJoin(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    w -> w.isNotNull(Demand::getId),
    o -> o.orderDesc(User::getId),
    5);
```

### 完整版：连表 + 条件 + 排序 + 限制 + 映射

```java
List<UserOrderDTO> list = userService.listJoin(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    w -> w.isNotNull(Demand::getId),
    o -> o.orderAsc(User::getUsername),
    3,
    s -> s.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Demand::getServiceType, UserOrderDTO::getServiceType),
    UserOrderDTO.class);
```

## 表别名

当同一张表被 JOIN 多次时，需要用别名区分：

```java
List<UserOrderDTO> list = userService.listJoin(
    j -> j.leftJoin(Demand.class, "d", User::getId, Demand::getUserId),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserOrderDTO::getUsername)
          .select(Demand::getServiceType, "d", UserOrderDTO::getServiceType),
    UserOrderDTO.class);
```

## 自定义 ON 条件

```java
j -> j.leftJoin(Demand.class, on -> on.eqColumn(User::getId, Demand::getUserId))
```

## 子查询作为 JOIN 表

```java
List<UserOrderDTO> list = userService.listJoin(
    j -> j.leftJoin(
        sub -> sub.from(Demand.class)
            .select(ss -> ss.select(Demand::getUserId)
                            .selectFunc(x -> x.count(), "cnt"))
            .group(g -> g.groupBy(Demand::getUserId)),
        "dc",
        on -> on.eqColumn(User::getId, null, Demand::getUserId, "dc")),
    w -> w.eq(User::getRole, "user"),
    o -> o.orderAsc(User::getId),
    3,
    s -> s.select(User::getUsername, UserOrderDTO::getUsername),
    UserOrderDTO.class);
```

## 连表取值

```java
// 取单个函数值
List<Object> counts = userService.listJoinValues(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    w -> w.isNotNull(Demand::getId),
    x -> x.count(Demand::getId));

// 带排序限制
List<Object> vals = userService.listJoinValues(
    j -> j.leftJoin(Demand.class, User::getId, Demand::getUserId),
    w -> w.isNotNull(Demand::getId),
    o -> o.orderAsc(User::getUsername),
    3,
    x -> x.column(User::getUsername));
```

## 连表更新

```java
int updated = userService.updateJoin(
    j -> j.innerJoin(Demand.class, User::getId, Demand::getUserId),
    s -> s.set(User::getCreditScore, 200),
    w -> w.eq(User::getUsername, "user1"));
```

## 连表分页

```java
IPage<UserOrderDTO> page = userService.pageJoin(
    new Page<>(1, 10),
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserOrderDTO::getUsername)
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
