# where

WHERE 条件构建器 `NormalWhereLambdaQueryWrapper` 提供了丰富的条件方法，所有方法均支持 Lambda 类型安全。

## 基础比较 {#basic-compare}

```java
where -> where
    .eq(User::getRole, "user")              // role = 'user'
    .ne(User::getRole, "admin")             // role != 'admin'
    .gt(User::getId, 0L)                    // id > 0
    .ge(User::getId, 1L)                    // id >= 1
    .lt(User::getId, 100L)                  // id < 100
    .le(User::getId, 100L)                  // id <= 100
```

## 模糊匹配 {#like}

```java
where -> where
    .like(User::getUsername, "%user%")       // LIKE '%user%' (手动加%)
    .likeDefault(User::getUsername, "ser")   // LIKE '%ser%' (自动加%)
    .likeLeft(User::getUsername, "1")        // LIKE '%1'
    .likeRight(User::getUsername, "user")    // LIKE 'user%'
    .notLike(User::getUsername, "%xxx%")     // NOT LIKE
```

## 空值判断 {#null}

```java
where -> where
    .isNull(User::getOpenid)                // openid IS NULL
    .isNotNull(User::getUsername)            // username IS NOT NULL
    .isEmpty(User::getOpenid)               // openid IS NULL OR openid = ''
    .isNotEmpty(User::getUsername)           // username IS NOT NULL AND username != ''
```

## 范围查询 {#in-between}

```java
where -> where
    .in(User::getId, Arrays.asList(1, 2, 3))       // id IN (1,2,3)
    .between(User::getId, 1L, 100L)                 // id BETWEEN 1 AND 100
    .notBetween(User::getId, 999L, 9999L)           // id NOT BETWEEN 999 AND 9999
```

## 正则匹配 {#regexp}

```java
where -> where.regexp(User::getUsername, "^user[0-9]+$")    // username REGEXP '^user[0-9]+$'
```

## 列与列比较 {#column-compare}

```java
where -> where.eqColumn(User::getRole, User::getRole)      // role = role (永真)
```

## 逗号分隔值搜索 {#contain-any}

适用于 `tags = "java,spring,mysql"` 这种存储方式：

```java
where -> where.containAny(Entity::getTags, Arrays.asList("java"))           // 包含 java
where -> where.containAny(Entity::getTags, Arrays.asList("python", "java")) // 包含 python 或 java
```

## 永真条件 {#true}

```java
where -> where._true()    // WHERE 1=1
```

## 条件开关 {#condition-switch}

当 `condition` 为 `false` 时，该条件会被跳过：

```java
String searchVal = request.getSearch(); // 可能为 null
where -> where
    .eq(User::getRole, "user")
    .eq(searchVal != null, User::getUsername, searchVal)  // searchVal 为 null 时跳过
```

## 逻辑组合 {#and-or-not}

### OR 连接

```java
// 简单 OR：下一个条件用 OR 连接
where -> where.eq(User::getUsername, "user1").or().eq(User::getUsername, "admin")
// SQL: username = 'user1' OR username = 'admin'
```

### 嵌套 OR

```java
where -> where.eq(User::getRole, "user")
      .or(order -> order.eq(User::getUsername, "admin"))
// SQL: role = 'user' OR (username = 'admin')
```

### 嵌套 AND

```java
where -> where.eq(User::getRole, "user")
      .and(a -> a.ge(User::getCreditScore, 50).le(User::getCreditScore, 200))
// SQL: role = 'user' AND (credit_score >= 50 AND credit_score <= 200)
```

### NOT

```java
where -> where.not(n -> n.eq(User::getRole, "nonexist"))
// SQL: NOT (role = 'nonexist')
```

## 子查询 {#sub-query}

### EXISTS

```java
where -> where.exists(sub -> sub
    .from(Demand.class)
    .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)))
// SQL: EXISTS (SELECT * FROM demand WHERE demand.user_id = user.id)
```

### NOT EXISTS

```java
where -> where.notExists(sub -> sub
    .from(Demand.class)
    .where(subWhere -> subWhere.eqColumn(Demand::getUserId, User::getId)))
```

### IN 子查询

```java
where -> where.inSubSql(User::getId,
    sub -> sub.from(Demand.class)
        .select(select -> select.selectFunc(inner -> inner.column(Demand::getUserId), SingleValue::getValue)))
// SQL: id IN (SELECT user_id FROM demand)
```

## 函数版 WHERE {#func-where}

当列和值都需要用函数表达式时：

```java
where -> where
    .eqFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(100))
    .gtFunc(arg -> arg.column(User::getId), arg -> arg.value(0))
    .geFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(100))
    .leFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(200))
    .ltFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(9999))
    .neFunc(arg -> arg.column(User::getRole), arg -> arg.value("admin"))
    .betweenFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(50), arg -> arg.value(200))
    .notBetweenFunc(arg -> arg.column(User::getCreditScore), arg -> arg.value(9000), arg -> arg.value(9999))
    .isNullFunc(arg -> arg.column(User::getOpenid))
    .isNotNullFunc(arg -> arg.column(User::getUsername))
    .likeFunc(arg -> arg.column(User::getUsername), arg -> arg.value("%user%"))
    .likeLeftFunc(arg -> arg.column(User::getUsername), arg -> arg.value("1"))
    .likeRightFunc(arg -> arg.column(User::getUsername), arg -> arg.value("user"))
    .likeDefaultFunc(arg -> arg.column(User::getUsername), arg -> arg.value("ser"))
    .notLikeFunc(arg -> arg.column(User::getUsername), arg -> arg.value("admin"))
    .regexpFunc(arg -> arg.column(User::getUsername), arg -> arg.value("^user[0-9]+"))
    .inFunc(arg -> arg.column(User::getRole), arg -> arg.values(Arrays.asList("user", "admin")))
    .notInFunc(arg -> arg.column(User::getRole), arg -> arg.values(Arrays.asList("admin", "superadmin")))
```
