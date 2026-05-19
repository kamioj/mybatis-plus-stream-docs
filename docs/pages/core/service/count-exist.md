# count / exist

判断"有多少条"或"有没有"。

## count — 统计数量

```sql
SELECT COUNT(*) FROM user WHERE role = 'user'
```

```java
// Stream 形式
long count = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .count();

// 一行语法
int count = userService.count(where -> where.eq(User::getRole, "user"));
```

统计全表：

```sql
SELECT COUNT(*) FROM user
```

```java
long total = userService.stream().count();

// 一行语法
int total = userService.count(where -> {});
```

组合条件：

```sql
SELECT COUNT(*) FROM user WHERE role = 'user' AND credit_score >= 100
```

```java
long count = userService.stream()
    .filter(where -> where.eq(User::getRole, "user").ge(User::getCreditScore, 100))
    .count();
```

## exist — 判断是否存在

```sql
-- 框架翻译为带 LIMIT 1 的 EXISTS 优化
SELECT 1 FROM user WHERE username = 'user1' LIMIT 1
```

```java
// Stream 形式
boolean exists = userService.stream()
    .filter(where -> where.eq(User::getUsername, "user1"))
    .exist();

// 一行语法
boolean exists = userService.exist(where -> where.eq(User::getUsername, "user1"));
```

::: tip exist 比 count 更快
`exist` 找到一条就返回，`count(*)` 必须扫到满足条件的全部行。**只需要"有没有"时优先用 `exist`**。
:::

## 常用模式

### 注册时检查用户名重复

```java
public User register(String username, String password) {
    boolean taken = userService.stream()
        .filter(where -> where.eq(User::getUsername, username))
        .exist();
    if (taken) {
        throw new BusinessException("用户名已存在");
    }
    User user = new User();
    user.setUsername(username);
    user.setPassword(password);
    userService.save(user);
    return user;
}
```

### 多状态计数：推荐 toMapCount 一次搞定

老写法（三条 SQL）：

```java
int pending   = demandService.count(where -> where.eq(Demand::getStatus, "待接单"));
int accepted  = demandService.count(where -> where.eq(Demand::getStatus, "已接单"));
int completed = demandService.count(where -> where.eq(Demand::getStatus, "已完成"));
```

新写法（一条 SQL，SQL 下推 GROUP BY）：

```sql
SELECT status, COUNT(*) FROM demand GROUP BY status
```

```java
Map<String, Long> byStatus = demandService.stream().toMapCount(Demand::getStatus);
// { "待接单": 12, "已接单": 5, "已完成": 130 }
```

详见 [Stream 收集器 - toMapCount](/pages/core/stream/collectors#tomapcount-——-分组计数)。

## 相关

- [Stream API 全景](/pages/core/stream/stream)
- [Stream 收集器](/pages/core/stream/collectors) — `toMapCount` / `toMapSum` 等下推聚合
