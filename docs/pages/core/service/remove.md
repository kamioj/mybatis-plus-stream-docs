# remove

按条件删除记录。

## 方法签名

```java
int remove(Consumer<NormalWhereLambdaQueryWrapper> predicate)
```

## 基本用法

```java
int deleted = userService.remove(where -> where.eq(User::getUsername, "test"));
```

## 多条件删除

```java
int deleted = userService.remove(where -> where
    .eq(User::getRole, "user")
    .lt(User::getCreditScore, 0));
```

## 与逻辑删除的关系

如果实体配置了 `@TableLogic`，`remove` 会自动转为逻辑删除：

```java
// 实体中有 @TableLogic
@TableLogic
private Integer deleted;  // 0=未删除, 1=已删除

// 调用 remove
userService.remove(where -> where.eq(User::getUsername, "test"));
// 实际执行: UPDATE user SET deleted=1 WHERE username='test' AND deleted=0
// 而非: DELETE FROM user WHERE username='test'
```

::: tip
详见 [逻辑删除](/pages/core/wrapper/soft-delete) 章节。
:::
