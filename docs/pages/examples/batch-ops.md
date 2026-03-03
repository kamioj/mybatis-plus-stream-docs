# 批量操作

## 批量导入（存在则更新）

Excel/CSV 导入场景，用户名冲突时更新而非报错：

```java
@PostMapping("/import")
public Map<String, Object> importUsers(@RequestBody List<User> users) {
    int affected = userService.saveDuplicate(users,
        dup -> dup.duplicate(User::getNickname)
              .duplicate(User::getCreditScore));

    return Map.of(
        "total", users.size(),
        "affected", affected);
}
```

::: info 返回值
- 纯新增 N 条 → affected = N
- 全部冲突更新 N 条 → affected = 2N（每条 INSERT 失败 +1，UPDATE 成功 +1）
:::

## 批量去重插入

导入数据时静默跳过已存在的记录：

```java
int count = userService.saveIgnore(users);
// 冲突的记录被忽略，不报错
```

## 批量全量覆盖

主键冲突时完全替换原记录（先删后插）：

```java
int count = userService.saveReplace(configList);
// 适用于配置表等需要完全覆盖的场景
```

::: warning
`saveReplace` 会导致自增 ID 变化，有外键关联时慎用。
:::

## 高性能批量插入

确保无冲突的大批量插入，不回填 ID：

```java
List<User> batch = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    User u = new User();
    u.setUsername("import_" + i);
    u.setRole("user");
    u.setCreditScore(100);
    batch.add(u);
}
int count = userService.saveBatchWithoutId(batch);
// 单条 SQL，性能远高于逐条 save()
```

## 条件批量更新

将所有低积分用户标记为限制状态：

```java
int updated = userService.update(
    set -> set.set(User::getRole, "restricted"),
    where -> where
        .eq(User::getRole, "user")
        .lt(User::getCreditScore, 0));
```

## 函数批量更新

全体用户积分重置为 100：

```java
int updated = userService.update(
    set -> set.set(User::getCreditScore, 100),
    where -> where.eq(User::getRole, "user"));
```

全体用户积分 +10（在原值基础上）：

```java
int updated = userService.update(
    set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 10)),
    where -> where.eq(User::getRole, "user"));
```

## ExecutableStream 批量操作

用流式 API 完成更灵活的写操作：

```java
// 流式条件更新
userService.executableStream()
    .filter(where -> where
        .eq(User::getRole, "user")
        .lt(User::getCreditScore, 0))
    .set(set -> set.set(User::getCreditScore, 0))
    .executeUpdate();

// 流式条件删除
userService.executableStream()
    .filter(where -> where
        .eq(User::getRole, "test")
        .lt(User::getCreditScore, -100))
    .executeDelete();

// 指定列插入
User user = new User();
user.setUsername("newuser");
user.setRole("user");
userService.executableStream()
    .effects(User::getUsername, User::getRole)
    .executeInsert(user);
```
