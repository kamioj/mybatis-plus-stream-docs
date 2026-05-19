# 函数表达式 (Functions)

框架内置 100+ SQL 函数，涵盖聚合、字符串、日期、数学、条件、位运算等，全部通过 Lambda 类型安全调用。

::: tip 阅读方式
本页是函数速查清单。每段右侧的 `// SQL: xxx` 注释是该 lambda 生成的 SQL 形态，**就是为了让你"看 lambda 像看 SQL"**。需要展开用法的函数在文末"在不同场景中使用函数"一节，按 SELECT / WHERE / ORDER / SET / GROUP BY / HAVING 分类。
:::

::: warning 方言提示
当前部分函数硬编码 MySQL 语法（`DATE_FORMAT / STR_TO_DATE / SUBSTRING_INDEX / DATE_ADD INTERVAL / CONVERT`），跨 PG / DM 会报错。计划在 4.2+ 方言化。详见 [多方言支持 — 函数名仍是 MySQL 风格](/pages/core/dialect/dialect#函数名仍是-mysql-风格)。
:::

## 聚合函数 {#aggregate}

```java
func -> func.count()                                    // COUNT(*)
func -> func.count(User::getId)                         // COUNT(id)
func -> func.countFunc(arg -> arg.column(User::getId))       // COUNT(id) 函数版
func -> func.sum(User::getCreditScore)                   // SUM(credit_score)
func -> func.sumDistinct(User::getCreditScore)           // SUM(DISTINCT credit_score)
func -> func.sumFunc(arg -> arg.column(User::getCreditScore)) // SUM(credit_score) 函数版
func -> func.avg(User::getCreditScore)                   // AVG(credit_score)
func -> func.avgDistinct(User::getCreditScore)           // AVG(DISTINCT credit_score)
func -> func.avgFunc(arg -> arg.column(User::getCreditScore)) // AVG(credit_score) 函数版
func -> func.max(User::getCreditScore)                   // MAX(credit_score)
func -> func.maxDistinct(User::getCreditScore)           // MAX(DISTINCT credit_score)
func -> func.min(User::getCreditScore)                   // MIN(credit_score)
func -> func.minDistinct(User::getCreditScore)           // MIN(DISTINCT credit_score)
```

## GROUP_CONCAT {#group-concat}

```java
func -> func.groupConcat(User::getUsername)              // GROUP_CONCAT(username)
func -> func.groupConcat(User::getUsername, "|")         // GROUP_CONCAT(username SEPARATOR '|')
func -> func.groupConcatDistinct(User::getRole)         // GROUP_CONCAT(DISTINCT role)
```

## 条件计数 {#count-predicate}

```java
// COUNT 满足条件的行
func -> func.countPredicate(pw -> pw.eq(User::getRole, "admin"))
// COUNT DISTINCT 满足条件的值
func -> func.countPredicateDistinct(pw -> pw.eq(User::getRole, "user"), User::getCreditScore)
```

## 组内第一个 {#group-first}

```java
func -> func.groupFirst(User::getUsername, order -> order.orderAsc(User::getId))
```

## 算术运算 {#arithmetic}

```java
func -> func.add(User::getCreditScore, 10)       // credit_score + 10
func -> func.subtract(User::getCreditScore, 50)  // credit_score - 50
func -> func.multiply(User::getCreditScore, 2)   // credit_score * 2
func -> func.divide(User::getCreditScore, 10)    // credit_score / 10
func -> func.mod(User::getCreditScore, 30)       // credit_score % 30
func -> func.abs(-42)                            // ABS(-42) = 42
```

## 字符串函数 {#string}

```java
// CONCAT
func -> func.concatFunc(
    arg -> arg.column(User::getUsername),
    arg -> arg.value("-"),
    arg -> arg.column(User::getRole))
// SQL: CONCAT(username, '-', role)

// LEFT / RIGHT
func -> func.left("hello_world", 5)               // LEFT('hello_world', 5) = 'hello'
func -> func.right("hello_world", 5)              // RIGHT('hello_world', 5) = 'world'

// TRIM
func -> func.trimFunc(arg -> arg.value("  hello  "))  // TRIM('  hello  ') = 'hello'

// CHAR_LENGTH
func -> func.charLengthFunc(arg -> arg.column(User::getUsername))  // CHAR_LENGTH(username)

// MD5
func -> func.md5("test")                          // MD5('test')

// SUBSTRING_INDEX
func -> func.substringIndexFunc(arg -> arg.value("a-b-c"), "-", 2)  // SUBSTRING_INDEX('a-b-c','-',2) = 'a-b'

// FIND_IN_SET
func -> func.findInSetFunc(arg -> arg.value("b"), arg -> arg.value("a,b,c"))  // FIND_IN_SET('b','a,b,c') = 2

// HEX
func -> func.hexNumber(255)                       // HEX(255) = 'FF'
func -> func.hexStr("Hello")                      // HEX('Hello')
```

## 条件函数 {#conditional}

```java
// IF
func -> func._if(cond -> cond.eq(User::getRole, "admin"), "YES", "NO")
// SQL: IF(role='admin', 'YES', 'NO')

// IFNULL
func -> func.ifnull(User::getOpenid, "N/A")
// SQL: IFNULL(openid, 'N/A')

// IFNULL 函数版
func -> func.ifnullFunc(arg -> arg.column(User::getOpenid), arg -> arg.value("no_openid"))
```

## 日期函数 {#date}

```java
// NOW
func -> func.now()                               // NOW()

// DATE_FORMAT
func -> func.dateFormatFunc(inner -> inner.now(), "%Y-%m-%d")
// SQL: DATE_FORMAT(NOW(), '%Y-%m-%d')

// DATE_ADD
func -> func.dateAddFunc(inner -> inner.now(), arg -> arg.customColumn("1"), "DAY")
// SQL: DATE_ADD(NOW(), INTERVAL 1 DAY)

// STR_TO_DATE
func -> func.strToDateFunc(arg -> arg.value("2026-01-15"), "%Y-%m-%d")

// 日期提取
func -> func.yearFunc(inner -> inner.now())              // YEAR(NOW())
func -> func.quarterFunc(inner -> inner.now())           // QUARTER(NOW())
func -> func.weekOfYearFunc(inner -> inner.now())        // WEEKOFYEAR(NOW())
func -> func.dayOfYearFunc(inner -> inner.now())         // DAYOFYEAR(NOW())
func -> func.toDaysFunc(inner -> inner.now())            // TO_DAYS(NOW())
func -> func.toSecondsFun(inner -> inner.now())          // TO_SECONDS(NOW())
```

## 数学函数 {#math}

```java
func -> func.sqrtFunc(arg -> arg.value(144))         // SQRT(144) = 12
func -> func.pi()                                // PI() = 3.14159...
func -> func.conv(255, 10, 16)                   // CONV(255,10,16) = 'FF'
func -> func.convFunc(arg -> arg.value("1010"), 2, 10) // CONV('1010',2,10) = '10'
func -> func.elt(2, "alpha", "beta", "gamma")   // ELT(2,'alpha','beta','gamma') = 'beta'
func -> func.interval(23, 1, 5, 10, 20, 30)     // INTERVAL(23,1,5,10,20,30) = 4
```

## 类型转换 {#cast}

```java
func -> func.convertData(User::getCreditScore, "CHAR")
// SQL: CONVERT(credit_score, CHAR)
```

## 位运算 {#bitwise}

```java
func -> func.bAndFunc(arg -> arg.value(12), arg -> arg.value(10))        // 12 & 10 = 8
func -> func.bOrFunc(arg -> arg.value(12), arg -> arg.value(10))         // 12 | 10 = 14
func -> func.bXorFunc(arg -> arg.value(12), arg -> arg.value(10))        // 12 ^ 10 = 6
func -> func.bShiftLeftFunc(arg -> arg.value(1), arg -> arg.value(4))    // 1 << 4 = 16
func -> func.bShiftRightFunc(arg -> arg.value(16), arg -> arg.value(2))  // 16 >> 2 = 4
func -> func.bNotFunc(arg -> arg.value(0))                            // ~0
```

## 在不同场景中使用函数

### SELECT 中使用

```java
select -> select.selectFunc(inner -> inner.count(), UserDTO::getCount)
      .selectFunc(inner -> inner.sum(User::getCreditScore), UserDTO::getTotalScore)
```

### WHERE 中使用

```java
where -> where.eqFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(100))
      .gtFunc(arg -> arg.column(User::getId), arg -> arg.value(0))
```

### ORDER BY 中使用

```java
order -> order.orderFunc(inner -> inner.charLengthFunc(arg -> arg.column(User::getUsername)), true)
```

### SET 中使用

```java
set -> set.setFunc(User::getCreditScore, inner -> inner.add(User::getCreditScore, 5))
```

### GROUP BY 中使用

```java
group -> group.groupByFunc(inner -> inner.leftFunc(inner -> inner.column(User::getUsername), 4))
```

### HAVING 中使用

```java
group -> group.groupBy(User::getRole)
      .having(h -> h.gtFunc(inner -> inner.count(), arg -> arg.value(1)))
```
