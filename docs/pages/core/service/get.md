# get

获取满足条件的**单条**记录。所有 `get` 方法本质都是 `SELECT ... LIMIT 1`。

## 按主键 / 字段精确匹配

```sql
SELECT * FROM user WHERE id = 1 LIMIT 1
```

```java
// Stream 形式
User user = userService.stream()
    .filter(where -> where.eq(User::getId, 1L))
    .findFirst()
    .orElse(null);

// 一行语法
User user = userService.get(User::getId, 1L);
```

## 按条件查询

```sql
SELECT * FROM user WHERE role = 'admin' LIMIT 1
```

```java
// Stream 形式
User user = userService.stream()
    .filter(where -> where.eq(User::getRole, "admin"))
    .findFirst()
    .orElse(null);

// 一行语法
User user = userService.get(where -> where.eq(User::getRole, "admin"));
```

多条件（AND）：

```sql
SELECT * FROM user WHERE role = 'user' AND username = 'user1' LIMIT 1
```

```java
User user = userService.stream()
    .filter(where -> where.eq(User::getRole, "user").eq(User::getUsername, "user1"))
    .findFirst()
    .orElse(null);

// 一行语法
User user = userService.get(where -> where
    .eq(User::getRole, "user")
    .eq(User::getUsername, "user1"));
```

## 查不到返回默认值

```sql
SELECT * FROM user WHERE username = 'nonexistent' LIMIT 1
-- 没有结果时返回 def 实例，不返回 null
```

```java
User def = new User();
def.setUsername("DEFAULT");

// Stream 形式
User user = userService.stream()
    .filter(where -> where.eq(User::getUsername, "nonexistent"))
    .findFirst()
    .orElse(def);

// 一行语法
User user = userService.getOrDefault(User::getUsername, "nonexistent", def);
```

## 映射到 DTO

```sql
SELECT username AS username, credit_score AS score
FROM user
WHERE username = 'user1'
LIMIT 1
```

```java
@Data
class UserDTO { private String username; private Integer score; }

// Stream 形式
UserDTO dto = userService.stream()
    .filter(where -> where.eq(User::getUsername, "user1"))
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .findFirst()
    .orElse(null);

// 一行语法
UserDTO dto = userService.get(
    where -> where.eq(User::getUsername, "user1"),
    select -> select.select(User::getUsername,    UserDTO::getUsername)
                    .select(User::getCreditScore, UserDTO::getScore),
    UserDTO.class);
```

::: tip 为什么用 DTO 映射
- **少传字段** —— 表有 30 列只用 2 列，避免拉回多余数据
- **类型分离** —— `User` 是数据库实体，`UserDTO` 是接口契约
- **字段重命名** —— `credit_score` 在 DTO 里叫 `score`，让接口语义更清晰
:::

## 锁行查询 (FOR UPDATE)

按主键加锁：

```sql
SELECT * FROM user WHERE id = 1 FOR UPDATE
```

```java
// Stream 形式
User locked = userService.stream()
    .filter(where -> where.eq(User::getId, 1L))
    .forUpdate()
    .findFirst()
    .orElse(null);

// 一行语法
User locked = userService.getByKeyForUpdate(1L);
```

按实体（用实体的非空字段构造 WHERE）加锁：

```sql
SELECT * FROM user WHERE id = 1 FOR UPDATE
```

```java
User entity = new User();
entity.setId(1L);
User locked = userService.getByEntityForUpdate(entity);
```

::: warning 必须在事务上下文
`getByKeyForUpdate` / `getByEntityForUpdate` / `stream().forUpdate()` 必须在 `@Transactional` 方法内使用，否则锁立即释放，等同未加锁。

行锁细粒度（`FOR UPDATE NOWAIT` / `FOR UPDATE WAIT n`）见 [多方言支持](/pages/core/dialect/dialect#三方言能力对照)。
:::

## 相关

- [Stream API 全景](/pages/core/stream/stream)
- [list](/pages/core/service/list) — 返回多条记录
- [count / exist](/pages/core/service/count-exist) — 只判断存在性
