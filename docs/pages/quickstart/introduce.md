# 介绍

[MyBatis-Plus](https://baomidou.com/) Stream Boot Starter（简称 MPS）是一个 MyBatis-Plus 的增强工具，在 MyBatis-Plus 的基础上添加了流式查询、连表查询、聚合函数、批量写入等功能，只做增强不做改变，为简化开发、提高效率而生。

## 特性

- **无侵入**：只做增强不做改变，引入它不会对现有工程产生影响，如丝般顺滑
- **零学习成本**：支持 MP 风格的查询，会 MyBatis-Plus 就会 MPS
- **流式查询**：支持 `stream().filter().sorted().limit().collect()` 链式调用，像操作 Java Stream 一样查询数据库
- **连表查询**：内置 LEFT/RIGHT/INNER/CROSS JOIN 支持，Lambda 类型安全，告别手写 SQL
- **聚合函数**：内置 100+ SQL 函数（聚合、字符串、日期、数学、位运算），全部 Lambda 类型安全
- **逻辑删除**：开箱即用的逻辑删除支持，`withDeleted()` 一键切换查询模式
- **批量写入**：`saveBatchWithoutId` / `saveDuplicate` / `saveIgnore` / `saveReplace` 四种批量写入策略
- **可执行流**：`executableStream()` 流式构建更新、删除和插入操作

## 与 MyBatis-Plus 的关系

本框架是 MyBatis-Plus 的**增强层**，不是替代品：

| 特性 | MyBatis-Plus | MPS |
|------|-------------|-----|
| 基础 CRUD | ✅ | ✅ 继承 |
| LambdaQueryWrapper | ✅ | ✅ 增强版 |
| 连表查询 | ❌ 需手写 SQL | ✅ Lambda JOIN |
| 流式 API | ❌ | ✅ stream() |
| 聚合函数 | ❌ 需手写 SQL | ✅ 100+ 内置函数 |
| 分组查询 | ❌ 需手写 SQL | ✅ listGroup() |
| 批量写入策略 | 仅 saveBatch | ✅ 4 种策略 |
| 逻辑删除增强 | 基础 | ✅ withDeleted() |
| ExecutableStream | ❌ | ✅ 可执行流 |

## 环境要求

- **JDK**: 17+
- **Spring Boot**: 3.x
- **MyBatis-Plus**: 3.5.9（由 starter 自动引入）
- **数据库**: MySQL 5.7+ / 8.0+

## Lambda 表达式速查

框架中所有查询条件都通过 Lambda 回调传入，常见简写：

| 参数名 | 作用 | 示例 |
|--------|------|------|
| `where` | WHERE 条件 | `where -> where.eq(User::getRole, "admin")` |
| `order` | 排序 | `order -> order.orderDesc(User::getId)` |
| `select` | SELECT 映射 | `select -> select.select(User::getName, DTO::getName)` |
| `join` | JOIN 连表 | `join -> join.leftJoin(Order.class, ...)` |
| `group` | GROUP BY | `group -> group.groupBy(User::getRole)` |
| `set` | SET 赋值 | `set -> set.set(User::getScore, 100)` |
| `func` | 函数表达式 | `func -> func.count()` |

## 代码托管

👉 [GitHub](https://github.com/kamioj/mybatis-plus-stream-docs)
