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
      link: https://github.com/kamioj/mybatis-plus-stream-docs

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
    details: 基于 MyBatis-Plus 3.5.9 增强，Service 接口继承即用，无需修改现有代码
---

## 一分钟上手

```java
// 1. Service 继承 IMysqlServiceBase
public interface UserService extends IMysqlServiceBase<User> {}

// 2. 像写 Stream 一样查询
List<User> users = userService.stream()
    .filter(w -> w.eq(User::getRole, "user"))
    .sorted(o -> o.orderDesc(User::getId))
    .limit(10)
    .collect(Collectors.toList());

// 3. 连表 + 分组 + 聚合，一行搞定
List<UserDTO> stats = userService.listGroupJoin(
    j -> j.leftJoin(Order.class, User::getId, Order::getUserId),
    g -> g.groupBy(User::getId),
    w -> w.eq(User::getRole, "user"),
    s -> s.select(User::getUsername, UserDTO::getUsername)
          .selectFunc(x -> x.count(), UserDTO::getOrderCount),
    UserDTO.class);
```
