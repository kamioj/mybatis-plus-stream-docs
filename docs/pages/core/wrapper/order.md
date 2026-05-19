# order

`ORDER BY` 子句构造器，用于 `list / listJoin / listGroup / stream` 等所有列表方法。

## 升序 {#asc}

```sql
SELECT * FROM user WHERE role = 'user' ORDER BY id ASC LIMIT 10
```

```java
List<User> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    10);
```

## 降序 {#desc}

```sql
SELECT * FROM user WHERE role = 'user' ORDER BY id DESC LIMIT 10
```

```java
List<User> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderDesc(User::getId),
    10);
```

## 多字段排序 {#multi}

```sql
ORDER BY role ASC, id DESC
```

```java
order -> order.orderAsc(User::getRole).orderDesc(User::getId)
```

## 随机排序 {#random}

```sql
ORDER BY RAND()
```

```java
order -> order.orderByRandom(true)
```

带种子（结果可复现，便于测试）：

```sql
ORDER BY RAND(42)
```

```java
order -> order.orderByRandom(true, 42)
```

## 按函数排序 {#by-func}

按字段长度：

```sql
ORDER BY CHAR_LENGTH(username) ASC
```

```java
order -> order.orderFunc(
    func -> func.charLengthFunc(arg -> arg.column(User::getUsername)),
    true)   // true = ASC, false = DESC
```

按聚合（在 GROUP BY 场景）：

```sql
... GROUP BY user_id ORDER BY COUNT(order_id) DESC
```

```java
order -> order.orderFunc(inner -> inner.count(Order::getId), false)
```

## 在 Stream 中使用

```sql
SELECT * FROM user WHERE role = 'user' ORDER BY id DESC LIMIT 10
```

```java
List<User> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderDesc(User::getId))
    .limit(10)
    .collect(Collectors.toList());
```

## 在分组场景使用（按聚合降序取 Top）

```sql
SELECT role, COUNT(*) AS cnt FROM user GROUP BY role
ORDER BY COUNT(*) DESC LIMIT 10
```

```java
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    order -> order.orderFunc(inner -> inner.count(), false),
    10,
    select -> select.select(User::getRole, UserDTO::getRole)
                    .selectFunc(inner -> inner.count(), UserDTO::getCount),
    UserDTO.class);
```

## 方言差异

- **MySQL / PostgreSQL**：`ORDER BY ... NULLS FIRST/LAST` PG 原生支持，MySQL 需 `ORDER BY col IS NULL, col`
- **达梦**：与 PG 类似，`NULLS FIRST/LAST` 原生

当前 `order` API 不直接暴露 `NULLS FIRST/LAST`，需要时通过 `orderFunc` 配合 `IFNULL` 或 `CASE WHEN` 模拟。
