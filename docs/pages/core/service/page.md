# page

分页查询，**自动跑两条 SQL**：`COUNT(*)` 算总数 + 带 `LIMIT/OFFSET` 取当前页。

::: warning 前置
必须配置 `PaginationInnerInterceptor`，否则不会真分页。详见 [安装 - 分页插件配置](/pages/quickstart/install#分页插件配置)。
:::

## 基础分页

```sql
SELECT COUNT(*) FROM user WHERE role = 'user'
SELECT * FROM user WHERE role = 'user' LIMIT 10 OFFSET 0
```

```java
// Stream 形式
IPage<User> page = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .page(new Page<>(1, 10));

// 一行语法
IPage<User> page = userService.page(
    new Page<>(1, 10),
    where -> where.eq(User::getRole, "user"));
```

取数据：

```java
List<User> records = page.getRecords();
long total        = page.getTotal();
long pages        = page.getPages();
```

## 分页 + 排序 + DTO

```sql
SELECT username AS username, id AS id
FROM user WHERE role = 'user'
ORDER BY id ASC
LIMIT 3 OFFSET 0
```

```java
// Stream 形式
IPage<UserDTO> page = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .select(User::getId,       UserDTO::getId),
         UserDTO.class)
    .page(new Page<>(1, 3));

// 一行语法
IPage<UserDTO> page = userService.page(
    new Page<>(1, 3),
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserDTO::getUsername)
                    .select(User::getId,       UserDTO::getId),
    UserDTO.class);
```

## 关联分页 pageJoin

```sql
SELECT u.username, o.status
FROM user u LEFT JOIN `order` o ON u.id = o.user_id
WHERE u.role = 'user'
LIMIT 10 OFFSET 0
```

```java
// Stream 形式
IPage<UserDTO> page = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .select(Order::getStatus, UserDTO::getOrderStatus),
         UserDTO.class)
    .page(new Page<>(1, 10));

// 一行语法
IPage<UserDTO> page = userService.pageJoin(
    new Page<>(1, 10),
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername, UserDTO::getUsername)
                    .select(Order::getStatus, UserDTO::getOrderStatus),
    UserDTO.class);
```

## 分组分页 pageGroup

```sql
SELECT role AS status, COUNT(*) AS cnt
FROM user GROUP BY role
LIMIT 10 OFFSET 0
```

```java
// Stream 形式
IPage<UserDTO> page = userService.stream()
    .group(group -> group.groupBy(User::getRole))
    .map(select -> select.select(User::getRole, UserDTO::getStatus)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .page(new Page<>(1, 10));

// 一行语法
IPage<UserDTO> page = userService.pageGroup(
    new Page<>(1, 10),
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserDTO::getStatus)
                    .selectFunc(inner -> inner.count(), UserDTO::getCount),
    UserDTO.class);
```

## 一行语法 ↔ Stream 形式对照表

| 一行语法 | Stream 形式 |
|---|---|
| `page(IPage, Where)` | `.filter(w -> ...).page(IPage)` |
| `page(IPage, Where, Select, Class)` | `.filter(...).map(s -> ..., DTO.class).page(IPage)` |
| `pageJoin(IPage, Join, Where, Select, Class)` | `.filter().join().map().page()` |
| `pageGroup(IPage, Group, Where, Select, Class)` | `.group().map().page()` |
| `pageGroupJoin(IPage, Join, Group, Where, Select, Class)` | `.group().join().map().page()` |

## 注意

::: warning 一对多分页的 count 准确性
当 `pageJoin` 涉及一对多（一个 user 多个 order），LEFT JOIN 会让 user 行重复，`COUNT(*)` 会把重复算上，**总数会偏大**。

对策：
1. 改用 `pageGroupJoin` / `stream().group().join().page()`，在 GROUP BY 之后 COUNT 才是正确的"用户数"
2. 或者先 `userService.count(...)` 单独算总数，再用 `listJoin` 取当前页
:::

## 相关

- [Stream API 全景](/pages/core/stream/stream)
- [list](/pages/core/service/list) — 不带总数的多条查询
