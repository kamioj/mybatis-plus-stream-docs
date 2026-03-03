# 逻辑删除

框架增强了 MyBatis-Plus 的逻辑删除功能，提供 `withDeleted()` 一键切换查询模式。

## 配置逻辑删除

在实体类中使用 `@TableLogic` 注解标记逻辑删除字段：

```java
@Data
@TableName("test_soft_delete")
public class TestSoftDelete {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String tags;
    private Integer score;

    @TableLogic
    private Integer deleted;  // 0=未删除, 1=已删除
}
```

## 自动过滤

配置后，所有查询自动过滤已删除的数据：

```java
// 只返回 deleted=0 的数据
int count = service.count(w -> w.eq(Entity::getStatus, "active"));

// remove 自动变为 UPDATE deleted=1
service.remove(w -> w.eq(Entity::getName, "test"));
// SQL: UPDATE test_soft_delete SET deleted=1 WHERE name='test' AND deleted=0
```

## withDeleted() — 查询包含已删除

```java
// 查询全部数据（包含已删除）
int allCount = service.count(w -> w.withDeleted().eq(Entity::getStatus, "active"));
```

### 条件版

```java
// condition=true 时包含已删除，false 时正常过滤
boolean showAll = request.getShowDeleted();
int count = service.count(w -> w.withDeleted(showAll).eq(Entity::getStatus, "active"));
```

## Stream 中使用

```java
// 流式查询包含已删除
long allCount = service.stream()
    .withDeleted()
    .filter(w -> w.eq(Entity::getStatus, "active"))
    .count();
```

## ExecutableStream 中使用

恢复已逻辑删除的数据：

```java
// 将 deleted=1 改回 deleted=0（恢复数据）
service.executableStream()
    .filter(w -> w.withDeleted().eq(Entity::getName, "recovered_item"))
    .set(s -> s.set(Entity::getDeleted, 0))
    .executeUpdate();
```

## 完整示例

```java
// 1. 插入 5 条数据
for (int i = 1; i <= 5; i++) {
    Entity item = new Entity();
    item.setName("item" + i);
    item.setDeleted(0);
    service.save(item);
}

// 2. 逻辑删除 item4 和 item5
service.remove(w -> w.eq(Entity::getName, "item4"));
service.remove(w -> w.eq(Entity::getName, "item5"));

// 3. 正常查询 → 只看到 3 条
int normal = service.count(w -> {});  // 3

// 4. withDeleted → 看到全部 5 条
int all = service.count(w -> w.withDeleted());  // 5

// 5. 流式也一样
long streamAll = service.stream().withDeleted().count();  // 5
```
