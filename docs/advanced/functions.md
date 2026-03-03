# 函数表达式

框架内置 100+ SQL 函数，涵盖聚合、字符串、日期、数学、条件、位运算等，全部通过 Lambda 类型安全调用。

## 聚合函数

```java
x -> x.count()                                    // COUNT(*)
x -> x.count(User::getId)                         // COUNT(id)
x -> x.countFunc(f -> f.column(User::getId))       // COUNT(id) 函数版
x -> x.sum(User::getCreditScore)                   // SUM(credit_score)
x -> x.sumDistinct(User::getCreditScore)           // SUM(DISTINCT credit_score)
x -> x.sumFunc(f -> f.column(User::getCreditScore)) // SUM(credit_score) 函数版
x -> x.avg(User::getCreditScore)                   // AVG(credit_score)
x -> x.avgDistinct(User::getCreditScore)           // AVG(DISTINCT credit_score)
x -> x.avgFunc(f -> f.column(User::getCreditScore)) // AVG(credit_score) 函数版
x -> x.max(User::getCreditScore)                   // MAX(credit_score)
x -> x.maxDistinct(User::getCreditScore)           // MAX(DISTINCT credit_score)
x -> x.min(User::getCreditScore)                   // MIN(credit_score)
x -> x.minDistinct(User::getCreditScore)           // MIN(DISTINCT credit_score)
```

## GROUP_CONCAT

```java
x -> x.groupConcat(User::getUsername)              // GROUP_CONCAT(username)
x -> x.groupConcat(User::getUsername, "|")         // GROUP_CONCAT(username SEPARATOR '|')
x -> x.groupConcatDistinct(User::getRole)         // GROUP_CONCAT(DISTINCT role)
```

## 条件计数

```java
// COUNT 满足条件的行
x -> x.countPredicate(pw -> pw.eq(User::getRole, "admin"))
// COUNT DISTINCT 满足条件的值
x -> x.countPredicateDistinct(pw -> pw.eq(User::getRole, "user"), User::getCreditScore)
```

## 组内第一个

```java
x -> x.groupFirst(User::getUsername, o -> o.orderAsc(User::getId))
```

## 算术运算

```java
x -> x.add(User::getCreditScore, 10)       // credit_score + 10
x -> x.subtract(User::getCreditScore, 50)  // credit_score - 50
x -> x.multiply(User::getCreditScore, 2)   // credit_score * 2
x -> x.divide(User::getCreditScore, 10)    // credit_score / 10
x -> x.mod(User::getCreditScore, 30)       // credit_score % 30
x -> x.abs(-42)                            // ABS(-42) = 42
```

## 字符串函数

```java
// CONCAT
x -> x.concatFunc(
    f -> f.column(User::getUsername),
    f -> f.value("-"),
    f -> f.column(User::getRole))
// SQL: CONCAT(username, '-', role)

// LEFT / RIGHT
x -> x.left("hello_world", 5)               // LEFT('hello_world', 5) = 'hello'
x -> x.right("hello_world", 5)              // RIGHT('hello_world', 5) = 'world'

// TRIM
x -> x.trimFunc(f -> f.value("  hello  "))  // TRIM('  hello  ') = 'hello'

// CHAR_LENGTH
x -> x.charLengthFunc(f -> f.column(User::getUsername))  // CHAR_LENGTH(username)

// MD5
x -> x.md5("test")                          // MD5('test')

// SUBSTRING_INDEX
x -> x.substringIndexFunc(f -> f.value("a-b-c"), "-", 2)  // SUBSTRING_INDEX('a-b-c','-',2) = 'a-b'

// FIND_IN_SET
x -> x.findInSetFunc(f -> f.value("b"), f -> f.value("a,b,c"))  // FIND_IN_SET('b','a,b,c') = 2

// HEX
x -> x.hexNumber(255)                       // HEX(255) = 'FF'
x -> x.hexStr("Hello")                      // HEX('Hello')
```

## 条件函数

