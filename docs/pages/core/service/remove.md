# remove

按条件删除记录。

## 基础用法

```sql
DELETE FROM user WHERE username = 'test'
```

```java
// Stream 形式
int deleted = userService.executableStream()
    .filter(where -> where.eq(User::getUsername, "test"))
    .executeDelete();

// 一行语法
int deleted = userService.remove(where -> where.eq(User::getUsername, "test"));
```

## 多条件删除

```sql
DELETE FROM user WHERE role = 'user' AND credit_score < 0
```

```java
// Stream 形式
int deleted = userService.executableStream()
    .filter(where -> where.eq(User::getRole, "user").lt(User::getCreditScore, 0))
    .executeDelete();

// 一行语法
int deleted = userService.remove(where -> where
    .eq(User::getRole, "user")
    .lt(User::getCreditScore, 0));
```

## 与逻辑删除的关系

如果实体配置了 `@TableLogic`，**删除自动转为 UPDATE**：

```java
@TableLogic
private Integer deleted;  // 0=未删除, 1=已删除
```

```sql
-- 不是 DELETE
UPDATE user SET deleted = 1
WHERE username = 'test' AND deleted = 0
```

```java
userService.executableStream()
    .filter(where -> where.eq(User::getUsername, "test"))
    .executeDelete();
```

详见 [逻辑删除](/pages/core/wrapper/soft-delete)。

## 一行语法 ↔ Stream 形式对照表

| 一行语法 | Stream 形式 |
|---|---|
| `remove(Where)` | `executableStream().filter().executeDelete()` |

## 相关

- [Stream API - executableStream](/pages/core/stream/executable)
- [逻辑删除](/pages/core/wrapper/soft-delete)
