# getValue / listValues

只取某一列（或函数计算结果）的值，**而非完整实体**。`getValue` 取单值，`listValues` 取列表。

## getValue — 单个值

### 按条件取列值

```sql
SELECT nickname FROM user WHERE username = 'user1' LIMIT 1
```

```java
// Stream 形式
String nick = userService.stream()
    .mapToColumn(User::getNickname)
    .filter(where -> where.eq(User::getUsername, "user1"))
    .findFirst()
    .orElse(null);

// 一行语法
String nick = userService.getValue(
    where -> where.eq(User::getUsername, "user1"),
    User::getNickname);
```

### 字段匹配 + 取值

```sql
SELECT username FROM user WHERE id = 1 LIMIT 1
```

```java
// 一行语法（最简）
String name = userService.getValue(User::getId, 1L, User::getUsername);
```

### 函数表达式取值

```sql
SELECT CHAR_LENGTH(username) FROM user WHERE username = 'user1' LIMIT 1
```

```java
// Stream 形式
Object len = userService.stream()
    .mapToValue(func -> func.charLengthFunc(arg -> arg.column(User::getUsername)))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .findFirst()
    .orElse(null);

// 一行语法
Object len = userService.getValue(
    where -> where.eq(User::getUsername, "user1"),
    func -> func.charLengthFunc(arg -> arg.column(User::getUsername)));
```

更多函数：

```sql
SELECT NOW()           FROM user WHERE id = 1 LIMIT 1
SELECT MD5('hello')    FROM user WHERE id = 1 LIMIT 1
```

```java
Object now = userService.getValue(where -> where.eq(User::getId, 1L), inner -> inner.now());
Object md5 = userService.getValue(where -> where.eq(User::getId, 1L), inner -> inner.md5("hello"));
```

## listValues — 值列表

### 按条件取列值列表

```sql
SELECT username FROM user WHERE role = 'user'
```

```java
// Stream 形式
List<String> names = userService.stream()
    .mapToColumn(User::getUsername)
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toList());

// 一行语法
List<String> names = userService.listValues(
    where -> where.eq(User::getRole, "user"),
    User::getUsername);
```

### 字段匹配 + 取值列表

```java
// 一行语法（单字段最简）
List<String> names = userService.listValues(User::getRole, "user", User::getUsername);
```

### 条件 + 排序 + 限制 + 取值

```sql
SELECT username FROM user ORDER BY id DESC LIMIT 3
```

```java
// Stream 形式
List<String> top3 = userService.stream()
    .mapToColumn(User::getUsername)
    .sorted(order -> order.orderDesc(User::getId))
    .limit(3)
    .collect(Collectors.toList());

// 一行语法
List<String> top3 = userService.listValues(
    where -> {},
    order -> order.orderDesc(User::getId),
    3,
    User::getUsername);
```

### 函数表达式列表

```sql
SELECT CHAR_LENGTH(username) FROM user WHERE role = 'user'
```

```java
// Stream 形式
List<Object> lengths = userService.stream()
    .mapToValue(func -> func.charLengthFunc(arg -> arg.column(User::getUsername)))
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toList());
```

## 单列去重：toSet

```sql
SELECT role FROM user
```

```java
// 自动去重
Set<String> roles = userService.stream().toSet(User::getRole);
```

详见 [Stream 收集器 - toSet](/pages/core/stream/collectors#toset-——-单列去重)。

## 一行语法 ↔ Stream 形式对照表

| 一行语法 | Stream 形式 |
|---|---|
| `getValue(SFunction, Object, SFunction)` | `.filter().mapToColumn().findFirst()` |
| `getValue(Where, SFunction)` | `.filter().mapToColumn().findFirst()` |
| `getValue(Where, Function<Func, V>)` | `.filter().mapToValue().findFirst()` |
| `listValues(Where, SFunction)` | `.filter().mapToColumn().collect(toList())` |
| `listValues(Where, Order, limit, SFunction)` | `.filter().sorted().limit().mapToColumn().collect()` |
| `listValues(Where, Function<Func, V>)` | `.filter().mapToValue().collect()` |

## 相关

- [Stream API - mapToColumn / mapToValue](/pages/core/stream/stream#maptocolumn-——-提取单列)
- [Stream 收集器](/pages/core/stream/collectors)
- [函数表达式](/pages/core/wrapper/functions)
