---
layout: home

hero:
  name: "MyBatis-Plus Stream"
  text: "流式增强框架"
  tagline: 让数据库操作像写 Java Stream 一样优雅
  actions:
    - theme: brand
      text: 快速开始
      link: /pages/quickstart/quickstart
    - theme: alt
      text: API 参考
      link: /pages/core/service/get
    - theme: alt
      text: GitHub
      link: https://github.com/kamioj/mybatis-plus-stream-boot-starter

features:
  - icon: 🚀
    title: 流式查询
    details: 支持 stream().filter().sorted().limit().collect() 链式调用，像操作 Java Stream 一样查询数据库
  - icon: 🔗
    title: 连表查询
    details: 内置 LEFT/RIGHT/INNER/CROSS JOIN 支持，Lambda 类型安全，告别手写 SQL
  - icon: 📊
    title: 聚合函数
    details: 内置 100+ SQL 函数（聚合、字符串、日期、数学、位运算），全部 Lambda 类型安全
  - icon: 🛡️
    title: 逻辑删除
    details: 开箱即用的逻辑删除支持，withDeleted() 一键切换查询模式
  - icon: ✏️
    title: 批量写入
    details: saveBatchWithoutId / saveDuplicate / saveIgnore / saveReplace 四种批量写入策略
  - icon: 🎯
    title: 零侵入
    details: 基于 MyBatis-Plus 3.5.16 增强，Service 接口继承即用，无需修改现有代码
---

## 安装

[![Maven Central](https://img.shields.io/maven-central/v/io.github.kamioj/mybatis-plus-stream-boot-starter)](https://central.sonatype.com/artifact/io.github.kamioj/mybatis-plus-stream-boot-starter)

::: code-group
```xml [Maven]
<dependency>
    <groupId>io.github.kamioj</groupId>
    <artifactId>mybatis-plus-stream-boot-starter</artifactId>
    <version>4.1.1.1</version>
</dependency>
```

```groovy [Gradle]
implementation 'io.github.kamioj:mybatis-plus-stream-boot-starter:4.1.1.1'
```
:::

> 最新版本号见上方 Maven Central 徽章。

## 一分钟上手

```java
// 1. Service 继承 IStreamService
public interface UserService extends IStreamService<User> {}

// 2. 像写 Stream 一样查询（lambda 调用顺序 = SQL 子句顺序）
List<User> users = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))    // WHERE
    .sorted(order -> order.orderDesc(User::getId))        // ORDER BY
    .limit(10)                                             // LIMIT
    .collect(Collectors.toList());

// 3. 连表 + 分组 + 聚合：Stream 风格一气呵成
List<UserDTO> stats = userService.stream()
    .map(select -> select.select(User::getUsername, UserDTO::getUsername)
                         .selectFunc(inner -> inner.count(), UserDTO::getOrderCount),
         UserDTO.class)                                    // SELECT
    .join(join -> join.leftJoin(Order.class, User::getId, Order::getUserId))  // JOIN
    .filter(where -> where.eq(User::getRole, "user"))    // WHERE
    .group(group -> group.groupBy(User::getId))           // GROUP BY
    .collect(Collectors.toList());

// 4. SQL 下推聚合：一行 toMapCount
Map<String, Long> byRole = userService.stream().toMapCount(User::getRole);
```
