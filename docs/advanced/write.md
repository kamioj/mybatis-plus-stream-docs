# 写操作

框架提供了丰富的写操作 API，涵盖新增、更新、删除和多种批量写入策略。

## 新增

```java
User user = new User();
user.setUsername("newuser");
user.setRole("user");
userService.save(user);
// user.getId() 自动回填主键
```

## 更新

### 按条件更新指定字段

```java
int updated = userService.update(
    s -> s.set(User::getCreditScore, 200),
    w -> w.eq(User::getUsername, "user1"));
```

### 函数表达式赋值

```java
// credit_score = credit_score + 5
userService.update(
    s -> s.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5)),
    w -> w.eq(User::getUsername, "user1"));
```

### 条件跳过赋值

```java
// condition=false 时跳过该 SET
userService.update(
    s -> s.set(User::getCreditScore, 999)
          .set(false, User::getNickname, "CHANGED"),  // 不执行
    w -> w.eq(User::getUsername, "user1"));
```

### 连表更新

```java
int updated = userService.updateJoin(
    j -> j.innerJoin(Demand.class, User::getId, Demand::getUserId),
    s -> s.set(User::getCreditScore, 200),
    w -> w.eq(User::getUsername, "user1"));
```

## 删除

```java
int deleted = userService.remove(w -> w.eq(User::getUsername, "test"));
```

::: tip
如果实体配置了 `@TableLogic`，`remove` 会自动转为逻辑删除（UPDATE deleted=1）。
:::

## 批量写入策略

### saveBatchWithoutId — 批量插入（不回填ID）

```java
List<User> batch = new ArrayList<>();
for (int i = 0; i < 100; i++) {
    User u = new User();
    u.setUsername("batch_" + i);
    u.setRole("user");
    batch.add(u);
}
int count = userService.saveBatchWithoutId(batch);
```

### saveDuplicate — ON DUPLICATE KEY UPDATE

主键或唯一键冲突时更新指定字段：

```java
List<User> batch = List.of(user);
int count = userService.saveDuplicate(batch,
    d -> d.duplicate(User::getCreditScore));
// SQL: INSERT INTO user (...) VALUES (...)
//      ON DUPLICATE KEY UPDATE credit_score = VALUES(credit_score)
```

::: info 返回值说明
- 新增一条 → 返回 1
- 冲突并更新 → 返回 2（INSERT 失败 +1，UPDATE 成功 +1）
:::

### saveIgnore — INSERT IGNORE

主键冲突时忽略，不报错：

```java
int count = userService.saveIgnore(batch);
// SQL: INSERT IGNORE INTO user (...) VALUES (...)
```

### saveReplace — REPLACE INTO

主键冲突时先删后插：

```java
int count = userService.saveReplace(batch);
// SQL: REPLACE INTO user (...) VALUES (...)
```

## 四种策略对比

| 策略 | SQL | 冲突行为 | 适用场景 |
|------|-----|---------|---------|
| `saveBatchWithoutId` | `INSERT INTO` | 报错 | 确保无冲突的批量插入 |
| `saveDuplicate` | `ON DUPLICATE KEY UPDATE` | 更新指定字段 | 存在则更新 |
| `saveIgnore` | `INSERT IGNORE` | 静默跳过 | 去重插入 |
| `saveReplace` | `REPLACE INTO` | 删除后重新插入 | 完全覆盖 |
