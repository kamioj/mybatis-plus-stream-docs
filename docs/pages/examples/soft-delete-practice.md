# 软删除实战

## 前提配置

实体中标记逻辑删除字段：

```java
@Data
@TableName("article")
public class Article implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String content;
    private Long authorId;

    @TableLogic
    private Integer deleted;  // 0=正常, 1=已删除
}
```

## 正常查询（自动过滤已删除）

```java
// 所有查询自动加 WHERE deleted = 0
List<Article> articles = articleService.list(
    where -> where.eq(Article::getAuthorId, userId));

int count = articleService.count(where -> where.eq(Article::getAuthorId, userId));

boolean exists = articleService.exist(
    where -> where.eq(Article::getTitle, "测试文章"));
```

## 删除（自动转为逻辑删除）

```java
// 实际执行: UPDATE article SET deleted=1 WHERE id=1 AND deleted=0
articleService.remove(where -> where.eq(Article::getId, 1L));
```

## 查询包含已删除数据

管理后台需要看到所有数据（含已删除）：

```java
// withDeleted() 跳过逻辑删除过滤
List<Article> all = articleService.stream()
    .withDeleted()
    .sorted(order -> order.orderDesc(Article::getId))
    .collect(Collectors.toList());

// 只查已删除的
List<Article> deleted = articleService.stream()
    .withDeleted()
    .filter(where -> where.eq(Article::getDeleted, 1))
    .collect(Collectors.toList());
```

## 恢复已删除数据

使用 ExecutableStream 恢复：

```java
// 恢复指定文章
articleService.executableStream()
    .filter(where -> where
        .withDeleted()
        .eq(Article::getId, articleId)
        .eq(Article::getDeleted, 1))
    .set(set -> set.set(Article::getDeleted, 0))
    .executeUpdate();
```

## 统计（含/不含已删除）

```java
// 活跃文章数
int activeCount = articleService.count(where -> {});

// 全部文章数（含已删除）
long totalCount = articleService.stream()
    .withDeleted()
    .count();

// 已删除文章数
long deletedCount = articleService.stream()
    .withDeleted()
    .filter(where -> where.eq(Article::getDeleted, 1))
    .count();
```

## 回收站功能

```java
@GetMapping("/trash")
public IPage<Article> trashList(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int size) {

    return articleService.stream()
        .withDeleted()
        .filter(where -> where.eq(Article::getDeleted, 1))
        .sorted(order -> order.orderDesc(Article::getId))
        .page(new Page<>(page, size));
}

@PostMapping("/trash/{id}/restore")
public void restore(@PathVariable Long id) {
    articleService.executableStream()
        .filter(where -> where
            .withDeleted()
            .eq(Article::getId, id))
        .set(set -> set.set(Article::getDeleted, 0))
        .executeUpdate();
}

@DeleteMapping("/trash/{id}")
public void permanentDelete(@PathVariable Long id) {
    // 真正物理删除（需要自定义 SQL 或直接操作 Mapper）
    // 框架的 remove() 只能逻辑删除
}
```
