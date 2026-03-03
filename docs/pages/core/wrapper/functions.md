# 函数表达式 (Functions)

框架内置 100+ SQL 函数，涵盖聚合、字符串、日期、数学、条件、位运算等，全部通过 Lambda 类型安全调用。

## 聚合函数

```java
func -> func.count()                                    // COUNT(*)
func -> func.count(User::getId)                         // COUNT(id)
func -> func.countFunc(f -> f.column(User::getId))       // COUNT(id) 函数版
func -> func.sum(User::getCreditScore)                   // SUM(credit_score)
func -> func.sumDistinct(User::getCreditScore)           // SUM(DISTINCT credit_score)
func -> func.sumFunc(f -> f.column(User::getCreditScore)) // SUM(credit_score) 函数版
func -> func.avg(User::getCreditScore)                   // AVG(credit_score)
func -> func.avgDistinct(User::getCreditScore)           // AVG(DISTINCT credit_score)
func -> func.avgFunc(f -> f.column(User::getCreditScore)) // AVG(credit_score) 函数版
func -> func.max(User::getCreditScore)                   // MAX(credit_score)
func -> func.maxDistinct(User::getCreditScore)           // MAX(DISTINCT credit_score)
func -> func.min(User::getCreditScore)                   // MIN(credit_score)
func -> func.minDistinct(User::getCreditScore)           // MIN(DISTINCT credit_score)
```

## GROUP_CONCAT

```java
func -> func.groupConcat(User::getUsername)              // GROUP_CONCAT(username)
func -> func.groupConcat(User::getUsername, "|")         // GROUP_CONCAT(username SEPARATOR '|')
func -> func.groupConcatDistinct(User::getRole)         // GROUP_CONCAT(DISTINCT role)
```

## 条件计数

```java
// COUNT 满足条件的行
func -> func.countPredicate(pw -> pw.eq(User::getRole, "admin"))
// COUNT DISTINCT 满足条件的值
func -> func.countPredicateDistinct(pw -> pw.eq(User::getRole, "user"), User::getCreditScore)
```

## 组内第一个

```java
func -> func.groupFirst(User::getUsername, order -> order.orderAsc(User::getId))
```

## 算术运算

```java
func -> func.add(User::getCreditScore, 10)       // credit_score + 10
func -> func.subtract(User::getCreditScore, 50)  // credit_score - 50
func -> func.multiply(User::getCreditScore, 2)   // credit_score * 2
func -> func.divide(User::getCreditScore, 10)    // credit_score / 10
func -> func.mod(User::getCreditScore, 30)       // credit_score % 30
func -> func.abs(-42)                            // ABS(-42) = 42
```

## 字符串函数

```java
// CONCAT
func -> func.concatFunc(
    f -> f.column(User::getUsername),
    f -> f.value("-"),
    f -> f.column(User::getRole))
// SQL: CONCAT(username, '-', role)

// LEFT / RIGHT
func -> func.left("hello_world", 5)               // LEFT('hello_world', 5) = 'hello'
func -> func.right("hello_world", 5)              // RIGHT('hello_world', 5) = 'world'

// TRIM
func -> func.trimFunc(f -> f.value("  hello  "))  // TRIM('  hello  ') = 'hello'

// CHAR_LENGTH
func -> func.charLengthFunc(f -> f.column(User::getUsername))  // CHAR_LENGTH(username)

// MD5
func -> func.md5("test")                          // MD5('test')

// SUBSTRING_INDEX
func -> func.substringIndexFunc(f -> f.value("a-b-c"), "-", 2)  // SUBSTRING_INDEX('a-b-c','-',2) = 'a-b'

// FIND_IN_SET
func -> func.findInSetFunc(f -> f.value("b"), f -> f.value("a,b,c"))  // FIND_IN_SET('b','a,b,c') = 2

// HEX
func -> func.hexNumber(255)                       // HEX(255) = 'FF'
func -> func.hexStr("Hello")                      // HEX('Hello')
```

## 条件函数

