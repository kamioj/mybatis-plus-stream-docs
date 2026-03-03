# save

新增单条记录，主键自动回填。

## 方法签名

```java
boolean save(T entity)
```

## 基本用法

```java
User user = new User();
user.setUsername("newuser");
user.setRole("user");
user.setCreditScore(100);
userService.save(user);

// 插入后自动回填主键
Long id = user.getId(); // 不为 null
```

## saveBatchWithoutId

批量插入，不回填主键，性能更高：

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

::: tip save vs saveBatchWithoutId
| 方法 | 主键回填 | 批量 | 性能 |
|------|---------|------|------|
| `save(entity)` | ✅ | 单条 | 一般 |
| `saveBatchWithoutId(list)` | ❌ | 批量（单条SQL） | 高 |

不需要插入后获取自增 ID 时，优先用 `saveBatchWithoutId`。
:::
