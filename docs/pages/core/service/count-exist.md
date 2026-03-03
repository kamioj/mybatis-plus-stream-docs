# count / exist

## count — 统计数量

```java
// 统计角色为 user 的用户数量
int count = userService.count(where -> where.eq(User::getRole, "user"));

// 统计全部
int total = userService.count(where -> {});

// 组合条件
int count = userService.count(where -> where
    .eq(User::getRole, "user")
    .ge(User::getCreditScore, 100));
```

**方法签名：**
```java
int count(Consumer<NormalWhereLambdaQueryWrapper> predicate)
```

## exist — 判断是否存在

```java
// 判断用户名是否已存在
boolean exists = userService.exist(where -> where.eq(User::getUsername, "user1"));

// 判断是否有管理员
boolean hasAdmin = userService.exist(where -> where.eq(User::getRole, "admin"));
```

**方法签名：**
```java
boolean exist(Consumer<NormalWhereLambdaQueryWrapper> predicate)
```

::: tip 实际应用
`exist` 比 `count` 更高效，当你只需要知道"有没有"而不关心"有多少"时，优先使用 `exist`。
:::

## 常见用法

### 注册时检查用户名重复

```java
public User register(String username, String password) {
    if (userService.exist(where -> where.eq(User::getUsername, username))) {
        throw new RuntimeException("用户名已存在");
    }
    User user = new User();
    user.setUsername(username);
    user.setPassword(password);
    userService.save(user);
    return user;
}
```

### 统计不同状态的数量

```java
int pending = demandService.count(where -> where.eq(Demand::getStatus, "待接单"));
int accepted = demandService.count(where -> where.eq(Demand::getStatus, "已接单"));
int completed = demandService.count(where -> where.eq(Demand::getStatus, "已完成"));
```
