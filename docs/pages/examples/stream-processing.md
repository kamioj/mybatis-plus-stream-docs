# 流式处理

## 积分统计

```java
// 总积分
int totalScore = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .mapToInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0)
    .sum();

// 平均积分
OptionalDouble avg = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .mapToInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0)
    .average();

// 积分最高的用户
Optional<User> topUser = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .max(Comparator.comparingInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0));
```

## 数据收集与转换

```java
// 按角色分组
Map<String, List<User>> byRole = userService.stream()
    .collect(Collectors.groupingBy(User::getRole));

// 提取用户名列表
List<String> names = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getUsername))
    .mapToColumn(User::getUsername)
    .collect(Collectors.toList());

// ID → User 映射表
Map<Long, User> userMap = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toMap(User::getId, u -> u));
```

## 流式连表

```java
// 查询有需求的用户
List<User> usersWithDemands = userService.stream()
    .join(join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId))
    .sorted(order -> order.orderAsc(User::getId))
    .limit(20)
    .collect(Collectors.toList());
```

## 流式分页

```java
IPage<User> page = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderAsc(User::getId))
    .page(new Page<>(1, 10));

long total = page.getTotal();
List<User> records = page.getRecords();
```

## 流式 DTO 映射

```java
@Data
public class SimpleUserDTO {
    private String username;
    private Integer score;
}

List<SimpleUserDTO> dtos = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderDesc(User::getCreditScore))
    .limit(10)
    .map(select -> select
            .select(User::getUsername, SimpleUserDTO::getUsername)
            .select(User::getCreditScore, SimpleUserDTO::getScore),
         SimpleUserDTO.class)
    .collect(Collectors.toList());
```

## 流式数据校验

检查是否所有用户都有昵称：

```java
boolean allHasNick = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .allMatch(u -> u.getNickname() != null && !u.getNickname().isEmpty());

boolean anyHighScore = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .anyMatch(u -> u.getCreditScore() != null && u.getCreditScore() >= 500);
```

## 流式日志 + 收集

```java
List<User> admins = userService.stream()
    .filter(where -> where.eq(User::getRole, "admin"))
    .peek(u -> log.info("Found admin: {}", u.getUsername()))
    .collect(Collectors.toList());
```

## 包含逻辑删除数据

```java
long allCount = userService.stream()
    .withDeleted()
    .count();

long activeCount = userService.stream()
    .count();

log.info("总记录: {}, 活跃: {}, 已删除: {}", allCount, activeCount, allCount - activeCount);
```
