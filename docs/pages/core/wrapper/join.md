# join

多表关联的 lambda 写法，无需手写 SQL。本页以 Stream 形式为主，`userService.listJoin(...)` 作为对照。

## 四种 JOIN 类型

```sql
SELECT * FROM user u
LEFT  JOIN `order` o ON u.id = o.user_id   -- leftJoin
RIGHT JOIN `order` o ON u.id = o.user_id   -- rightJoin
INNER JOIN `order` o ON u.id = o.user_id   -- innerJoin
CROSS JOIN `order` o                       -- crossJoin
```

```java
// 任一类型：
userService.stream()
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))
    // .join(join -> join.rightJoin(Order.class, ...))
    // .join(join -> join.innerJoin(Order.class, ...))
    // .join(join -> join.crossJoin(Order.class, ...))
    .collect(Collectors.toList());
```

## 基础关联 + DTO

```sql
SELECT u.username AS username, o.status AS orderStatus
FROM user u
LEFT JOIN `order` o ON u.id = o.user_id
WHERE o.id IS NOT NULL
```

```java
// Stream 形式
List<UserOrderDTO> list = userService.stream()
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))
    .filter(where -> where.isNotNull(Order::getId))
    .map(select -> select.select(User::getUsername, UserOrderDTO::getUsername)
               .select(Order::getStatus, UserOrderDTO::getOrderStatus),
         UserOrderDTO.class)
    .collect(Collectors.toList());

// 一行语法
List<UserOrderDTO> list = userService.listJoin(
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    where -> where.isNotNull(Order::getId),
    select -> select.select(User::getUsername, UserOrderDTO::getUsername)
                    .select(Order::getStatus, UserOrderDTO::getOrderStatus),
    UserOrderDTO.class);
```

## 关联 + 排序 + 限制（返回主实体）

```sql
SELECT u.*
FROM user u
LEFT JOIN demand d ON u.id = d.user_id
WHERE d.id IS NOT NULL
ORDER BY u.id DESC
LIMIT 5
```

```java
List<User> users = userService.stream()
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .filter(where -> where.isNotNull(Demand::getId))
    .sorted(order -> order.orderDesc(User::getId))
    .limit(5)
    .collect(Collectors.toList());
```

## 完整版：关联 + 条件 + 排序 + 限制 + 映射

```sql
SELECT u.username AS username, d.service_type AS serviceType
FROM user u
LEFT JOIN demand d ON u.id = d.user_id
WHERE d.id IS NOT NULL
ORDER BY u.username ASC
LIMIT 3
```

```java
List<UserOrderDTO> list = userService.stream()
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .filter(where -> where.isNotNull(Demand::getId))
    .sorted(order -> order.orderAsc(User::getUsername))
    .limit(3)
    .map(select -> select.select(User::getUsername, UserOrderDTO::getUsername)
               .select(Demand::getServiceType, UserOrderDTO::getServiceType),
         UserOrderDTO.class)
    .collect(Collectors.toList());
```

## 表别名（自关联或同表多次 JOIN）

```sql
SELECT u.username, d.service_type
FROM user u
LEFT JOIN demand d ON u.id = d.user_id
WHERE u.role = 'user'
```

```java
userService.stream()
    .join(join -> join.leftJoin(Demand.class, "d", User::getId, Demand::getUserId))
    .filter(where -> where.eq(User::getRole, "user"))
    .map(select -> select.select(User::getUsername, UserOrderDTO::getUsername)
               .select(Demand::getServiceType, "d", UserOrderDTO::getServiceType),
         UserOrderDTO.class)
    .collect(Collectors.toList());
```

## 自定义 ON 条件

```sql
LEFT JOIN demand d ON u.id = d.user_id AND d.status = 'active'
```

```java
.join(join -> join.leftJoin(Demand.class, on -> on
    .eqColumn(User::getId, Demand::getUserId)
    .eq(Demand::getStatus, "active")))
```

## 子查询作为 JOIN 右表

```sql
SELECT u.username AS username
FROM user u
LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM demand
    GROUP BY user_id
) dc ON u.id = dc.user_id
WHERE u.role = 'user'
ORDER BY u.id ASC
LIMIT 3
```

```java
List<UserOrderDTO> list = userService.stream()
    .join(join -> join.leftJoin(
        sub -> sub.from(Demand.class)
                  .select(select -> select.select(Demand::getUserId)
                                .selectFunc(inner -> inner.count(), "cnt"))
                  .group(group -> group.groupBy(Demand::getUserId)),
        "dc",
        on -> on.eqColumn(User::getId, null, Demand::getUserId, "dc")))
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .limit(3)
    .map(select -> select.select(User::getUsername, UserOrderDTO::getUsername), UserOrderDTO.class)
    .collect(Collectors.toList());
```

更多子查询场景见 [子查询专章](/pages/core/wrapper/sub-query)。

## 关联取单值

```sql
SELECT COUNT(d.id) FROM user u LEFT JOIN demand d ON u.id = d.user_id WHERE d.id IS NOT NULL
```

```java
// Stream 形式
List<Object> counts = userService.stream()
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .filter(where -> where.isNotNull(Demand::getId))
    .mapToValue(func -> func.count(Demand::getId))
    .collect(Collectors.toList());

// 一行语法
List<Object> counts = userService.listJoinValues(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    where -> where.isNotNull(Demand::getId),
    func -> func.count(Demand::getId));
```

## 关联更新

```sql
UPDATE user u
INNER JOIN demand d ON u.id = d.user_id
SET u.credit_score = 200
WHERE u.username = 'user1'
```

```java
// Stream 形式
userService.executableStream()
    .join(join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .set(set -> set.set(User::getCreditScore, 200))
    .executeUpdate();

// 一行语法
userService.updateJoin(
    join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId),
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```

详见 [update](/pages/core/service/update#updatejoin-——-关联更新)。

## 关联分页

```java
// Stream 形式
IPage<UserOrderDTO> page = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))
    .map(select -> select.select(User::getUsername, UserOrderDTO::getUsername)
               .select(Order::getStatus, UserOrderDTO::getOrderStatus),
         UserOrderDTO.class)
    .page(new Page<>(1, 10));

// 一行语法 — 见 page.md
```

::: warning 一对多关联分页坑
`pageJoin` 在一对多场景下 `COUNT(*)` 会重复计数（同一 user 出现多次）。改用 `pageGroupJoin` 或 `stream().group().join().page()`，详见 [page](/pages/core/service/page#注意)。
:::

## 相关

- [Stream API](/pages/core/stream/stream)
- [子查询](/pages/core/wrapper/sub-query) — JOIN (SELECT ...) 衍生表
- [group](/pages/core/wrapper/group) — 关联分组
- [page](/pages/core/service/page) — pageJoin 分页坑
