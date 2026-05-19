# 批量写入与 WriteMode

四种批量写入语义，统一接口、**方言自动适配**。一行 `saveDuplicate(...)` 在 MySQL 走 `ON DUPLICATE KEY UPDATE`、在 PG 走 `ON CONFLICT DO UPDATE`、在 DM 走 `MERGE INTO`，用户代码完全一致。

## 四种 WriteMode 总览

| 模式 | Service API | 主键冲突时 | 适用 |
|---|---|---|---|
| `INSERT` | `saveBatchWithoutId(list)` | **报错** | 确认无冲突的全新数据 |
| `DUPLICATE` | `saveDuplicate(list, dup)` | 更新指定字段（保留未冲突字段原值） | 增量同步、计数累加 |
| `IGNORE` | `saveIgnore(list)` | 静默跳过 | 去重插入、幂等写 |
| `REPLACE` | `saveReplace(list)` | 全字段覆盖 | 镜像数据、全量同步 |

## INSERT —— saveBatchWithoutId

```sql
INSERT INTO ms_user (id, name, age, active) VALUES
  (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
```

```java
int rows = userService.saveBatchWithoutId(users);
```

::: tip 名字里的 "WithoutId"
表示**主键由用户自填**（`@TableId(IdType.INPUT)`），框架不会自动生成 ID。如果想用框架自动雪花 ID，配合 `@TableId(IdType.ASSIGN_ID)`。
:::

## DUPLICATE —— saveDuplicate

冲突时**只更新你指定的列**。

### MySQL

```sql
INSERT INTO ms_user (...) VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE age = VALUES(age)
```

### PostgreSQL

```sql
INSERT INTO ms_user (...) VALUES (?, ?, ?, ?)
ON CONFLICT (id) DO UPDATE SET age = EXCLUDED.age
```

### 达梦 DM

```sql
MERGE INTO ms_user t USING (SELECT ? AS id, ? AS name, ? AS age, ? AS active FROM DUAL) src
ON (t.id = src.id)
WHEN MATCHED THEN UPDATE SET t.age = src.age
WHEN NOT MATCHED THEN INSERT (id, name, age, active) VALUES (src.id, src.name, src.age, src.active)
```

### 写法（三方言完全一致）

```java
int rows = userService.saveDuplicate(users,
    dup -> dup.duplicate(User::getAge));
```

### 更新多列

```java
userService.saveDuplicate(users,
    dup -> dup.duplicate(User::getAge)
              .duplicate(User::getActive));
```

### 用表达式而非原值

```java
// 冲突时：score 累加 10
userService.saveDuplicate(users,
    dup -> dup.duplicate(User::getCreditScore,
        func -> func.add(User::getCreditScore, 10)));
```

::: info 返回值
- 新插入 → +1
- 冲突并更新 → +2（INSERT 失败 +1，UPDATE 成功 +1，仅 MySQL）
- PG / DM 返回各方言的实际影响行数

如需精确分清"插入数 vs 更新数"，PG 用 `RETURNING (xmax = 0)` / DM 用 MERGE 返回值——这两个方言扩展尚未提供 service 层包装。
:::

## IGNORE —— saveIgnore

冲突时**静默跳过**，不报错也不更新。

### MySQL

```sql
INSERT IGNORE INTO ms_user (...) VALUES (?, ?, ?, ?)
```

### PostgreSQL

```sql
INSERT INTO ms_user (...) VALUES (?, ?, ?, ?)
ON CONFLICT DO NOTHING
```

### 达梦 DM

```sql
MERGE INTO ms_user t USING (...) src ON (t.id = src.id)
WHEN NOT MATCHED THEN INSERT (...) VALUES (...)
-- 没有 WHEN MATCHED 子句 = 冲突时什么都不做
```

### 写法

```java
int rows = userService.saveIgnore(users);
```

