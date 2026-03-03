# 实战案例

本节展示常见业务场景的实现方式。

## 动态条件查询

后台管理中，用户可能只填写部分搜索条件：

```java
@GetMapping("/search")
public List<User> search(
    @RequestParam(required = false) String username,
    @RequestParam(required = false) String role,
    @RequestParam(required = false) Integer minScore,
    @RequestParam(required = false) Integer maxScore) {

    return userService.list(where -> where
        .likeDefault(username != null, User::getUsername, username)
        .eq(role != null, User::getRole, role)
        .ge(minScore != null, User::getCreditScore, minScore)
        .le(maxScore != null, User::getCreditScore, maxScore));
}
```

::: tip 关键点
所有 WHERE 条件方法都支持 `condition` 参数，为 `false` 时自动跳过该条件，非常适合动态查询。
:::

## 分页 + 动态条件 + 排序

```java
@GetMapping("/page")
public IPage<User> pageSearch(
    @RequestParam(defaultValue = "1") int pageNum,
    @RequestParam(defaultValue = "10") int pageSize,
    @RequestParam(required = false) String role,
    @RequestParam(defaultValue = "id") String sortField,
    @RequestParam(defaultValue = "desc") String sortOrder) {

    return userService.page(
        new Page<>(pageNum, pageSize),
        where -> where.eq(role != null, User::getRole, role));
}
```

## 统计报表

### 按角色统计用户数量

```java
List<UserStatsDTO> stats = userService.listGroup(
    group -> group.groupBy(User::getRole),
    where -> {},
    select -> select.select(User::getRole, UserStatsDTO::getRole)
          .selectFunc(func -> func.count(), UserStatsDTO::getCount)
          .selectFunc(func -> func.avg(User::getCreditScore), UserStatsDTO::getAvgScore),
    UserStatsDTO.class);
```

### 统计每个用户的订单数（连表）

```java
List<UserOrderStatsDTO> stats = userService.listGroupJoin(
    join -> join.leftJoin(Order.class, User::getId, Order::getUserId),
    group -> group.groupBy(User::getId),
    where -> where.eq(User::getRole, "user"),
    order -> order.orderFunc(func -> func.count(Order::getId), false),  // 按订单数降序
    10,  // Top 10
    select -> select.select(User::getUsername, UserOrderStatsDTO::getUsername)
          .selectFunc(func -> func.count(Order::getId), UserOrderStatsDTO::getOrderCount),
    UserOrderStatsDTO.class);
```

### 用子查询 SELECT 统计关联数量

不需要 GROUP BY，直接用子查询作为 SELECT 列：

```java
List<UserDetailDTO> list = userService.list(
    where -> where.eq(User::getRole, "user"),
    order -> order.orderAsc(User::getId),
    10,
    select -> select.select(User::getUsername, UserDetailDTO::getUsername)
          .select(User::getCreditScore, UserDetailDTO::getScore)
          .selectSubSql(
              sub -> sub.from(Demand.class)
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Demand::getUserId, User::getId)),
              UserDetailDTO::getDemandCount)
          .selectSubSql(
              sub -> sub.from(Order.class)
                  .select(subSelect -> subSelect.selectFunc(func -> func.count(), SingleValue::getValue))
                  .where(sw -> sw.eqColumn(Order::getUserId, User::getId)),
              UserDetailDTO::getOrderCount),
    UserDetailDTO.class);
```

## 批量导入（存在则更新）

```java
@PostMapping("/import")
public int importUsers(@RequestBody List<User> users) {
    // 用户名冲突时，更新 nickname 和 creditScore
    return userService.saveDuplicate(users,
        dup -> dup.duplicate(User::getNickname)
              .duplicate(User::getCreditScore));
}
```

## 带状态的 CASE WHEN 展示

```java
List<UserDisplayDTO> list = userService.list(
    where -> {},
    order -> order.orderAsc(User::getId),
    100,
    select -> select.select(User::getUsername, UserDisplayDTO::getUsername)
          .selectCase(c -> c
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 200), "🟢 优秀")
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "🟡 良好")
              .whenThenValue(cw -> cw.ge(User::getCreditScore, 60), "🟠 一般")
              .elseValue("🔴 差"),
              UserDisplayDTO::getCreditLevel),
    UserDisplayDTO.class);
```

## 流式处理大量数据

```java
// 统计所有用户的积分总和（不一次性加载全部到内存）
int totalScore = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .mapToInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0)
    .sum();

// 找出积分最高的用户
Optional<User> topUser = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .max(Comparator.comparingInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0));
```

## 事务中的锁行操作

```java
@Transactional
public void transferScore(Long fromId, Long toId, int amount) {
    // 锁定两个用户行，防止并发修改
    User from = userService.getByKeyForUpdate(fromId);
    User to = userService.getByKeyForUpdate(toId);

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

## 检查数据是否存在再执行操作

```java
public User register(String username, String password) {
    // exist 比 count 更高效
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
