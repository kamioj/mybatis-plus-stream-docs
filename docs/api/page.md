# 分页查询 (page)

基于 MyBatis-Plus 的 `IPage` 分页，自动计算总数和页数。

## 基础分页

```java
IPage<User> page = userService.page(
    new Page<>(1, 10),  // 第1页，每页10条
    w -> w.eq(User::getRole, "user"));

// 获取结果
List<User> records = page.getRecords();  // 当前页数据
long total = page.getTotal();            // 总记录数
long pages = page.getPages();            // 总页数
```

## 分页 + DTO 映射

```java
IPage<UserDTO> page = userService.page(
    new Page<>(1, 3),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getId, UserDTO::getId)
          .select(User::getUsername, UserDTO::getUsername),
    UserDTO.class);
```

## 连表分页

```java
IPage<UserDTO> page = userService.pageJoin(
    new Page<>(1, 10),
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .select(Order::getStatus, UserDTO::getOrderStatus),
    UserDTO.class);
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

## 连表 + 分组分页

```java
IPage<UserDTO> page = userService.pageGroupJoin(
    new Page<>(1, 10),
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    g -> g.groupBy(User::getUsername),
    w -> {},
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(x -> x.count(), UserDTO::getOrderCount),
    UserDTO.class);
```

## 方法签名一览

| 方法 | 说明 |
|------|------|
| `page(IPage, Where)` | 基础分页 |
| `page(IPage, Where, Select, Class)` | 分页 + DTO |
| `pageJoin(IPage, Join, Where, Select, Class)` | 连表分页 |
| `pageGroup(IPage, Group, Where, Select, Class)` | 分组分页 |
| `pageGroupJoin(IPage, Join, Group, Where, Select, Class)` | 连表分组分页 |
