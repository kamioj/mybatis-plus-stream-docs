# group

GROUP BY 分组聚合。**简单聚合优先用 `stream().toMapCount/Sum/Avg/Max/Min`**（一行搞定），复杂场景（HAVING / 多 select 列 / 按函数分组 / 连表分组）才用 `group()` 链式或 `listGroup` 一行语法。

## 最常用：toMapCount {#to-map-count}

```sql
SELECT role, COUNT(*) FROM user GROUP BY role
```

```java
Map<String, Long> countByRole = userService.stream().toMapCount(User::getRole);
// { "admin": 3, "user": 42, "guest": 17 }
```

更多收集器（`toMapSum / toMapAvg / toMapMax / toMapMin`）见 [Stream 收集器](/pages/core/stream/collectors)。

## 多列分组聚合 {#multi-column}

```sql
SELECT role AS status, COUNT(*) AS cnt
FROM user
GROUP BY role
```

```java
// Stream 形式
List<UserDTO> list = userService.stream()
    .map(select -> select.select(User::getRole, UserDTO::getStatus)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .group(group -> group.groupBy(User::getRole))
    .collect(Collectors.toList());

// 一行语法
List<UserDTO> list = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserDTO::getStatus)
                    .selectFunc(inner -> inner.count(), UserDTO::getCount),
    UserDTO.class);
```

## 分组 + 排序 + 限制 {#order-limit}

```sql
SELECT role AS status, COUNT(*) AS cnt
FROM user
GROUP BY role
ORDER BY role DESC
LIMIT 1
```

```java
List<UserDTO> list = userService.stream()
    .map(select -> select.select(User::getRole, UserDTO::getStatus)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .group(group -> group.groupBy(User::getRole))
    .sorted(order -> order.orderDesc(User::getRole))
    .limit(1)
    .collect(Collectors.toList());
```

## HAVING 子句 {#having}

```sql
SELECT role AS status, COUNT(*) AS cnt
FROM user
GROUP BY role
HAVING COUNT(*) > 1
```

```java
userService.stream()
    .map(select -> select.select(User::getRole, UserDTO::getStatus)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .group(group -> group.groupBy(User::getRole)
                 .having(h -> h.gtFunc(inner -> inner.count(), arg -> arg.value(1))))
    .collect(Collectors.toList());
```

## 按函数分组 {#group-by-func}

```sql
SELECT LEFT(username, 4) AS username, COUNT(*) AS cnt
FROM user
GROUP BY LEFT(username, 4)
```

```java
userService.stream()
    .map(select -> select.selectFunc(inner -> inner.leftFunc(arg -> arg.column(User::getUsername), 4),
                           UserDTO::getUsername)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .group(group -> group.groupByFunc(inner -> inner.leftFunc(inner -> inner.column(User::getUsername), 4)))
    .collect(Collectors.toList());
```

## 关联 + 分组 {#join-group}

```sql
SELECT u.username AS username, COUNT(*) AS demandCount
FROM user u
LEFT JOIN demand d ON u.id = d.user_id
GROUP BY u.username
```

```java
// Stream 形式
userService.stream()
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .selectFunc(inner -> inner.count(), UserDTO::getDemandCount),
         UserDTO.class)
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .group(group -> group.groupBy(User::getUsername))
    .collect(Collectors.toList());

// 一行语法
List<UserDTO> list = userService.listGroupJoin(
    join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId),
    group -> group.groupBy(User::getUsername),
    where -> {},
    select -> select.select(User::getUsername, UserDTO::getUsername)
                    .selectFunc(inner -> inner.count(), UserDTO::getDemandCount),
    UserDTO.class);
```

## 关联分组取单值 {#join-group-values}

```sql
SELECT COUNT(d.id) FROM user u LEFT JOIN demand d ON u.id = d.user_id GROUP BY u.id
```

```java
List<Object> counts = userService.stream()
    .mapToValue(func -> func.count(Demand::getId))
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .group(group -> group.groupBy(User::getId))
    .collect(Collectors.toList());
```

按聚合值排序取 Top3：

```sql
SELECT COUNT(d.id) FROM user u LEFT JOIN demand d ON u.id = d.user_id
GROUP BY u.id ORDER BY COUNT(d.id) DESC LIMIT 3
```

```java
List<Object> top3 = userService.stream()
    .mapToValue(func -> func.count(Demand::getId))
    .join(join -> join.leftJoin(Demand.class, User::getId, Demand::getUserId))
    .group(group -> group.groupBy(User::getId))
    .sorted(order -> order.orderFunc(inner -> inner.count(Demand::getId), false))
    .limit(3)
    .collect(Collectors.toList());
```

## 分组分页 {#page-group}

```sql
SELECT role AS status, COUNT(*) AS cnt
FROM user GROUP BY role
LIMIT 10 OFFSET 0
```

```java
IPage<UserDTO> page = userService.stream()
    .map(select -> select.select(User::getRole, UserDTO::getStatus)
               .selectFunc(inner -> inner.count(), UserDTO::getCount),
         UserDTO.class)
    .group(group -> group.groupBy(User::getRole))
    .page(new Page<>(1, 10));
```

## 常用聚合函数（func 内）

| 函数 | SQL |
|---|---|
| `func.count()` | `COUNT(*)` |
| `func.count(User::getId)` | `COUNT(id)` |
| `func.sum(User::getCreditScore)` | `SUM(credit_score)` |
| `func.avg(User::getCreditScore)` | `AVG(credit_score)` |
| `func.max(User::getCreditScore)` | `MAX(credit_score)` |
| `func.min(User::getCreditScore)` | `MIN(credit_score)` |
| `func.sumDistinct(User::getCreditScore)` | `SUM(DISTINCT credit_score)` |
| `func.groupConcat(User::getUsername)` | `GROUP_CONCAT(username)` MySQL / `STRING_AGG(username, ',')` PG |
| `func.groupConcat(User::getUsername, "\|")` | `GROUP_CONCAT(username SEPARATOR '\|')` |
| `func.groupFirst(User::getUsername, order -> order.orderAsc(User::getId))` | 组内第一个 |
| `func.countPredicate(p -> p.eq(User::getRole, "admin"))` | `SUM(CASE WHEN role='admin' THEN 1 ELSE 0 END)` |

## 何时用 toMapXxx，何时用 listGroup

| 场景 | 推荐 |
|---|---|
| 一个 key + 一个聚合值（计数/求和/平均/最大/最小） | `stream().toMapCount/Sum/Avg/Max/Min` |
| 一个 key + 多个聚合列 / DTO 字段 | `stream().group().map(...).collect()` |
| 要 HAVING / 按函数分组 / 关联分组 | `stream().group(...).collect()` |
| 分页 | `stream().group().page(...)` |

## 相关

- [Stream 收集器](/pages/core/stream/collectors) — `toMapCount` 等下推聚合
- [函数表达式](/pages/core/wrapper/functions)
- [select](/pages/core/wrapper/select) — 多列 DTO 映射
- [order](/pages/core/wrapper/order)
