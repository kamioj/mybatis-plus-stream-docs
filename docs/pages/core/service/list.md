# list

获取满足条件的**多条**记录。本页同时给出 [`stream()` 链式](/pages/core/stream/stream) 形式（链式可读、组合性强）和 `userService.list(...)` 一行语法两种写法——本框架主推前者，后者是它的一行简写。

## 按条件查询

```sql
SELECT * FROM user WHERE role = 'user'
```

```java
// Stream 形式
List<User> users = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toList());

// 一行语法
List<User> users = userService.list(where -> where.eq(User::getRole, "user"));
```

多条件（AND）：

```sql
SELECT * FROM user WHERE role = 'user' AND credit_score >= 100
```

```java
List<User> users = userService.stream()
    .filter(where -> where.eq(User::getRole, "user").ge(User::getCreditScore, 100))
    .collect(Collectors.toList());

// 一行语法
List<User> users = userService.list(w -> w
    .eq(User::getRole, "user").ge(User::getCreditScore, 100));
```

## 按字段精确匹配

```sql
SELECT * FROM user WHERE role = 'user'
```

```java
// Stream 形式
List<User> users = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toList());

// 一行语法（单字段速记）
List<User> users = userService.list(User::getRole, "user");
```

## 条件 + 排序 + 限制

```sql
SELECT * FROM user WHERE role = 'user' ORDER BY id DESC LIMIT 5
```

```java
// Stream 形式，每一步对应一段 SQL
List<User> top5 = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderDesc(User::getId))
    .limit(5)
    .collect(Collectors.toList());

// 一行语法
List<User> top5 = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderDesc(User::getId),
    5);
```

## 映射到 DTO

```sql
SELECT username AS username, credit_score AS score
FROM user
WHERE role = 'user'
```

```java
@Data
class UserDTO {
    private String username;
    private Integer score;
}

// Stream 形式
List<UserDTO> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .collect(Collectors.toList());

// 一行语法
List<UserDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    select -> select.select(User::getUsername,    UserDTO::getUsername)
          .select(User::getCreditScore, UserDTO::getScore),
    UserDTO.class);
```

## 完整：条件 + 排序 + 限制 + 映射

```sql
SELECT username AS username, credit_score AS score
FROM user
WHERE role = 'user'
ORDER BY id ASC
LIMIT 3
```

```java
List<UserDTO> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .limit(3)
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .collect(Collectors.toList());
```

::: tip 为什么用 Stream 形式
- **每段对应 SQL 一句**：`.filter()` = WHERE，`.sorted()` = ORDER BY，`.limit()` = LIMIT，`.map()` = SELECT/AS
- **不固化**：要去重就加 `.distinct()`、要分组聚合就改 `.toMapCount()`、要前 N 之后再过滤就 `.peek()`，**视觉骨架不变**
- **重构友好**：从"查所有"变成"查所有再分组"只是末尾换一个 collector，不用换整个方法签名
:::

## 一行语法 ↔ Stream 形式对照表

| 一行语法 | Stream 形式 |
|---|---|
| `list(SFunction, Object)` | `.filter(where -> where.eq(col, val)).collect(toList())` |
| `list(Consumer<Where>)` | `.filter(w -> ...).collect(toList())` |
| `list(Where, Select, Class)` | `.filter(...).map(s -> ..., DTO.class).collect(toList())` |
| `list(Where, Order, limit)` | `.filter(...).sorted(...).limit(n).collect(toList())` |
| `list(Where, Order, limit, Select, Class)` | `.filter().sorted().limit().map().collect()` |

## 相关

- [stream API 全景](/pages/core/stream/stream) — 流式 API 的全部操作
- [Stream 收集器](/pages/core/stream/collectors) — `toMap / toGroupMap / toMapCount` 等 SQL 下推聚合
- [page](/pages/core/service/page) — 分页（也有 `stream().page()` 形式）
- [select 完整用法](/pages/core/wrapper/select)
- [order 完整用法](/pages/core/wrapper/order)
