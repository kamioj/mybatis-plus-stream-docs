# list

获取满足条件的多条记录。

## 按字段查询

```java
List<User> users = userService.list(User::getRole, "user");
```

## 按条件查询

```java
List<User> users = userService.list(where -> where.eq(User::getRole, "user"));
```

## 条件 + 排序 + 限制条数

```java
List<User> top5 = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderDesc(User::getId),
    5);
```

## 映射到 DTO

```java
// 无排序
List<UserDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserDTO::getUsername),
    UserDTO.class);

// 完整版：条件 + 排序 + 限制 + 映射
List<UserDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    3,
    select -> select.select(User::getUsername, UserDTO::getUsername)
          .select(User::getCreditScore, UserDTO::getScore),
    UserDTO.class);
```

## 方法签名一览

| 方法 | 参数 | 说明 |
|------|------|------|
| `list(SFunction, Object)` | 字段 + 值 | 按字段查 |
| `list(Consumer<Where>)` | 条件 | 按条件查 |
| `list(Where, Select, Class)` | 条件 + 映射 | 映射到 DTO |
| `list(Where, Order, limit)` | 条件 + 排序 + 限制 | 带排序限制 |
| `list(Where, Order, limit, Select, Class)` | 全参数 | 完整版 |

::: tip
排序的完整用法详见 [order](/pages/core/wrapper/order) 章节。
:::
