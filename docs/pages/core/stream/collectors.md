# Stream 收集器

`stream()` 流的终端操作。**重点是：这些收集器会把分组、聚合下推到 SQL 层**，而不是把所有行先拉回 Java 再用 JDK Stream 处理。

## 总览

| 收集器 | 生成的 SQL | 返回 |
|---|---|---|
| `toSet(col)` | `SELECT col FROM ...` | `Set<K>` 单列去重 |
| `toMap(keyCol, valCol)` | `SELECT keyCol, valCol FROM ...` | `Map<K,V>` 两列映射 |
| `toMap(keyCol, valCol, merger)` | 同上 | `Map<K,V>` Key 冲突时自定义合并 |
| `groupingBy(keyCol)` | `SELECT * FROM ...`（**不下推 GROUP BY**） | `Map<K,List<T>>` 应用层分组 |
| `toMapCount(keyCol)` | `SELECT keyCol, COUNT(*) GROUP BY keyCol` | `Map<K,Long>` |
| `toMapSum(keyCol, sumCol)` | `SELECT keyCol, SUM(sumCol) GROUP BY keyCol` | `Map<K,V extends Number>` |
| `toMapAvg(keyCol, avgCol)` | `SELECT keyCol, AVG(avgCol) GROUP BY keyCol` | `Map<K,Double>` |
| `toMapMax(keyCol, maxCol)` | `SELECT keyCol, MAX(maxCol) GROUP BY keyCol` | `Map<K,V extends Comparable>` |
| `toMapMin(keyCol, minCol)` | `SELECT keyCol, MIN(minCol) GROUP BY keyCol` | `Map<K,V extends Comparable>` |
| `count()` | `SELECT COUNT(*) FROM ...` | `long` |

::: info SQL 下推 vs 应用层
- `toMapCount` / `toMapSum/Avg/Max/Min` —— **SQL 层 GROUP BY 聚合**，只回传聚合结果行，省网络与内存
- `groupingBy` —— **应用层分组**，把符合条件的所有行拉回 Java 再按 key 分桶，适合还要拿到完整实体的场景
:::

## toSet — 单列去重

```sql
SELECT DISTINCT role FROM user WHERE active = true
```

```java
Set<String> roles = userService.stream()
    .filter(w -> w.eq(User::getActive, true))
    .toSet(User::getRole);
```

::: tip
去重逻辑在应用层用 `LinkedHashSet` 完成，**SQL 不带 `DISTINCT`**。如果列基数极大，考虑改 `groupingBy` + `keySet()`。
:::

## toMap — 两列映射

```sql
SELECT id, name FROM user WHERE role = 'admin'
```

```java
Map<Long, String> idToName = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .toMap(User::getId, User::getName);
```

::: warning Key 冲突
默认行为是**后值覆盖前值**。如果 keyCol 不唯一且需要明确合并语义，用 3 参版本：
:::

```java
Map<String, Integer> roleToMaxScore = userService.stream()
    .toMap(User::getRole, User::getCreditScore, Integer::max);
// role 相同时取最大分数
```

## groupingBy — 应用层分组

```sql
-- 注意：拉回所有匹配行，无 GROUP BY
SELECT * FROM user WHERE active = true
```

```java
Map<String, List<User>> byRole = userService.stream()
    .filter(w -> w.eq(User::getActive, true))
    .groupingBy(User::getRole);
```

::: warning 性能
所有匹配行都会拉回 Java。如果只需要"每组的计数 / 和 / 最大值"，用 `toMapCount` / `toMapSum` 等 SQL 下推版本，**通常快一个数量级**。
:::

## toMapCount — 分组计数

```sql
SELECT role, COUNT(*) FROM user WHERE active = true GROUP BY role
```

```java
Map<String, Long> countByRole = userService.stream()
    .filter(w -> w.eq(User::getActive, true))
    .toMapCount(User::getRole);
// 结果：{ "admin": 3, "user": 42, "guest": 17 }
```

## toMapSum — 分组求和

```sql
SELECT role, SUM(credit_score) FROM user GROUP BY role
```

```java
Map<String, Integer> sumByRole = userService.stream()
    .toMapSum(User::getRole, User::getCreditScore);
```

求和列须为数值类型（`Integer` / `Long` / `BigDecimal` 等）。返回 Map 的 V 类型与 sumCol 一致。

## toMapAvg — 分组求平均

```sql
SELECT role, AVG(credit_score) FROM user GROUP BY role
```

```java
Map<String, Double> avgByRole = userService.stream()
    .toMapAvg(User::getRole, User::getCreditScore);
// 注意：无论列原类型是什么，AVG 一律返回 Double
```

## toMapMax — 分组取最大值

```sql
SELECT role, MAX(credit_score) FROM user GROUP BY role
```

```java
Map<String, Integer> maxByRole = userService.stream()
    .toMapMax(User::getRole, User::getCreditScore);
```

## toMapMin — 分组取最小值

```sql
SELECT role, MIN(created_at) FROM user GROUP BY role
```

```java
Map<String, LocalDateTime> earliestByRole = userService.stream()
    .toMapMin(User::getRole, User::getCreatedAt);
```

## count — 全表/条件计数

```sql
SELECT COUNT(*) FROM user WHERE role = 'user'
```

```java
long total = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .count();
```

## 与 JDK Stream 收集器的衔接

本库收集器是**直接终止流**的 SQL 优化版本。如果想用 JDK 标准 `Collectors.*`，先 `collect(Collectors.toList())` 把行拉回 Java：

```java
// 仍然走 SQL 下推聚合（推荐）
Map<String, Long> a = userService.stream().toMapCount(User::getRole);

// 走 JDK Stream（每个 user 实体都会拉回 Java）
Map<String, Long> b = userService.stream()
    .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
```

两种写法结果相同，**但 SQL 量与回传数据量差几个数量级**——能用本库收集器就用本库的。

## 选用决策

```
要拿到完整实体（每组所有行）？
├─ 是 → groupingBy(keyCol)
└─ 否，只要聚合值
    ├─ 计数 → toMapCount
    ├─ 求和 → toMapSum
    ├─ 平均 → toMapAvg
    ├─ 最大 → toMapMax
    ├─ 最小 → toMapMin
    └─ 自定义合并 → toMap(key, val, merger)
```

## 多方言注意

PG / DM 与 MySQL 在 `AVG` 返回类型、`COUNT(*)` 类型上略有差异（PG 是 `bigint`，MySQL 是 `long`），本库收集器已在 JDBC 层做了归一化转换。详见 [多方言支持](/pages/core/dialect/dialect)。