```java
// IF
x -> x._if(cond -> cond.eq(User::getRole, "admin"), "YES", "NO")
// SQL: IF(role='admin', 'YES', 'NO')

// IFNULL
x -> x.ifnull(User::getOpenid, "N/A")
// SQL: IFNULL(openid, 'N/A')

// IFNULL 函数版
x -> x.ifnullFunc(f -> f.column(User::getOpenid), f -> f.value("no_openid"))
```

## 日期函数

```java
// NOW
x -> x.now()                               // NOW()

// DATE_FORMAT
x -> x.dateFormatFunc(f -> f.now(), "%Y-%m-%d")
// SQL: DATE_FORMAT(NOW(), '%Y-%m-%d')

// DATE_ADD
x -> x.dateAddFunc(f -> f.now(), f -> f.customColumn("1"), "DAY")
// SQL: DATE_ADD(NOW(), INTERVAL 1 DAY)

// STR_TO_DATE
x -> x.strToDateFunc(f -> f.value("2026-01-15"), "%Y-%m-%d")

// 日期提取
x -> x.yearFunc(f -> f.now())              // YEAR(NOW())
x -> x.quarterFunc(f -> f.now())           // QUARTER(NOW())
x -> x.weekOfYearFunc(f -> f.now())        // WEEKOFYEAR(NOW())
x -> x.dayOfYearFunc(f -> f.now())         // DAYOFYEAR(NOW())
x -> x.toDaysFunc(f -> f.now())            // TO_DAYS(NOW())
x -> x.toSecondsFun(f -> f.now())          // TO_SECONDS(NOW())
```

## 数学函数

```java
x -> x.sqrtFunc(f -> f.value(144))         // SQRT(144) = 12
x -> x.pi()                                // PI() = 3.14159...
x -> x.conv(255, 10, 16)                   // CONV(255,10,16) = 'FF'
x -> x.convFunc(f -> f.value("1010"), 2, 10) // CONV('1010',2,10) = '10'
x -> x.elt(2, "alpha", "beta", "gamma")   // ELT(2,'alpha','beta','gamma') = 'beta'
x -> x.interval(23, 1, 5, 10, 20, 30)     // INTERVAL(23,1,5,10,20,30) = 4
```

## 类型转换

```java
x -> x.convertData(User::getCreditScore, "CHAR")
// SQL: CONVERT(credit_score, CHAR)
```

## 位运算

```java
x -> x.bAndFunc(f -> f.value(12), f -> f.value(10))        // 12 & 10 = 8
x -> x.bOrFunc(f -> f.value(12), f -> f.value(10))         // 12 | 10 = 14
x -> x.bXorFunc(f -> f.value(12), f -> f.value(10))        // 12 ^ 10 = 6
x -> x.bShiftLeftFunc(f -> f.value(1), f -> f.value(4))    // 1 << 4 = 16
x -> x.bShiftRightFunc(f -> f.value(16), f -> f.value(2))  // 16 >> 2 = 4
x -> x.bNotFunc(f -> f.value(0))                            // ~0
```

## 在不同场景中使用函数

### SELECT 中使用

```java
s -> s.selectFunc(x -> x.count(), UserDTO::getCount)
      .selectFunc(x -> x.sum(User::getCreditScore), UserDTO::getTotalScore)
```

### WHERE 中使用

```java
w -> w.eqFunc(f -> f.column(User::getCreditScore), f -> f.value(100))
      .gtFunc(f -> f.column(User::getId), f -> f.value(0))
```

### ORDER BY 中使用

```java
o -> o.orderFunc(x -> x.charLengthFunc(f -> f.column(User::getUsername)), true)
```

### SET 中使用

```java
s -> s.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5))
```

### GROUP BY 中使用

```java
g -> g.groupByFunc(f -> f.leftFunc(ff -> ff.column(User::getUsername), 4))
```

### HAVING 中使用

```java
g -> g.groupBy(User::getRole)
      .having(h -> h.gtFunc(f -> f.count(), f -> f.value(1)))
```
