# WHERE 条件

WHERE 条件构建器 `NormalWhereLambdaQueryWrapper` 提供了丰富的条件方法，所有方法均支持 Lambda 类型安全。

## 基础比较

```java
w -> w
    .eq(User::getRole, "user")              // role = 'user'
    .ne(User::getRole, "admin")             // role != 'admin'
    .gt(User::getId, 0L)                    // id > 0
    .ge(User::getId, 1L)                    // id >= 1
    .lt(User::getId, 100L)                  // id < 100
    .le(User::getId, 100L)                  // id <= 100
```

## 模糊匹配

```java
w -> w
    .like(User::getUsername, "%user%")       // LIKE '%user%' (手动加%)
    .likeDefault(User::getUsername, "ser")   // LIKE '%ser%' (自动加%)
    .likeLeft(User::getUsername, "1")        // LIKE '%1'
    .likeRight(User::getUsername, "user")    // LIKE 'user%'
    .notLike(User::getUsername, "%xxx%")     // NOT LIKE
```

## 空值判断

```java
w -> w
    .isNull(User::getOpenid)                // openid IS NULL
    .isNotNull(User::getUsername)            // username IS NOT NULL
    .isEmpty(User::getOpenid)               // openid IS NULL OR openid = ''
    .isNotEmpty(User::getUsername)           // username IS NOT NULL AND username != ''
```

## 范围查询

```java
w -> w
    .in(User::getId, Arrays.asList(1, 2, 3))       // id IN (1,2,3)
    .between(User::getId, 1L, 100L)                 // id BETWEEN 1 AND 100
    .notBetween(User::getId, 999L, 9999L)           // id NOT BETWEEN 999 AND 9999
```

## 正则匹配

```java
w -> w.regexp(User::getUsername, "^user[0-9]+$")    // username REGEXP '^user[0-9]+$'
```

## 列与列比较

```java
w -> w.eqColumn(User::getRole, User::getRole)      // role = role (永真)
```

## 逗号分隔值搜索

适用于 `tags = "java,spring,mysql"` 这种存储方式：

```java
w -> w.containAny(Entity::getTags, Arrays.asList("java"))           // 包含 java
w -> w.containAny(Entity::getTags, Arrays.asList("python", "java")) // 包含 python 或 java
```

## 永真条件

```java
w -> w._true()    // WHERE 1=1
```

## 条件开关

当 `condition` 为 `false` 时，该条件会被跳过：

```java
String searchVal = request.getSearch(); // 可能为 null
w -> w
    .eq(User::getRole, "user")
    .eq(searchVal != null, User::getUsername, searchVal)  // searchVal 为 null 时跳过
```

## 逻辑组合

### OR 连接

```java
// 简单 OR：下一个条件用 OR 连接
w -> w.eq(User::getUsername, "user1").or().eq(User::getUsername, "admin")
// SQL: username = 'user1' OR username = 'admin'
```

### 嵌套 OR

```java
w -> w.eq(User::getRole, "user")
      .or(o -> o.eq(User::getUsername, "admin"))
// SQL: role = 'user' OR (username = 'admin')
```

### 嵌套 AND

```java
w -> w.eq(User::getRole, "user")
      .and(a -> a.ge(User::getCreditScore, 50).le(User::getCreditScore, 200))
// SQL: role = 'user' AND (credit_score >= 50 AND credit_score <= 200)
```

### NOT

```java
w -> w.not(n -> n.eq(User::getRole, "nonexist"))
// SQL: NOT (role = 'nonexist')
```

## 子查询

### EXISTS

```java
w -> w.exists(sub -> sub
    .from(Demand.class)
    .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)))
// SQL: EXISTS (SELECT * FROM demand WHERE demand.user_id = user.id)
```

### NOT EXISTS

```java
w -> w.notExists(sub -> sub
    .from(Demand.class)
    .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)))
```

### IN 子查询

```java
w -> w.inSubSql(User::getId,
    sub -> sub.from(Demand.class)
        .select(s -> s.selectFunc(x -> x.column(Demand::getUserId), SingleValue::getValue)))
// SQL: id IN (SELECT user_id FROM demand)
```

## 函数版 WHERE

当列和值都需要用函数表达式时：

```java
w -> w
    .eqFunc(f -> f.column(User::getCreditScore), f -> f.value(100))
    .gtFunc(f -> f.column(User::getId), f -> f.value(0))
    .geFunc(f -> f.column(User::getCreditScore), f -> f.value(100))
    .leFunc(f -> f.column(User::getCreditScore), f -> f.value(200))
    .ltFunc(f -> f.column(User::getCreditScore), f -> f.value(9999))
    .neFunc(f -> f.column(User::getRole), f -> f.value("admin"))
    .betweenFunc(f -> f.column(User::getCreditScore), f -> f.value(50), f -> f.value(200))
    .notBetweenFunc(f -> f.column(User::getCreditScore), f -> f.value(9000), f -> f.value(9999))
    .isNullFunc(f -> f.column(User::getOpenid))
    .isNotNullFunc(f -> f.column(User::getUsername))
    .likeFunc(f -> f.column(User::getUsername), f -> f.value("%user%"))
    .likeLeftFunc(f -> f.column(User::getUsername), f -> f.value("1"))
    .likeRightFunc(f -> f.column(User::getUsername), f -> f.value("user"))
    .likeDefaultFunc(f -> f.column(User::getUsername), f -> f.value("ser"))
    .notLikeFunc(f -> f.column(User::getUsername), f -> f.value("admin"))
    .regexpFunc(f -> f.column(User::getUsername), f -> f.value("^user[0-9]+"))
    .inFunc(f -> f.column(User::getRole), f -> f.values(Arrays.asList("user", "admin")))
    .notInFunc(f -> f.column(User::getRole), f -> f.values(Arrays.asList("admin", "superadmin")))
```
