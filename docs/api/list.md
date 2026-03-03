# 列表查询 (list)

获取满足条件的多条记录。

## 按字段查询

```java
List<User> users = userService.list(User::getRole, "user");
```

## 按条件查询

```java
List<User> users = userService.list(w -> w.eq(User::getRole, "user"));
```

## 条件 + 排序 + 限制条数

```java
List<User> top5 = userService.list(
    w -> w.eq(User::getRole, "user"),
    o -> o.orderDesc(User::getId),
    5);
```

## 映射到 DTO

```java
// 无排序
List<UserDTO> list = userService.list(
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserDTO::getUsername),
    UserDTO.class);

// 完整版：条件 + 排序 + 限制 + 映射
List<UserDTO> list = userService.list(
    w -> w.eq(User::getRole, "user"),
    o -> o.orderAsc(User::getId),
    3,
    s -> s.select(User::getUsername, UserDTO::getUsername)
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

## 排序方式

```java
// 升序
o -> o.orderAsc(User::getId)

// 降序
o -> o.orderDesc(User::getId)

// 多字段排序
o -> o.orderAsc(User::getRole).orderDesc(User::getId)

// 随机排序
o -> o.orderByRandom(true)

// 带种子随机（结果可复现）
o -> o.orderByRandom(true, 42)

// 按函数排序
o -> o.orderFunc(x -> x.charLengthFunc(f -> f.column(User::getUsername)), true)
```
