# 简介

## 什么是 MyBatis-Plus Stream？

**MyBatis-Plus Stream Boot Starter** 是基于 [MyBatis-Plus](https://baomidou.com/) 3.5.9 的增强框架，提供了流式查询、连表查询、聚合函数、批量写入等高级功能，让你像写 Java Stream 一样操作数据库。

## 核心特性

### 🚀 流式查询 API

告别繁琐的 Wrapper 构建，用 `stream()` 链式调用完成查询：

```java
List<User> users = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderDesc(User::getId))
    .skip(10)
    .limit(5)
    .collect(Collectors.toList());
```

### 🔗 类型安全的连表查询

内置 LEFT/RIGHT/INNER/CROSS JOIN，无需手写 SQL：

```java
List<UserDTO> list = userService.listJoin(
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .select(Order::getStatus, UserDTO::getOrderStatus),
    UserDTO.class);
```

### 📊 100+ 内置函数

涵盖聚合、字符串、日期、数学、位运算等 SQL 函数，全部 Lambda 类型安全：

```java
// 聚合
x -> x.count()
x -> x.sum(User::getScore)
x -> x.groupConcat(User::getUsername, "|")

// 字符串
x -> x.concatFunc(f -> f.column(User::getName), f -> f.value("-"), f -> f.column(User::getRole))

// 日期
x -> x.dateFormatFunc(f -> f.now(), "%Y-%m-%d")

// 条件
x -> x._if(cond -> cond.eq(User::getRole, "admin"), "是", "否")
```

### 🛡️ 逻辑删除增强

开箱即用，`withDeleted()` 一键查询包含已删除的数据：

```java
// 正常查询 —— 自动过滤已删除
int count = service.count(w -> w.eq(Entity::getStatus, "active"));

// 包含已删除
int all = service.count(w -> w.withDeleted().eq(Entity::getStatus, "active"));
```

### ✏️ 多种批量写入策略

```java
saveBatchWithoutId(list)              // 批量插入（不回填ID）
saveDuplicate(list, d -> d.duplicate(User::getScore))  // ON DUPLICATE KEY UPDATE
saveIgnore(list)                      // INSERT IGNORE
saveReplace(list)                     // REPLACE INTO
```

## 与 MyBatis-Plus 的关系

本框架是 MyBatis-Plus 的**增强层**，不是替代品：

| 特性 | MyBatis-Plus | MyBatis-Plus Stream |
|------|-------------|---------------------|
| 基础 CRUD | ✅ | ✅ 继承 |
| LambdaQueryWrapper | ✅ | ✅ 增强版 |
| 连表查询 | ❌ 需手写 SQL | ✅ Lambda JOIN |
| 流式 API | ❌ | ✅ stream() |
| 聚合函数 | ❌ 需手写 SQL | ✅ 100+ 内置函数 |
| 分组查询 | ❌ 需手写 SQL | ✅ listGroup() |
| 批量写入策略 | 仅 saveBatch | ✅ 4 种策略 |
| 逻辑删除增强 | 基础 | ✅ withDeleted() |
| ExecutableStream | ❌ | ✅ 可执行流 |

## 环境要求

- **JDK**: 17+
- **Spring Boot**: 3.x
- **MyBatis-Plus**: 3.5.9（由 starter 自动引入）
- **数据库**: MySQL 5.7+ / 8.0+
