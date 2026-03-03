# Stream 流式 API

像操作 Java Stream 一样查询数据库，支持 `filter`、`sorted`、`limit`、`skip`、`map`、`collect` 等操作。

## 基本用法

```java
List<User> users = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .limit(10)
    .collect(Collectors.toList());
```

## 跳过 + 限制

```java
// 跳过前2条，取3条（类似分页 offset=2, limit=3）
List<User> users = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .skip(2)
    .limit(3)
    .collect(Collectors.toList());
```

## 去重

```java
List<User> users = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .distinct()
    .limit(5)
    .collect(Collectors.toList());
```

## count / exist

```java
long count = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .count();

boolean exists = userService.stream()
    .filter(w -> w.eq(User::getUsername, "user1"))
    .exist();
```

## findFirst / findAny

```java
Optional<User> first = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .findFirst();

Optional<User> any = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .findAny();
```

## anyMatch / noneMatch / allMatch

```java
boolean hasHighScore = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .anyMatch(u -> u.getCreditScore() >= 100);

boolean noneInvalid = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .noneMatch(u -> "nonexistent".equals(u.getUsername()));

boolean allHasName = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .allMatch(u -> u.getUsername() != null);
```

## mapToColumn — 提取单列

```java
List<String> names = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .limit(3)
    .mapToColumn(User::getUsername)
    .collect(Collectors.toList());
// 结果: ["user1", "user2", "user3"]
```

## mapToValue — 函数值

```java
List<Integer> scores = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .limit(3)
    .mapToValue(x -> x.column(User::getCreditScore))
    .collect(Collectors.toList());
```

## map — 映射到 DTO

```java
List<UserDTO> list = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .limit(2)
    .map(s -> s.select(User::getUsername, UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .collect(Collectors.toList());
```

## join — 连表

```java
List<User> users = userService.stream()
    .join(j -> j.innerJoin(Demand.class, User::getId, Demand::getUserId))
    .sorted(o -> o.orderAsc(User::getId))
    .limit(5)
    .collect(Collectors.toList());
```

## group — 分组

```java
long groupCount = userService.stream()
    .group(g -> g.groupBy(User::getRole))
    .count();
```

## forUpdate — 锁行

```java
List<User> locked = userService.stream()
    .filter(w -> w.eq(User::getUsername, "user1"))
    .forUpdate()
    .collect(Collectors.toList());
```

## page — 流式分页

```java
IPage<User> page = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderAsc(User::getId))
    .page(new Page<>(1, 3));

List<User> records = page.getRecords();
long total = page.getTotal();
```

## peek / forEach

```java
// peek 中间操作（不消费流）
List<User> list = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .peek(u -> log.info("Processing: {}", u.getUsername()))
    .collect(Collectors.toList());

// forEach 终端操作
List<String> names = new ArrayList<>();
userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .forEach(u -> names.add(u.getUsername()));
```

## mapToInt / reduce / min / max

```java
// mapToInt
int totalScore = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .mapToInt(u -> u.getCreditScore() != null ? u.getCreditScore() : 0)
    .sum();

// reduce
Optional<User> maxScoreUser = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .reduce((a, b) -> a.getCreditScore() >= b.getCreditScore() ? a : b);

// min / max
Optional<User> minUser = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .min(Comparator.comparingInt(u -> u.getCreditScore()));

Optional<User> maxUser = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .max(Comparator.comparingInt(u -> u.getCreditScore()));
```

## flatMap / toArray

```java
// flatMap
List<Character> chars = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .flatMap(u -> u.getUsername().chars().mapToObj(c -> (char) c))
    .collect(Collectors.toList());

// toArray
Object[] arr = userService.stream()
    .filter(w -> w.eq(User::getRole, "admin"))
    .toArray();
```

## withDeleted — 包含已删除

```java
long allCount = service.stream()
    .withDeleted()
    .filter(w -> w.eq(Entity::getStatus, "active"))
    .count();
```
