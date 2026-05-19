# select

控制 SELECT 子句的列、别名、函数、子查询、CASE WHEN。本页示例以 Stream 形式为主，`userService.list(...)` 一行语法作为对照。

## 字段映射

```sql
SELECT username AS username, credit_score AS score
FROM user
```

```java
// Stream 形式
List<UserDTO> list = userService.stream()
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .collect(Collectors.toList());

// 一行语法
List<UserDTO> list = userService.list(
    where -> {},
    select -> select.select(User::getUsername,    UserDTO::getUsername)
                    .select(User::getCreditScore, UserDTO::getScore),
    UserDTO.class);
```

## selectAll — 全字段映射

```sql
SELECT * FROM user
```

```java
userService.stream().map(select -> select.selectAll(User.class), UserDTO.class).collect(...);
```

::: tip 适用
DTO 字段与实体字段一一对应（同名同序）时用 `selectAll`。否则按列指定。
:::

## selectFunc — 函数表达式列

```sql
SELECT COUNT(*) AS cnt,
       SUM(credit_score) AS totalScore,
       AVG(credit_score) AS avgScore
FROM user
```

```java
userService.stream()
    .map(select -> select.selectFunc(inner -> inner.count(),                       UserDTO::getCount)
               .selectFunc(inner -> inner.sum(User::getCreditScore),    UserDTO::getTotalScore)
               .selectFunc(inner -> inner.avg(User::getCreditScore),    UserDTO::getAvgScore),
         UserDTO.class)
    .collect(Collectors.toList());
```

更多函数见 [函数表达式](/pages/core/wrapper/functions)。

## selectSubSql — 子查询列（标量子查询）

```sql
SELECT u.username,
       (SELECT COUNT(*) FROM demand WHERE demand.user_id = u.id) AS demand_count
FROM user u
```

```java
userService.stream()
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .selectSubSql(
                   sub -> sub.from(Demand.class)
                             .select(subSelect -> subSelect.selectFunc(inner -> inner.count(), SingleValue::getValue))
                             .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
                   UserDTO::getDemandCount),
         UserDTO.class)
    .collect(Collectors.toList());
```

完整子查询语义见 [子查询](/pages/core/wrapper/sub-query)。

## selectCase — CASE WHEN

### 返回固定值

```sql
SELECT CASE
    WHEN credit_score >= 200 THEN 'high'
    WHEN credit_score >= 100 THEN 'medium'
    ELSE 'low'
END AS level
FROM user
```

```java
userService.stream()
    .map(select -> select.selectCase(caseExpr -> caseExpr
            .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 200), "high")
            .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 100), "medium")
            .elseValue("low"),
            UserDTO::getLevel),
         UserDTO.class)
    .collect(Collectors.toList());
```

### 返回列值

```sql
SELECT CASE
    WHEN credit_score >= 200 THEN nickname
    ELSE username
END AS displayName
FROM user
```

```java
userService.stream()
    .map(select -> select.selectCase(caseExpr -> caseExpr
            .whenThenColumn(caseWhere -> caseWhere.ge(User::getCreditScore, 200), User::getNickname)
            .elseColumn(User::getUsername),
            UserDTO::getDisplayName),
         UserDTO.class)
    .collect(Collectors.toList());
```

## JOIN 时指定来自哪张表

当 JOIN 多表且字段名冲突时，需要给列加表别名：

```sql
SELECT u.username AS username, d.service_type AS serviceType
FROM user u LEFT JOIN demand d ON u.id = d.user_id
```

```java
userService.stream()
    .join(join -> join.leftJoin(Demand.class, "d", User::getId, Demand::getUserId))
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .select(Demand::getServiceType, "d", UserDTO::getServiceType),
         UserDTO.class)
    .collect(Collectors.toList());
```

## 完整示例

```sql
SELECT u.username                          AS username,
       CHAR_LENGTH(u.username)             AS nameLength,
       CASE WHEN credit_score >= 100 THEN '优秀' ELSE '普通' END AS level,
       (SELECT COUNT(*) FROM demand WHERE demand.user_id = u.id) AS demand_count
FROM user u
WHERE u.role = 'user'
ORDER BY u.id ASC
LIMIT 10
```

```java
List<UserDTO> list = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .limit(10)
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .selectFunc(inner -> inner.charLengthFunc(arg -> arg.column(User::getUsername)),
                           UserDTO::getNameLength)
               .selectCase(caseExpr -> caseExpr
                   .whenThenValue(caseWhere -> caseWhere.ge(User::getCreditScore, 100), "优秀")
                   .elseValue("普通"),
                   UserDTO::getLevel)
               .selectSubSql(
                   sub -> sub.from(Demand.class)
                             .select(subSelect -> subSelect.selectFunc(inner -> inner.count(), SingleValue::getValue))
                             .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)),
                   UserDTO::getDemandCount),
         UserDTO.class)
    .collect(Collectors.toList());
```

## 相关

- [Stream API - map](/pages/core/stream/stream#map-——-映射到-dto)
- [函数表达式](/pages/core/wrapper/functions) — 100+ SQL 函数
- [子查询](/pages/core/wrapper/sub-query)
- [join](/pages/core/wrapper/join)
