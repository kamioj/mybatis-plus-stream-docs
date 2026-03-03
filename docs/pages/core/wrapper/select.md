# select

控制查询返回的列，支持字段映射、函数表达式、子查询、CASE WHEN 等。

## 基本字段映射

将实体字段映射到 DTO 字段：

```java
select -> select.select(User::getUsername, UserDTO::getUsername)
      .select(User::getCreditScore, UserDTO::getScore)
```

## selectAll — 自动映射全字段

```java
select -> select.selectAll(User.class)
```

::: tip
`selectAll` 适用于 DTO 结构与实体完全一致的情况。
:::

## selectFunc — 函数表达式列

```java
select -> select.selectFunc(func -> func.count(), UserDTO::getCount)
      .selectFunc(func -> func.sum(User::getCreditScore), UserDTO::getTotalScore)
      .selectFunc(func -> func.avg(User::getCreditScore), UserDTO::getAvgScore)
```

## selectSubSql — 子查询列

将子查询结果作为 SELECT 的一列：

```java
select -> select.select(User::getUsername, UserDTO::getUsername)
      .selectSubSql(
          sub -> sub.from(Demand.class)
              .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
              .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
          UserDTO::getDemandCount)
// SQL: SELECT username, (SELECT COUNT(*) FROM demand WHERE demand.user_id = user.id) AS demand_count
```

## selectCase — CASE WHEN 表达式

### 返回固定值

```java
select -> select.selectCase(c -> c
        .whenThenValue(cw -> cw.ge(User::getCreditScore, 200), "high")
        .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "medium")
        .elseValue("low"),
    UserDTO::getLevel)
// SQL: CASE WHEN credit_score >= 200 THEN 'high'
//           WHEN credit_score >= 100 THEN 'medium'
//           ELSE 'low' END
```

### 返回列值

```java
select -> select.selectCase(c -> c
        .whenThenColumn(cw -> cw.ge(User::getCreditScore, 200), User::getNickname)
        .elseColumn(User::getUsername),
    UserDTO::getDisplayName)
// SQL: CASE WHEN credit_score >= 200 THEN nickname ELSE username END
```

## JOIN 时指定表别名

```java
// 通过别名指定来自哪张表的字段
select -> select.select(User::getUsername, UserDTO::getUsername)
      .select(Demand::getServiceType, "d", UserDTO::getServiceType)
```

## 完整示例

```java
List<UserDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    10,
    select -> select.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(func -> func.charLengthFunc(f -> f.column(User::getUsername)),
                      UserDTO::getNameLength)
          .selectCase(c -> c
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "优秀")
              .elseValue("普通"),
              UserDTO::getLevel)
          .selectSubSql(
              sub -> sub.from(Demand.class)
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
              UserDTO::getDemandCount),
    UserDTO.class);
```
