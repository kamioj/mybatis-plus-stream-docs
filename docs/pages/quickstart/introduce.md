# 介绍

[MyBatis-Plus](https://baomidou.com/) Stream Boot Starter（简称 **MPS**）是 MyBatis-Plus 的增强工具。**主推 Stream 形式**写数据库查询——`stream().filter().sorted().map().collect()` 的链式心智，每一步对应一段 SQL，不固化方法签名。

## 核心理念

> **让数据库操作像写 SQL 一样一目了然，且像写 Java Stream 一样可组合**

大部分 ORM 链式 API 都在抹除 SQL 形态，写成 `db.where(...).select(...).from(...)` 这种乱序 LINQ 风。本库相反——**保留 `SELECT-FROM-WHERE-GROUP-ORDER-LIMIT` 的顺序与心智**，每段 lambda 都精确对应一段 SQL：

```sql
SELECT username, COUNT(*) AS cnt
FROM user
WHERE role = 'user'
GROUP BY username
ORDER BY cnt DESC
LIMIT 10
```

```java
// Stream 形式（推荐）
List<UserDTO> top = userService.stream()
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
               .selectFunc(inner -> inner.count(), UserDTO::getCnt),
         UserDTO.class)
    .filter(where -> where.eq(User::getRole, "user"))
    .group(group -> group.groupBy(User::getUsername))
    .sorted(order -> order.orderDesc(UserDTO::getCnt))
    .limit(10)
    .collect(Collectors.toList());
```

## Stream 形式的优势

- **每段对应 SQL 一句**：`.filter()` = WHERE，`.sorted()` = ORDER BY，`.limit()` = LIMIT，`.map()` = SELECT/AS，`.group()` = GROUP BY，`.join()` = JOIN
- **不固化**：要去重就加 `.distinct()`、要分组聚合就改 `.toMapCount()`、要前 10 之后再过滤就 `.peek()`，**视觉骨架不变**
- **重构友好**：从"查所有"变成"查所有再分组"只是末尾换一个 collector，不用换整个方法签名

## 特性

- **无侵入** —— 与 MyBatis-Plus 共存，不替换 `BaseMapper` / `IService`
- **流式查询** —— `stream().filter().toMapCount(...)` SQL 下推聚合，比"全表拉回再 JDK Stream"快一个数量级
- **连表查询** —— LEFT/RIGHT/INNER/CROSS JOIN，lambda 类型安全，告别手写 SQL
- **聚合函数** —— 100+ 内置 SQL 函数（聚合 / 字符串 / 日期 / 数学 / 位运算）
- **批量写入** —— `saveDuplicate / saveIgnore / saveReplace` 三种冲突策略
- **多方言** —— MySQL / PostgreSQL / 达梦 DM 自动适配，**用户代码完全一致**
- **子查询** —— IN / EXISTS / SELECT 标量 / JOIN 衍生表，全 lambda
- **行锁** —— `FOR UPDATE NOWAIT / WAIT n`，多方言细粒度
- **一行语法兼容** —— 不熟悉 stream 的开发者可以用 `userService.list/page/...` 一行方法过渡

## 与 MyBatis-Plus 的关系

```
应用代码
  └─ IStreamService<T>           ← 本库新增 60+ 方法 + stream() 入口
       └─ IService<T>            ← MP 原生
            └─ BaseMapper<T>     ← MP 原生（本库通过 StreamBaseMapper 扩展）
```

继承关系：本库 = MP 增强，所有 MP 原生 API 直接可用，不需要选边站。

| 特性 | MyBatis-Plus | MPS |
|---|---|---|
| 基础 CRUD | ✅ | ✅ 继承 |
| LambdaQueryWrapper | ✅ | ✅ 增强版（多 26 个 wrapper 类） |
| Stream API（filter/sorted/map/group/collect）| ❌ | ✅ 本框架主推 |
| 连表 JOIN | ❌ 需手写 SQL / xml | ✅ Lambda JOIN |
| 流式收集（toMap/groupingBy/toMapCount）| ❌ | ✅ 多种 SQL 下推 |
| 聚合函数（COUNT/SUM/AVG/MAX/MIN）| ❌ | ✅ 100+ 内置 |
| 子查询（IN/EXISTS/标量/衍生表）| 仅 IN | ✅ 全 lambda |
| 写入策略（UPSERT/IGNORE/REPLACE）| 仅 saveBatch | ✅ 4 种策略 |
| 跨方言（PG / DM）| 通用方言层 | ✅ 写入侧 SQL 形态自动适配 |
| 行锁 NOWAIT / WAIT n | ❌ | ✅ |
| 逻辑删除 | ✅ | ✅ + `withDeleted()` |

## 与 mybatis-plus-join 的差异

[mybatis-plus-join](https://github.com/yulichang/mybatis-plus-join)（简称 MPJ）也是 MP 的扩展库，社区常被一起提到。但**两者的定位与强项很不一样**——不是同类替代关系。

| 维度 | MPJ | 本库（MPS） |
|---|---|---|
| **核心定位** | "多表 JOIN + 嵌套 DTO 映射" 专家 | "Stream API + 多方言写入" 专家 |
| 设计风格 | 保留 SQL 形态派 / lambda Wrapper 链式 | 保留 SQL 形态派 / **Stream-first** 链式 |
| 嵌套 DTO 自动归并（`selectCollection` / `selectAssociation`）| ✅ **MPJ 独有的护城河** —— 一次 JOIN 自动嵌套子集合 | ❌ 用 `stream().toGroupMap(...)` 应用层拼装 |
| `selectFunc` 任意 SQL 函数模板（`%s` 字符串）| ✅ 灵活 | ⚠️ 偏方言层 cast / concat |
| `FROM (SELECT ...)` 衍生表作主表 | ✅ | ❌ |
| **Stream API**（toMap / groupingBy / toMapCount / toMapSum / toMapAvg / toMapMax / toMapMin）| ❌ 无 | ✅ **本库独有** —— SQL 下推聚合 |
| **`selectSubSql` 标量子查询 lambda** | ⚠️ 需要手写 SQL 字符串 | ✅ 全 lambda 类型安全 |
| **WriteMode 方言自适应**（UPSERT / IGNORE / REPLACE 在 MySQL / PG / DM 自动切 SQL 形态）| ⚠️ 仅沿用 MP 基础 INSERT/UPDATE | ✅ **本库独有** |
| **达梦 DM 一等公民**（`MERGE INTO` 自动生成）| ⚠️ 靠 MP 通用，无 MERGE INTO 生成 | ✅ **本库独有** |
| 行锁 `FOR UPDATE NOWAIT / WAIT n` | ❌ | ✅ |

### 一句话区分

- **MPJ**：场景是"几张表 JOIN 起来拼成一个 DTO 返回前端（含嵌套 List）"——把扁平结果集自动归并为对象图
- **MPS**：场景是"用 JDK Stream 风格写 SQL + 跨 MySQL/PG/DM 写入"——Stream 终端操作和写入策略是抓手

### 共存

两个库**包名不冲突、wrapper 不互相污染**，技术上可以在同一项目里并存。MPJ 处理嵌套 DTO 一对多场景，MPS 处理 Stream 风格查询 + 多方言批量写入。

## 环境要求

| 项 | 版本 |
|---|---|
| JDK | 17+ |
| Spring Boot | 3.x |
| MyBatis-Plus | **3.5.16**（由 starter 自动引入） |
| 数据库 | MySQL 5.7+ / 8.0+，PostgreSQL 9.6+，达梦 DM 8+ |

## Lambda 参数命名约定

本文档统一用 SQL 子句名作为 lambda 参数名，看到参数名就知道这段 lambda 在拼哪段 SQL。

| 参数名 | SQL 对应 | 示例 |
|---|---|---|
| `where` | `WHERE ...` | `where -> where.eq(User::getRole, "admin")` |
| `select` | `SELECT ...` | `select -> select.select(User::getName, DTO::getName)` |
| `join` | `JOIN ... ON ...` | `join -> join.leftJoin(Order.class, ...)` |
| `group` | `GROUP BY ...` | `group -> group.groupBy(User::getRole)` |
| `order` | `ORDER BY ...` | `order -> order.orderDesc(User::getId)` |
| `set` | `SET ... = ...`（UPDATE） | `set -> set.set(User::getScore, 100)` |
| `dup` | `ON DUPLICATE KEY UPDATE ...` | `dup -> dup.duplicate(User::getScore)` |
| `func` | SQL 函数 | `func -> func.count()` / `func.avg(User::getScore)` |
| `sub` | 子查询 | `sub -> sub.from(Order.class).where(...)` |
| `on` | JOIN ON 条件 | `on -> on.eqColumn(User::getId, Order::getUserId)` |

## 代码托管

- GitHub 主库：https://github.com/kamioj/mybatis-plus-stream-boot-starter
- Maven Central：`io.github.kamioj:mybatis-plus-stream-boot-starter`
- 文档仓库：https://github.com/kamioj/mybatis-plus-stream-docs
