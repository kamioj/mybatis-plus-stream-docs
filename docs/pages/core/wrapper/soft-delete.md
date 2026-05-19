# 逻辑删除 (withDeleted)

框架增强了 MyBatis-Plus 的逻辑删除，提供 `withDeleted()` 一键切换查询模式（含 / 不含已删除）。

## 配置

实体类标注 `@TableLogic` 字段：

```java
@Data
@TableName("test_soft_delete")
public class TestSoftDelete {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;

    @TableLogic
    private Integer deleted;   // 0=未删除, 1=已删除
}
```

## 自动过滤

配置后，所有查询自动追加 `deleted = 0` 条件：

```sql
SELECT * FROM test_soft_delete WHERE status = 'active' AND deleted = 0
```

```java
int count = service.count(where -> where.eq(Entity::getStatus, "active"));
```

`remove` 自动转为 UPDATE：

```sql
UPDATE test_soft_delete SET deleted = 1 WHERE name = 'test' AND deleted = 0
```

```java
service.remove(where -> where.eq(Entity::getName, "test"));
```

## withDeleted() — 包含已删除

跳过自动过滤，查全表：

```sql
SELECT COUNT(*) FROM test_soft_delete WHERE status = 'active'
-- 注意：不再追加 deleted = 0
```

```java
int allCount = service.count(where -> where.withDeleted().eq(Entity::getStatus, "active"));
```

### 条件版

按开关决定包不包含已删除：

```java
boolean showAll = request.getShowDeleted();

int count = service.count(where -> where
    .withDeleted(showAll)            // showAll=false 时正常过滤
    .eq(Entity::getStatus, "active"));
```

## 在 Stream 中使用

```sql
SELECT COUNT(*) FROM test_soft_delete WHERE status = 'active'
```

```java
long allCount = service.stream()
    .withDeleted()
    .filter(where -> where.eq(Entity::getStatus, "active"))
    .count();
```

## 恢复已删除数据

```sql
UPDATE test_soft_delete SET deleted = 0 WHERE name = 'recovered_item' AND deleted = 1
```

```java
service.executableStream()
    .filter(where -> where.withDeleted().eq(Entity::getName, "recovered_item"))
    .set(set -> set.set(Entity::getDeleted, 0))
    .executeUpdate();
```

## 完整流程示例

```java
// 1) 插 5 条
for (int i = 1; i <= 5; i++) {
    Entity item = new Entity();
    item.setName("item" + i);
    item.setDeleted(0);
    service.save(item);
}

// 2) 逻辑删除 item4 / item5
service.remove(where -> where.eq(Entity::getName, "item4"));
service.remove(where -> where.eq(Entity::getName, "item5"));

// 3) 正常查询 → 3 条
int normal = service.count(w -> {});                 // 3

// 4) withDeleted → 5 条
int all = service.count(where -> where.withDeleted());       // 5

// 5) 流式同样
long streamAll = service.stream().withDeleted().count();  // 5
```

## 物理删除

即使配了 `@TableLogic`，仍可走 MyBatis-Plus 的原生 mapper 强制物理删除：

```java
mapper.deleteById(userId);                            // 直接 DELETE FROM ...
```

但**不推荐**——逻辑删除的本意就是"留痕可恢复"，物理删除丢数据。

## 方言

逻辑删除是应用层拦截行为，与方言无关。**MySQL / PG / DM 上行为一致**。
