# ExecutableStream

`executableStream()` 是可执行流，用于流式地构建更新、删除和插入操作。

## 流式更新

### SET 赋值更新

```java
int updated = userService.executableStream()
    .filter(w -> w.eq(User::getUsername, "user1"))
    .set(s -> s.set(User::getCreditScore, 200))
    .executeUpdate();
```

### 按实体更新

```java
User entity = new User();
entity.setUsername("user1");
entity.setNickname("new_nickname");
entity.setCreditScore(999);

int updated = userService.executableStream()
    .filter(w -> w.eq(User::getId, 1L))
    .executeUpdate(entity);
```

## 流式删除

```java
int deleted = userService.executableStream()
    .filter(w -> w.eq(User::getUsername, "test_user"))
    .executeDelete();
```

::: tip
如果实体配置了 `@TableLogic`，`executeDelete` 会自动转为逻辑删除。
:::

## 流式插入

### 普通插入

```java
User user = new User();
user.setUsername("newuser");
user.setRole("user");
int result = userService.executableStream()
    .executeInsert(user);
```

### 指定插入列 (effects)

只插入指定的字段，其他字段使用数据库默认值：

```java
User user = new User();
user.setUsername("newuser");
user.setPassword("pass");
user.setNickname("nick");
user.setRole("user");
user.setCreditScore(100);

int result = userService.executableStream()
    .effects(User::getUsername, User::getPassword, User::getNickname,
             User::getRole, User::getCreditScore)
    .executeInsert(user);
```

### ON DUPLICATE KEY UPDATE (duplicate)

```java
User user = new User();
user.setId(1L);
user.setUsername("user1");
user.setCreditScore(200);

int result = userService.executableStream()
    .duplicate(d -> d.duplicate(User::getCreditScore))
    .executeInsert(user);
// SQL: INSERT INTO user (...) VALUES (...)
//      ON DUPLICATE KEY UPDATE credit_score = VALUES(credit_score)
```

### INSERT IGNORE (executeIgnore)

```java
User user = new User();
user.setId(1L);  // 已存在的 ID
user.setUsername("user1");

int result = userService.executableStream()
    .executeIgnore(user);
// 主键冲突时返回 0（静默跳过）
```

### REPLACE INTO (executeReplace)

```java
User user = new User();
user.setId(existingId);
user.setUsername("user1");
user.setCreditScore(999);

int result = userService.executableStream()
    .executeReplace(user);
// 主键冲突时先删后插
```

## 配合逻辑删除

恢复已逻辑删除的数据：

```java
service.executableStream()
    .filter(w -> w.withDeleted().eq(Entity::getName, "deleted_item"))
    .set(s -> s.set(Entity::getDeleted, 0))
    .executeUpdate();
```

## 方法链一览

```
executableStream()
  ├── .filter(w -> ...)           // WHERE 条件
  ├── .set(s -> ...)              // SET 赋值
  │   └── .executeUpdate()        // 执行更新
  ├── .executeUpdate(entity)      // 按实体更新
  ├── .executeDelete()            // 执行删除
  ├── .effects(SFunction...)      // 指定插入列
  │   └── .executeInsert(entity)  // 执行插入
  ├── .duplicate(d -> ...)        // ON DUPLICATE KEY UPDATE
  │   └── .executeInsert(entity)  // 执行插入
  ├── .executeIgnore(entity)      // INSERT IGNORE
  └── .executeReplace(entity)     // REPLACE INTO
```

## 与 update/remove 方法的区别

| 特性 | `update()` / `remove()` | `executableStream()` |
|------|------------------------|---------------------|
| 风格 | 传统方法调用 | 流式链式调用 |
| 按实体更新 | ❌ | ✅ `executeUpdate(entity)` |
| 指定插入列 | ❌ | ✅ `effects(...)` |
| DUPLICATE | `saveDuplicate()` | ✅ `duplicate(...).executeInsert()` |
| IGNORE | `saveIgnore()` | ✅ `executeIgnore()` |
| REPLACE | `saveReplace()` | ✅ `executeReplace()` |

::: tip 何时使用 ExecutableStream？
当你需要更灵活的写操作控制（指定列、冲突处理等）时使用 ExecutableStream。简单的更新/删除直接用 `update()` / `remove()` 更简洁。
:::
