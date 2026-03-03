# 事务与并发

## 积分转账（锁行）

```java
@Transactional
public void transferScore(Long fromId, Long toId, int amount) {
    // 锁定两个用户行，防止并发修改
    User from = userService.getByKeyForUpdate(fromId);
    User to = userService.getByKeyForUpdate(toId);

    if (from == null || to == null) {
        throw new RuntimeException("用户不存在");
    }
    if (from.getCreditScore() < amount) {
        throw new RuntimeException("积分不足");
    }

    userService.update(
        set -> set.setFunc(User::getCreditScore, f -> f.subtract(User::getCreditScore, amount)),
        where -> where.eq(User::getId, fromId));

    userService.update(
        set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, amount)),
        where -> where.eq(User::getId, toId));
}
```

::: warning
`getByKeyForUpdate` 必须在 `@Transactional` 方法中使用，否则锁不会生效。
:::

## 先查后改（乐观处理）

```java
@Transactional
public void acceptDemand(Long demandId, Long caregiverId) {
    // 锁行确保并发安全
    Demand demand = demandService.getByKeyForUpdate(demandId);

    if (!"待接单".equals(demand.getStatus())) {
        throw new RuntimeException("需求已被接单");
    }

    demandService.update(
        set -> set.set(Demand::getStatus, "已接单")
              .set(Demand::getCaregiverId, caregiverId),
        where -> where.eq(Demand::getId, demandId));

    // 创建订单
    Order order = new Order();
    order.setDemandId(demandId);
    order.setCaregiverId(caregiverId);
    order.setStatus("进行中");
    orderService.save(order);
}
```

## 检查存在再操作

```java
public User register(String username, String password) {
    if (userService.exist(where -> where.eq(User::getUsername, username))) {
        throw new RuntimeException("用户名已存在");
    }

    User user = new User();
    user.setUsername(username);
    user.setPassword(password);
    user.setRole("user");
    user.setCreditScore(100);
    userService.save(user);
    return user;
}
```

## 批量操作 + 事务

```java
@Transactional
public void resetInactiveUsers() {
    // 查出所有不活跃用户
    List<Long> inactiveIds = userService.stream()
        .filter(where -> where
            .eq(User::getRole, "user")
            .lt(User::getCreditScore, 10))
        .mapToColumn(User::getId)
        .collect(Collectors.toList());

    if (inactiveIds.isEmpty()) return;

    // 批量更新状态
    userService.update(
        set -> set.set(User::getRole, "inactive"),
        where -> where.in(User::getId, inactiveIds));

    log.info("已标记 {} 个不活跃用户", inactiveIds.size());
}
```

## Stream 中锁行

```java
@Transactional
public List<User> lockAndProcess() {
    return userService.stream()
        .filter(where -> where.eq(User::getRole, "user"))
        .sorted(order -> order.orderAsc(User::getId))
        .limit(5)
        .forUpdate()  // SELECT ... FOR UPDATE
        .collect(Collectors.toList());
}
```
