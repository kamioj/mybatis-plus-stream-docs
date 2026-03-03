# 单条查询 (get)

获取满足条件的单条记录。

## 按字段精确匹配

```java
// 按单字段查询
User user = userService.get(User::getUsername, "user1");

// 按 ID 查询
User user = userService.get(User::getId, 1L);
```

**方法签名：**
```java
<U> T get(SFunction<T, U> eqColumn, Object eqValue)
```

## 按条件查询

```java
User user = userService.get(w -> w.eq(User::getRole, "admin"));

// 多条件
User user = userService.get(w -> w
    .eq(User::getRole, "user")
    .eq(User::getUsername, "user1"));
```

**方法签名：**
```java
T get(Consumer<NormalWhereLambdaQueryWrapper> predicate)
```

## 查不到返回默认值

```java
// 字段匹配版
User def = new User();
def.setUsername("DEFAULT");
User user = userService.getOrDefault(User::getUsername, "nonexistent", def);

// 条件版
User user = userService.getOrDefault(
    w -> w.eq(User::getUsername, "nonexistent"),
    def);
```

## 映射到 DTO

将查询结果映射到自定义 DTO 类型：

```java
UserDTO dto = userService.get(
    w -> w.eq(User::getUsername, "user1"),
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .select(User::getCreditScore, UserDTO::getScore),
    UserDTO.class);
```

**方法签名：**
```java
<R> R get(Consumer<NormalWhereLambdaQueryWrapper> predicate,
          Consumer<SelectLambdaQueryWrapper<R>> select,
          Class<R> renameClass)
```

## 锁行查询 (FOR UPDATE)

在事务中使用，防止并发修改：

```java
// 按主键锁行
User locked = userService.getByKeyForUpdate(1L);

// 按实体锁行
User entity = new User();
entity.setId(1L);
User locked = userService.getByEntityForUpdate(entity);
```

::: warning 注意
`getByKeyForUpdate` 和 `getByEntityForUpdate` 需要在事务上下文中使用（方法上加 `@Transactional`），否则锁不会生效。
:::