```java
// IF
func -> func._if(cond -> cond.eq(User::getRole, "admin"), "YES", "NO")
// SQL: IF(role='admin', 'YES', 'NO')

// IFNULL
func -> func.ifnull(User::getOpenid, "N/A")
// SQL: IFNULL(openid, 'N/A')

// IFNULL 函数版
func -> func.ifnullFunc(f -> f.column(User::getOpenid), f -> f.value("no_openid"))
```

## 日期函数

```java
// NOW
func -> func.now()                               // NOW()

// DATE_FORMAT
func -> func.dateFormatFunc(f -> f.now(), "%Y-%m-%d")
// SQL: DATE_FORMAT(NOW(), '%Y-%m-%d')

// DATE_ADD
func -> func.dateAddFunc(f -> f.now(), f -> f.customColumn("1"), "DAY")
// SQL: DATE_ADD(NOW(), INTERVAL 1 DAY)

// STR_TO_DATE
func -> func.strToDateFunc(f -> f.value("2026-01-15"), "%Y-%m-%d")

// 日期提取
func -> func.yearFunc(f -> f.now())              // YEAR(NOW())
func -> func.quarterFunc(f -> f.now())           // QUARTER(NOW())
func -> func.weekOfYearFunc(f -> f.now())        // WEEKOFYEAR(NOW())
func -> func.dayOfYearFunc(f -> f.now())         // DAYOFYEAR(NOW())
func -> func.toDaysFunc(f -> f.now())            // TO_DAYS(NOW())
func -> func.toSecondsFun(f -> f.now())          // TO_SECONDS(NOW())
```

## 数学函数

```java
func -> func.sqrtFunc(f -> f.value(144))         // SQRT(144) = 12
func -> func.pi()                                // PI() = 3.14159...
func -> func.conv(255, 10, 16)                   // CONV(255,10,16) = 'FF'
func -> func.convFunc(f -> f.value("1010"), 2, 10) // CONV('1010',2,10) = '10'
func -> func.elt(2, "alpha", "beta", "gamma")   // ELT(2,'alpha','beta','gamma') = 'beta'
func -> func.interval(23, 1, 5, 10, 20, 30)     // INTERVAL(23,1,5,10,20,30) = 4
```

## 类型转换

```java
func -> func.convertData(User::getCreditScore, "CHAR")
// SQL: CONVERT(credit_score, CHAR)
```

## 位运算

```java
func -> func.bAndFunc(f -> f.value(12), f -> f.value(10))        // 12 & 10 = 8
func -> func.bOrFunc(f -> f.value(12), f -> f.value(10))         // 12 | 10 = 14
func -> func.bXorFunc(f -> f.value(12), f -> f.value(10))        // 12 ^ 10 = 6
func -> func.bShiftLeftFunc(f -> f.value(1), f -> f.value(4))    // 1 << 4 = 16
func -> func.bShiftRightFunc(f -> f.value(16), f -> f.value(2))  // 16 >> 2 = 4
func -> func.bNotFunc(f -> f.value(0))                            // ~0
```

## 在不同场景中使用函数

### SELECT 中使用

```java
select -> select.selectFunc(func -> func.count(), UserDTO::getCount)
      .selectFunc(func -> func.sum(User::getCreditScore), UserDTO::getTotalScore)
```

### WHERE 中使用

```java
where -> where.eqFunc(f -> f.column(User::getCreditScore), f -> f.value(100))
      .gtFunc(f -> f.column(User::getId), f -> f.value(0))
```

### ORDER BY 中使用

```java
order -> order.orderFunc(func -> func.charLengthFunc(f -> f.column(User::getUsername)), true)
```

### SET 中使用

```java
set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5))
```

### GROUP BY 中使用

```java
group -> group.groupByFunc(f -> f.leftFunc(ff -> ff.column(User::getUsername), 4))
```

### HAVING 中使用

```java
group -> group.groupBy(User::getRole)
      .having(h -> h.gtFunc(f -> f.count(), f -> f.value(1)))
```