::: warning IGNORE 在 MySQL 的副作用
`INSERT IGNORE` 不仅吞主键冲突，**还会把所有其他错误降级成 warning**（如长度超限、NOT NULL 违反、类型不匹配）。PG / DM 的 `ON CONFLICT DO NOTHING` / `MERGE` 只吞主键冲突，更精确。这是历史包袱，本库不修。
:::

## REPLACE —— saveReplace

冲突时**全字段覆盖**为新行内容。

### MySQL

```sql
REPLACE INTO ms_user (...) VALUES (?, ?, ?, ?)
-- 内部实现：DELETE 旧行 + INSERT 新行
```

### PostgreSQL

```sql
INSERT INTO ms_user (id, name, age, active) VALUES (?, ?, ?, ?)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, age = EXCLUDED.age, active = EXCLUDED.active
```

### 达梦 DM

```sql
MERGE INTO ms_user t USING (...) src ON (t.id = src.id)
WHEN MATCHED THEN UPDATE SET t.name=src.name, t.age=src.age, t.active=src.active
WHEN NOT MATCHED THEN INSERT (...) VALUES (...)
```

### 写法

```java
int rows = userService.saveReplace(users);
```

::: warning MySQL REPLACE 的坑
MySQL 的 `REPLACE INTO` 是 **DELETE + INSERT**，自增 ID 会变化、外键级联会触发、触发器会跑两次（DELETE 触发器 + INSERT 触发器）。PG / DM 的 `ON CONFLICT DO UPDATE` / `MERGE` 是真正的 UPDATE，**不重置 ID、不触发 DELETE 钩子**。

如果业务依赖"旧行的 ID/自增/外键稳定"，请用 PG / DM 或者改用 `saveDuplicate` 明确指定要更新的字段。
:::

## duplicateSet 完整能力

`saveDuplicate` 的第二个参数是 `Consumer<DuplicateSetLambdaQueryWrapper<T>>`，能力比简单"指定列"丰富：

### 列 = 新行的同名列值

```java
dup -> dup.duplicate(User::getAge)
// MySQL:  age = VALUES(age)
// PG:     age = EXCLUDED.age
```

### 列 = 表达式

```java
dup -> dup.duplicate(User::getCreditScore,
    func -> func.add(User::getCreditScore, 10))
// MySQL:  credit_score = credit_score + 10
```

### 列 = 常量

```java
dup -> dup.duplicate(User::getUpdatedAt,
    func -> func.value(LocalDateTime.now()))
// updated_at = '2026-05-19 12:00:00'
```

### 多个列组合

```java
dup -> dup
    .duplicate(User::getAge)
    .duplicate(User::getActive, func -> func.value(true))
    .duplicate(User::getCreditScore, func -> func.add(User::getCreditScore, 1))
```

## 选用决策

```
要批量写一组数据，主键可能冲突吗？
├─ 不会冲突 → saveBatchWithoutId（最快，冲突直接报错）
└─ 可能冲突
    ├─ 冲突时只想跳过 → saveIgnore
    ├─ 冲突时全量覆盖 → saveReplace
    └─ 冲突时只更新部分字段 → saveDuplicate(用 dup 指定列)
```

## 批量大小建议

| 场景 | 建议批大小 |
|---|---|
| MySQL InnoDB / `max_allowed_packet=64M` | 单批 500-2000 行 |
| PostgreSQL | 单批 500-5000 行（取决于行宽和网络） |
| 达梦 DM | 单批 200-1000 行（MERGE INTO 的 USING 子查询不宜过大） |

超大批量（>10k 行）建议在调用方做分片：

```java
List<User> all = ...; // 100k 行
Lists.partition(all, 1000).forEach(batch ->
    userService.saveDuplicate(batch, dup -> dup.duplicate(User::getAge)));
```

## 相关链接

- [多方言支持](/pages/core/dialect/dialect) — 三方言 SQL 形态对照与切换
- [save / update / remove](/pages/core/service/save) — 单条与批量基础 API
