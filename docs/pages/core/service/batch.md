# 批量写入策略

除 `saveBatchWithoutId` 外，框架还提供了三种冲突处理策略。

## saveDuplicate

**ON DUPLICATE KEY UPDATE** — 主键或唯一键冲突时更新指定字段：

```java
List<User> batch = List.of(user);
int count = userService.saveDuplicate(batch,
    dup -> dup.duplicate(User::getCreditScore));
// SQL: INSERT INTO user (...) VALUES (...)
//      ON DUPLICATE KEY UPDATE credit_score = VALUES(credit_score)
```

更新多个字段：

```java
int count = userService.saveDuplicate(batch,
    dup -> dup.duplicate(User::getCreditScore)
          .duplicate(User::getNickname));
```

::: info 返回值说明
- 新增一条 → 返回 **1**
- 冲突并更新 → 返回 **2**（INSERT 失败 +1，UPDATE 成功 +1）
- 批量操作时，返回值是所有行的影响数之和
:::

## saveIgnore

**INSERT IGNORE** — 主键冲突时静默跳过，不报错：

```java
int count = userService.saveIgnore(batch);
// SQL: INSERT IGNORE INTO user (...) VALUES (...)
```

## saveReplace

**REPLACE INTO** — 主键冲突时先删后插：

```java
int count = userService.saveReplace(batch);
// SQL: REPLACE INTO user (...) VALUES (...)
```

::: warning
`saveReplace` 会删除原记录再插入新记录，会触发 DELETE + INSERT 两个操作，自增 ID 会变化。
:::

## 四种策略对比

| 策略 | SQL | 冲突行为 | 适用场景 |
|------|-----|---------|---------|
| `saveBatchWithoutId` | `INSERT INTO` | 报错 | 确保无冲突的批量插入 |
| `saveDuplicate` | `ON DUPLICATE KEY UPDATE` | 更新指定字段 | 存在则更新 |
| `saveIgnore` | `INSERT IGNORE` | 静默跳过 | 去重插入 |
| `saveReplace` | `REPLACE INTO` | 删除后重新插入 | 完全覆盖 |
