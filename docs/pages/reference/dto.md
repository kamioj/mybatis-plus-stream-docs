# DTO 设计规范

在使用连表查询、分组查询、子查询时，需要定义 DTO（Data Transfer Object）来接收查询结果。

## 基本规则

1. DTO 用 `@Data`（Lombok）注解
2. 字段名可以任意命名，通过 `select()` 映射对应
3. 字段类型要与数据库列类型兼容

```java
@Data
public class UserOrderDTO {
    private Long id;
    private String username;       // 映射自 User::getUsername
    private String serviceType;    // 映射自 Demand::getServiceType
    private String status;         // 可以映射任意列
    private Long demandCount;      // 映射 COUNT(*) 等聚合结果
    private Double avgScore;       // 映射 AVG() 等浮点聚合结果
}
```

## 映射方式

### 字段到字段

```java
select -> select.select(User::getUsername, UserOrderDTO::getUsername)
      .select(User::getCreditScore, UserOrderDTO::getScore)
```

### 函数到字段

```java
select -> select.selectFunc(func -> func.count(), UserOrderDTO::getDemandCount)
      .selectFunc(func -> func.avg(User::getCreditScore), UserOrderDTO::getAvgScore)
```

### 子查询到字段

```java
select -> select.selectSubSql(
    sub -> sub.from(Demand.class)
        .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
        .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
    UserOrderDTO::getDemandCount)
```

### CASE WHEN 到字段

```java
select -> select.selectCase(c -> c
    .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "优秀")
    .elseValue("普通"),
    UserOrderDTO::getStatus)
```

## SingleValue

`SingleValue` 是框架内置的单值 DTO，用于子查询中 SELECT 单列的场景：

```java
// 子查询中必须用 SingleValue::getValue 作为映射目标
sub -> sub.from(Demand.class)
    .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
    .where(sw -> sw.eqColumn(Demand::getUserId, User::getId))

// IN 子查询同理
where -> where.inSubSql(User::getId,
    sub -> sub.from(Demand.class)
        .select(select -> select.selectFunc(func -> func.column(Demand::getUserId), SingleValue::getValue)))
```

::: warning
子查询的 SELECT 中，映射目标**必须**用 `SingleValue::getValue`，不能用自定义 DTO。
:::

## customColumn

`customColumn` 用于注入原生 SQL 片段，常见于日期函数中的 INTERVAL 值：

```java
// DATE_ADD(NOW(), INTERVAL 1 DAY)
// 这里的 "1" 不能用 value(1)，因为 INTERVAL 后不能参数化
func -> func.dateAddFunc(f -> f.now(), f -> f.customColumn("1"), "DAY")

// DATE_ADD(NOW(), INTERVAL -3 HOUR)
func -> func.dateAddFunc(f -> f.now(), f -> f.customColumn("-3"), "HOUR")
```

## 字段类型建议

| 聚合函数 | 推荐 Java 类型 |
|---------|--------------|
| `count()` | `Long` 或 `Integer` |
| `sum(整数列)` | `Long` |
| `sum(小数列)` | `BigDecimal` |
| `avg()` | `Double` 或 `BigDecimal` |
| `max()/min(整数列)` | 与原字段类型一致 |
| `max()/min(字符串列)` | `String` |
| `groupConcat()` | `String` |
| `groupFirst()` | 与原字段类型一致 |

## 完整示例

```java
@Data
public class UserStatsDTO {
    private String role;           // 分组字段
    private Long userCount;        // COUNT(*)
    private Double avgScore;       // AVG(credit_score)
    private String allUsernames;   // GROUP_CONCAT(username)
    private Long demandCount;      // 子查询 COUNT
    private String creditLevel;    // CASE WHEN 结果
}

// 使用
List<UserStatsDTO> stats = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserStatsDTO::getRole)
          .selectFunc(func -> func.count(), UserStatsDTO::getUserCount)
          .selectFunc(func -> func.avg(User::getCreditScore), UserStatsDTO::getAvgScore)
          .selectFunc(func -> func.groupConcat(User::getUsername, ","), UserStatsDTO::getAllUsernames),
    UserStatsDTO.class);
```
