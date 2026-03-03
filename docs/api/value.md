# 值查询 (getValue / listValues)

直接获取某个字段的值或函数计算结果，而非完整实体。

## getValue — 获取单个值

### 三参数版：字段匹配 + 取值

```java
// 查 id=1 的用户名
String name = userService.getValue(User::getId, 1L, User::getUsername);
```

### 条件 + 字段

```java
String nick = userService.getValue(
    w -> w.eq(User::getUsername, "user1"),
    User::getNickname);
```

### 条件 + 函数表达式

```java
// 获取用户名长度
Object len = userService.getValue(
    w -> w.eq(User::getUsername, "user1"),
    x -> x.charLengthFunc(f -> f.column(User::getUsername)));

// 获取当前时间
Object now = userService.getValue(w -> w.eq(User::getId, 1L), x -> x.now());

// 获取 MD5
Object md5 = userService.getValue(w -> w.eq(User::getId, 1L), x -> x.md5("hello"));
```

## listValues — 获取值列表

### 字段匹配 + 取值列表

```java
// 查所有 role="user" 的用户名
List<String> names = userService.listValues(User::getRole, "user", User::getUsername);
```

### 条件 + 取值列表

```java
List<String> names = userService.listValues(
    w -> w.eq(User::getRole, "user"),
    User::getUsername);
```

### 条件 + 排序 + 限制 + 取值

```java
// 取最新 3 个用户名
List<String> top3 = userService.listValues(
    w -> {},
    o -> o.orderDesc(User::getId),
    3,
    User::getUsername);
```

### 条件 + 函数表达式

```java
// 获取所有用户名长度
List<Object> lengths = userService.listValues(
    w -> w.eq(User::getRole, "user"),
    x -> x.charLengthFunc(f -> f.column(User::getUsername)));

// 带排序限制
List<Object> vals = userService.listValues(
    w -> {},
    o -> o.orderAsc(User::getId),
    2,
    x -> x.column(User::getUsername));
```

## 方法签名一览

| 方法 | 说明 |
|------|------|
| `getValue(SFunction, Object, SFunction)` | 字段匹配 → 取列值 |
| `getValue(Consumer<Where>, SFunction)` | 条件 → 取列值 |
| `getValue(Consumer<Where>, Function<Func, V>)` | 条件 → 取函数值 |
| `listValues(SFunction, Object, SFunction)` | 字段匹配 → 取列值列表 |
| `listValues(Consumer<Where>, SFunction)` | 条件 → 取列值列表 |
| `listValues(Consumer<Where>, Function<Func, V>)` | 条件 → 取函数值列表 |
| `listValues(Consumer<Where>, Consumer<Order>, limit, SFunction)` | 条件+排序+限制 → 列值 |
| `listValues(Consumer<Where>, Consumer<Order>, limit, Function)` | 条件+排序+限制 → 函数值 |
