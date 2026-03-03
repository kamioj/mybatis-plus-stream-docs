# 常见问题 (FAQ)

## 分页查询返回全量数据？

**原因**：没有配置 MyBatis-Plus 分页插件。

**解决**：参考 [快速开始 - 分页插件配置](/guide/getting-started#分页插件配置)，添加 `MybatisPlusInterceptor` Bean。

## `get()` 方法匹配到多条数据会怎样？

`get()` 只返回第一条记录。如果你需要确保唯一性，请在数据库层面加唯一索引，或在业务代码中判断。

## `like` 和 `likeDefault` 的区别？

```java
// like: 需要手动加 % 通配符
w -> w.like(User::getUsername, "%user%")

// likeDefault: 自动在前后加 %
w -> w.likeDefault(User::getUsername, "user")

// 两者等价，likeDefault 更方便
```

类似地：
- `likeLeft("1")` → `LIKE '%1'`
- `likeRight("user")` → `LIKE 'user%'`

## `count` 和 `exist` 怎么选？

- 只需判断"有没有" → 用 `exist()`，数据库执行 `SELECT 1 ... LIMIT 1`，更高效
- 需要知道"有多少" → 用 `count()`

## `save` 和 `saveBatchWithoutId` 的区别？

| 方法 | 主键回填 | 批量 | 性能 |
|------|---------|------|------|
| `save(entity)` | ✅ | 单条 | 一般 |
| `saveBatchWithoutId(list)` | ❌ | 批量 | 高（单条 SQL） |

如果不需要插入后获取自增 ID，优先用 `saveBatchWithoutId`。

## `stream()` 和 `list()` 的区别？

`stream()` 是 `list()` 的流式封装，最终都是执行 SQL 查询：

```java
// 这两个是等价的
userService.list(w -> w.eq(User::getRole, "user"));
userService.stream().filter(w -> w.eq(User::getRole, "user")).collect(Collectors.toList());
```

使用 `stream()` 的场景：
- 需要 `mapToColumn` / `mapToValue` 提取单列
- 需要 `map` 映射到 DTO
- 需要 `anyMatch` / `noneMatch` / `findFirst` 等终端操作
- 喜欢链式调用的编码风格

## `update` 中 `set` 和 `setFunc` 的区别？

```java
// set: 设置固定值
s -> s.set(User::getCreditScore, 100)
// SQL: SET credit_score = 100

// setFunc: 使用函数表达式（可以引用当前列值）
s -> s.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5))
// SQL: SET credit_score = credit_score + 5
```

当需要"在原值基础上修改"时，必须用 `setFunc`，用 `set` 会覆盖原值。

## `withDeleted()` 不生效？

确保实体类的逻辑删除字段加了 `@TableLogic` 注解：

```java
@TableLogic
private Integer deleted;  // 0=未删除, 1=已删除
```

没有 `@TableLogic`，`withDeleted()` 无效，因为框架不知道哪个是逻辑删除字段。

## 连表查询时字段冲突怎么办？

两张表有同名字段时，用**表别名**区分：

```java
userService.listJoin(
    j -> j.leftJoin(Demand.class, "d", User::getId, Demand::getUserId),
    w -> {},
    s -> s.select(User::getId, DTO::getUserId)
          .select(Demand::getId, "d", DTO::getDemandId),  // 指定别名 "d"
    DTO.class);
```

## 子查询中 SELECT 报错？

子查询中的 SELECT 映射目标必须用 `SingleValue::getValue`：

```java
// ✅ 正确
sub -> sub.from(Demand.class)
    .select(ss -> ss.selectFunc(x -> x.count(), SingleValue::getValue))

// ❌ 错误 — 不能用自定义 DTO
sub -> sub.from(Demand.class)
    .select(ss -> ss.selectFunc(x -> x.count(), MyDTO::getCount))
```

## DATE_ADD 的 INTERVAL 值报错？

INTERVAL 后的数字不能用 `value()` 参数化，要用 `customColumn()`：

```java
// ✅ 正确
x -> x.dateAddFunc(f -> f.now(), f -> f.customColumn("7"), "DAY")

// ❌ 错误 — INTERVAL 不支持参数化
x -> x.dateAddFunc(f -> f.now(), f -> f.value(7), "DAY")
```

## `condition` 参数的使用场景？

几乎所有 WHERE 和 SET 方法都支持 `condition` 参数，第一个参数为 `boolean`：

```java
String keyword = request.getKeyword(); // 可能为 null

// condition=false 时自动跳过
w -> w.likeDefault(keyword != null && !keyword.isBlank(), User::getUsername, keyword)
      .eq(role != null, User::getRole, role)
      .ge(minScore != null, User::getCreditScore, minScore)

// SET 中也支持
s -> s.set(User::getCreditScore, 100)
      .set(false, User::getNickname, "不会执行")  // 被跳过
```

这是实现**动态条件查询**的核心机制，避免手动 if-else 拼接。

## `saveDuplicate` 返回值的含义？

- 新增一条 → 返回 **1**
- 主键冲突并更新 → 返回 **2**（INSERT 失败 +1，UPDATE 成功 +1）

批量操作时，返回值是所有行的影响数之和。

## `getByKeyForUpdate` 不生效？

`FOR UPDATE` 锁必须在**事务**中使用：

```java
// ✅ 正确 — 加 @Transactional
@Transactional
public void doSomething(Long id) {
    User locked = userService.getByKeyForUpdate(id);
    // 事务提交后自动释放锁
}

// ❌ 错误 — 没有事务，锁立即释放
public void doSomething(Long id) {
    User locked = userService.getByKeyForUpdate(id);
    // 锁已释放，没有意义
}
```
