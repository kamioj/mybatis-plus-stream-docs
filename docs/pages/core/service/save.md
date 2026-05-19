# save

新增记录。单条用 `save`，批量用 `saveBatchWithoutId`，冲突处理见末尾。

## 单条插入

```sql
INSERT INTO user (username, role, credit_score) VALUES (?, ?, ?)
```

```java
User user = new User();
user.setUsername("newuser");
user.setRole("user");
user.setCreditScore(100);

// Stream 形式
userService.executableStream().executeInsert(user);

// 一行语法
userService.save(user);
```

插入后主键自动回填到 `user.getId()`。

## 批量插入

```sql
INSERT INTO user (username, role, credit_score) VALUES
  (?, ?, ?), (?, ?, ?), (?, ?, ?)
```

```java
List<User> batch = new ArrayList<>();
for (int i = 0; i < 100; i++) {
    User u = new User();
    u.setUsername("batch_" + i);
    u.setRole("user");
    batch.add(u);
}

// Stream 形式
userService.executableStream().executeInsert(batch);

// 一行语法
int count = userService.saveBatchWithoutId(batch);
```

::: tip 名字里的 "WithoutId"
- **不回填主键** —— 实体 `id` 字段不会被自动赋值
- 主键由 **DB 侧的 AUTO_INCREMENT / IDENTITY 生成**，或用 `@TableId(IdType.INPUT)` 用户自填

需要回填用 `save(entity)` 单条调用。
:::

## save vs saveBatchWithoutId

| 方法 | 主键回填 | SQL 数 | 性能 | 适用 |
|---|---|---|---|---|
| `save(entity)` / `executableStream().executeInsert(one)` | ✅ | 1 条 | 一般 | 插入后立即需要 ID |
| `saveBatchWithoutId(list)` / `executableStream().executeInsert(list)` | ❌ | 1 条多值 | 高 | 批量导入，不需要立即拿 ID |

## 冲突处理 — saveDuplicate / saveIgnore / saveReplace

主键或唯一键冲突时，本库提供三种处理策略，**MySQL / PostgreSQL / 达梦 DM SQL 形态自动适配**：

```java
// Stream 形式
userService.executableStream().executeDuplicate(users,
    dup -> dup.duplicate(User::getCreditScore));      // 冲突时只更新指定字段

userService.executableStream().executeIgnore(users);  // 冲突时静默跳过
userService.executableStream().executeReplace(users); // 冲突时全字段覆盖

// 一行语法
userService.saveDuplicate(users, dup -> dup.duplicate(User::getCreditScore));
userService.saveIgnore(users);
userService.saveReplace(users);
```

完整能力（三方言 SQL 对照、duplicateSet 表达式、性能与批大小）见 [WriteMode 与方言](/pages/core/service/write-mode)。

## 相关

- [Stream API - executableStream](/pages/core/stream/executable)
- [WriteMode 与方言](/pages/core/service/write-mode) — 四种写入策略完整对照
- [update](/pages/core/service/update) — 更新已有记录
