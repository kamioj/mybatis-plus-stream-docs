# order

ORDER BY 排序构造器，用于 `list`、`listJoin`、`listGroup`、`stream` 等方法。

## 方法签名

排序通过 `Consumer<OrderLambdaQueryWrapper>` 回调传入：

```java
order -> order.orderAsc(User::getId)     // 升序
order -> order.orderDesc(User::getId)    // 降序
```

## 升序

```java
List<User> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    10);
```

## 降序

```java
List<User> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderDesc(User::getId),
    10);
```

## 多字段排序

```java
order -> order.orderAsc(User::getRole).orderDesc(User::getId)
// SQL: ORDER BY role ASC, id DESC
```

## 随机排序

```java
// 随机排序
order -> order.orderByRandom(true)
// SQL: ORDER BY RAND()

// 带种子随机（结果可复现）
order -> order.orderByRandom(true, 42)
// SQL: ORDER BY RAND(42)
```

## 按函数排序

```java
// 按用户名长度排序
order -> order.orderFunc(func -> func.charLengthFunc(f -> f.column(User::getUsername)), true)
// SQL: ORDER BY CHAR_LENGTH(username) ASC

// 按计数排序（常用于 GROUP BY）
order -> order.orderFunc(func -> func.count(Order::getId), false)
// SQL: ORDER BY COUNT(order_id) DESC
```

## 在 Stream 中使用

```java
List<User> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderDesc(User::getId))
    .limit(10)
    .collect(Collectors.toList());
```

## 在分组查询中使用

```java
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    order -> order.orderFunc(func -> func.count(), false),  // 按计数降序
    10,
    select -> select.select(User::getRole, UserDTO::getRole)
          .selectFunc(func -> func.count(), UserDTO::getCount),
    UserDTO.class);
```
