# 动态条件查询

后台管理中最常见的场景：用户可能只填写部分搜索条件。

## 基本动态查询

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
所有 WHERE 条件方法都支持 `condition` 参数，为 `false` 时自动跳过该条件。
:::

## 分页 + 动态条件

```java
@GetMapping("/page")
public IPage<User> pageSearch(
    @RequestParam(defaultValue = "1") int pageNum,
    @RequestParam(defaultValue = "10") int pageSize,
    @RequestParam(required = false) String role,
    @RequestParam(required = false) String keyword) {

    return userService.page(
        new Page<>(pageNum, pageSize),
        where -> where
            .eq(role != null, User::getRole, role)
            .likeDefault(keyword != null, User::getUsername, keyword));
}
```

## 动态排序

前端传排序字段和方向：

```java
@GetMapping("/list")
public List<User> listSorted(
    @RequestParam(required = false) String role,
    @RequestParam(defaultValue = "id") String sortField,
    @RequestParam(defaultValue = "desc") String sortDir) {

    return userService.list(
        where -> where.eq(role != null, User::getRole, role),
        order -> {
            boolean asc = "asc".equalsIgnoreCase(sortDir);
            switch (sortField) {
                case "score" -> {
                    if (asc) order.orderAsc(User::getCreditScore);
                    else order.orderDesc(User::getCreditScore);
                }
                case "username" -> {
                    if (asc) order.orderAsc(User::getUsername);
                    else order.orderDesc(User::getUsername);
                }
                default -> {
                    if (asc) order.orderAsc(User::getId);
                    else order.orderDesc(User::getId);
                }
            }
        },
        100);
}
```

## 日期范围查询

```java
@GetMapping("/search-by-date")
public List<Order> searchByDate(
    @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
    @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
    @RequestParam(required = false) String status) {

    return orderService.list(where -> where
        .ge(startDate != null, Order::getCreateTime, startDate)
        .le(endDate != null, Order::getCreateTime, endDate)
        .eq(status != null, Order::getStatus, status));
}
```

## OR 条件组合

搜索用户名或昵称包含关键词：

```java
@GetMapping("/keyword")
public List<User> searchKeyword(@RequestParam String keyword) {
    return userService.list(where -> where
        .and(w2 -> w2
            .likeDefault(User::getUsername, keyword)
            .or()
            .likeDefault(User::getNickname, keyword)));
}
```
