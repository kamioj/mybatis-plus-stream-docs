# update

按条件更新指定字段。

## 基础用法

```sql
UPDATE user SET credit_score = 200 WHERE username = 'user1'
```

```java
// Stream 形式（executableStream）
int updated = userService.executableStream()
    .set(set -> set.set(User::getCreditScore, 200))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .executeUpdate();

// 一行语法
int updated = userService.update(
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```

## setFunc — 在原值基础上修改

```sql
UPDATE user SET credit_score = credit_score + 5 WHERE username = 'user1'
```

```java
// Stream 形式
userService.executableStream()
    .set(set -> set.setFunc(User::getCreditScore, inner -> inner.add(User::getCreditScore, 5)))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .executeUpdate();

// 一行语法
userService.update(
    set -> set.setFunc(User::getCreditScore, inner -> inner.add(User::getCreditScore, 5)),
    where -> where.eq(User::getUsername, "user1"));
```

乘法同理：

```sql
UPDATE user SET credit_score = credit_score * 2 WHERE username = 'user1'
```

```java
userService.executableStream()
    .set(set -> set.setFunc(User::getCreditScore, inner -> inner.multiply(User::getCreditScore, 2)))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .executeUpdate();
```

::: warning set vs setFunc
| 写法 | SQL | 何时用 |
|---|---|---|
| `set.set(col, value)` | `SET col = ?`（覆盖） | 直接赋一个常量/参数 |
| `set.setFunc(col, inner -> inner.add(col, 5))` | `SET col = col + 5`（基于原值） | 需要"在原值上修改" |

**累加 / 累减 / 倍数 / 拼接 等所有"基于原值"的操作必须用 setFunc**——用 set 会丢失原值。
:::

## 条件跳过赋值

`condition = false` 时该 SET 子句不渲染：

```java
boolean shouldRename = false;

userService.update(
    set -> set.set(User::getCreditScore, 999)
              .set(shouldRename, User::getNickname, "CHANGED"),  // 不执行
    where -> where.eq(User::getUsername, "user1"));
// 实际 SQL: UPDATE user SET credit_score = 999 WHERE username = 'user1'
```

## updateJoin — 关联更新

```sql
UPDATE user u
INNER JOIN demand d ON u.id = d.user_id
SET u.credit_score = 200
WHERE u.username = 'user1'
```

```java
// Stream 形式
userService.executableStream()
    .set(set -> set.set(User::getCreditScore, 200))
    .join(join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId))
    .filter(where -> where.eq(User::getUsername, "user1"))
    .executeUpdate();

// 一行语法
int updated = userService.updateJoin(
    join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId),
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```

::: tip PostgreSQL / 达梦的 UPDATE JOIN 差异
- **PostgreSQL**：不支持 `UPDATE ... JOIN` 形态，需要 `UPDATE t1 SET ... FROM t2 WHERE t1.x = t2.y`
- **达梦**：支持 MERGE INTO 形态

本库 `updateJoin` / `executableStream().join().set().executeUpdate()` 在 PG/DM 上的自动转换正在规划中，**当前仅 MySQL 路径完备**。其他方言上需要 JOIN 更新的复杂场景请走 mapper.xml 原生 SQL。
:::

## 一行语法 ↔ Stream 形式对照表

| 一行语法 | Stream 形式 |
|---|---|
| `update(Set, Where)` | `executableStream().set().filter().executeUpdate()` |
| `updateJoin(Join, Set, Where)` | `executableStream().set().join().filter().executeUpdate()` |

## 相关

- [Stream API - executableStream](/pages/core/stream/executable)
- [函数表达式](/pages/core/wrapper/functions) — `add / multiply` 等可用于 setFunc
- [WriteMode](/pages/core/service/write-mode) — UPSERT 场景（不是 UPDATE）
