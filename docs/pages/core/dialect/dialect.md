# 多方言支持

4.x 起内置 **MySQL / PostgreSQL / 达梦 DM** 三套方言，**用户代码完全一致**——切换方言时上层 `service.list / saveDuplicate / stream` 等 API 一行不用改。差异由 `SqlDialect` SPI 在 SQL 渲染时自动处理。

## 工作机制

```
应用启动
  └─> DialectRegistry 静态初始化
       ├─ 1. 默认注册 MySqlDialect（兜底）
       ├─ 2. ServiceLoader 扫描 META-INF/services 注册扩展方言
       └─ 3. CURRENT = MySQL（默认）

应用启动后（可选）
  └─> DialectRegistry.use(DbType.POSTGRE_SQL)  ← 切换

运行时
  └─> 任何 SQL 渲染都通过 DialectRegistry.current() 取方言
       ├─ INSERT 前缀 / 冲突子句 (saveDuplicate/Ignore/Replace)
       ├─ 分页子句 (page)
       ├─ 标识符引号 (` " " " 自动翻译)
       ├─ 字符串拼接 / 类型转换 / 行锁
       └─ DM 路径：转 MERGE INTO
```

## 切换方言

```java
import com.baomidou.mybatisplus.extension.dialect.DialectRegistry;
import com.baomidou.mybatisplus.annotation.DbType;

@Configuration
public class DialectConfig {
    @PostConstruct
    public void init() {
        DialectRegistry.use(DbType.POSTGRE_SQL);   // 切到 PG
        // DialectRegistry.use(DbType.DM);          // 切到 达梦
    }
}
```

::: tip 默认行为
不调 `use()` 时为 **MySQL**——保持与 3.x 完全一致，不影响存量项目。
:::

## 三方言能力对照

| 子句 / 行为 | MySQL | PostgreSQL | 达梦 DM |
|---|---|---|---|
| **分页** | `LIMIT N OFFSET M` | `LIMIT N OFFSET M` | `LIMIT N OFFSET M`（DM8+） |
| **标识符引号** | `` `name` `` | `"name"` | `"name"` |
| **字符串拼接** | `CONCAT(a, b)` | `a \|\| b` | `CONCAT(a, b)` |
| **类型转换** | `CAST(x AS TYPE)` | `CAST(x AS TYPE)` 或 `x::TYPE` | `CAST(x AS TYPE)` |
| **行锁 NOWAIT** | `FOR UPDATE NOWAIT` (8.0+) | `FOR UPDATE NOWAIT` | `FOR UPDATE NOWAIT` |
| **行锁 WAIT n** | 不支持 | 不支持 | `FOR UPDATE WAIT n` |
| **UPSERT（saveDuplicate）** | `... ON DUPLICATE KEY UPDATE` | `... ON CONFLICT (pk) DO UPDATE SET` | `MERGE INTO ... USING ... WHEN MATCHED ...` |
| **忽略冲突（saveIgnore）** | `INSERT IGNORE` | `... ON CONFLICT DO NOTHING` | `MERGE INTO ... WHEN NOT MATCHED ...` |
| **全字段覆盖（saveReplace）** | `REPLACE INTO` | `... ON CONFLICT (pk) DO UPDATE 全列=EXCLUDED.全列` | `MERGE INTO ...` |
| **GROUP_CONCAT** | `GROUP_CONCAT(col SEPARATOR ',')` | `STRING_AGG(col, ',')` | `WM_CONCAT(col)` / 自适应 |

用户代码完全一致：

```java
userService.saveDuplicate(users, dup -> dup.duplicate(User::getCreditScore));
```

切到 PG 时这一行生成：

```sql
INSERT INTO ms_user (id, name, age, active) VALUES (?, ?, ?, ?)
ON CONFLICT (id) DO UPDATE SET credit_score = EXCLUDED.credit_score
```

切到 DM 时生成：

```sql
MERGE INTO ms_user t USING (SELECT ? AS id, ? AS name, ? AS age, ? AS active FROM DUAL) src
ON (t.id = src.id)
WHEN MATCHED THEN UPDATE SET t.credit_score = src.credit_score
WHEN NOT MATCHED THEN INSERT (id, name, age, active) VALUES (src.id, src.name, src.age, src.active)
```

## PostgreSQL 接入

### 1) 加 JDBC 依赖

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.4</version>
</dependency>
```

### 2) Spring Boot 配置

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/your_db
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
```

### 3) 启动时切换方言

```java
@PostConstruct
public void initDialect() {
    DialectRegistry.use(DbType.POSTGRE_SQL);
}
```

### 4) Schema 示例

```sql
CREATE TABLE ms_user (
    id     BIGINT       PRIMARY KEY,
    name   VARCHAR(64)  NOT NULL,
    age    INTEGER,
    active BOOLEAN
);
```

### 5) 业务代码（与 MySQL 完全相同）

```java
// 批量插入 / UPSERT
userService.saveDuplicate(List.of(u1, u2, u3),
    dup -> dup.duplicate(User::getAge));

// Stream 分组聚合
Map<String, Long> byName = userService.stream()
    .filter(w -> w.eq(User::getActive, true))
    .toMapCount(User::getName);

// 行锁
userService.list(
    w -> w.eq(User::getId, 1L),
    LockMode.FOR_UPDATE);
```

### PG 实测覆盖

主库提供完整的 testcontainers 集成测试，覆盖以下场景（4.1.1.0 起）：

| 测试方法 | 验证 |
|---|---|
| `saveBatch_and_list` | 批量插入 + 条件查询 |
| `stream_filter_collect` | Stream 过滤 + `toSet` |
| `toMap_pushes_select_two_columns` | `toMap` SQL 下推两列 |
| `toMapCount_pushes_group_by_to_sql` | `toMapCount` SQL 下推 GROUP BY |
| `saveDuplicate_pg_uses_on_conflict` | UPSERT 走 `ON CONFLICT DO UPDATE` |
| `saveIgnore_pg_uses_on_conflict_do_nothing` | IGNORE 走 `ON CONFLICT DO NOTHING` |
| `saveReplace_pg_uses_on_conflict_overwrite_all` | REPLACE 走 `ON CONFLICT DO UPDATE 全列=EXCLUDED.全列` |

测试位置 `src/test/java/.../it/PostgreSqlIntegrationTest.java`，使用 `postgres:17-alpine` 真实容器，每次 CI 跑过。

## 达梦 DM 接入

### 1) 加 JDBC 驱动（须自行获取达梦官方驱动 jar）

```xml
<dependency>
    <groupId>com.dameng</groupId>
    <artifactId>DmJdbcDriver18</artifactId>
    <version>8.1.3.140</version>
</dependency>
```

::: warning 驱动获取
达梦 JDBC 驱动不在公共 Maven 仓库，需从达梦官网下载后 `mvn install:install-file` 装入本地仓库或私服。
:::

### 2) Spring Boot 配置

```yaml
spring:
  datasource:
    url: jdbc:dm://localhost:5236/YOUR_SCHEMA
    username: SYSDBA
    password: SYSDBA001
    driver-class-name: dm.jdbc.driver.DmDriver
```

### 3) 启动时切换方言

```java
@PostConstruct
public void initDialect() {
    DialectRegistry.use(DbType.DM);
}
```

### 4) DM 的关键差异

- **UPSERT 走 MERGE INTO**：DM 不支持 `ON DUPLICATE KEY UPDATE` / `ON CONFLICT` 尾子句，所有 `saveDuplicate/Ignore/Replace` 自动改走 `MERGE INTO ... USING (...) src ON (t.pk=src.pk) WHEN MATCHED ... WHEN NOT MATCHED ...` 形态——**用户代码不变**
- **WAIT n 行锁**：DM 独有 `FOR UPDATE WAIT 5`，本库 `LockMode.FOR_UPDATE_WAIT, waitSeconds=5` 会自动生成

::: warning DM 集成测试
4.1.x 暂未把 DM 上 CI（驱动获取受限），建议落地前在本地环境用 PG 同样的测试用例对 DM 跑一遍验证。
:::

## 自定义方言

需要适配 Oracle / SQL Server / TiDB 等其它数据库：

### 1) 实现 `SqlDialect` 接口

```java
public class MyOracleDialect implements SqlDialect {
    @Override public DbType dbType() { return DbType.ORACLE; }
    @Override public String paginate(String baseSql, long offset, long limit) {
        return baseSql + " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
    }
    @Override public String quoteIdentifier(String name) { return "\"" + name + "\""; }
    // ... 其他覆写
}
```

::: tip 偷懒方式
继承 `MySqlDialect` 只覆盖差异方法——大部分方言只在 UPSERT / 分页 / 引号上有差异，其他都能复用。
:::

### 2) 通过 SPI 自动注册

新建 `src/main/resources/META-INF/services/com.baomidou.mybatisplus.extension.dialect.SqlDialect` 文件，内容：

```
com.your.pkg.MyOracleDialect
```

启动时自动被 `ServiceLoader` 扫到，进入 `DialectRegistry`。

### 3) 切换

```java
DialectRegistry.use(DbType.ORACLE);
```

## 跨方言常见坑

### PG: `ON CONFLICT SET` 不能带表前缀

```sql
-- ❌ PG 报错: SET target columns cannot be qualified with the relation name
ON CONFLICT (id) DO UPDATE SET "ms_user"."age" = EXCLUDED.age

-- ✅ PG 要求
ON CONFLICT (id) DO UPDATE SET age = EXCLUDED.age
```

本库 `PostgreSqlDialect.stripTablePrefix()` 已自动剥除——**用户无感知**。如果你手写原生 SQL 走 `mapper.xml`，注意自己处理。

### PG: JDBC Map 列顺序不可靠

执行 `SELECT k, v FROM ...` 后 ResultSet 转 `Map<String,Object>` 时，PG 驱动**不保证 key 顺序与 SELECT 顺序一致**。本库 Stream 收集器走显式 `row.get("alias")` 按名取值规避了这点（4.1.1 修复），但**用户走原生 mapper 拿 Map 时仍要注意**。

### DM: 大小写敏感

DM 默认对未加引号的标识符**转大写**，加引号则保留原大小写。本库 `DamengDialect.quoteIdentifier()` 默认加双引号，**用户代码中的 `User::getCreatedAt` 会渲染成 `"created_at"`**——保持驼峰→下划线的官方映射。如果你的 DM schema 是全大写无引号风格，需在自定义方言里把 quoteIdentifier 改为不加引号。

### 函数名仍是 MySQL 风格

下列函数当前**硬编码 MySQL 语法**，跨 PG/DM 会断（待 4.2+ 方言化）：

- `DATE_FORMAT` / `STR_TO_DATE`
- `SUBSTRING_INDEX`
- `DATE_ADD ... INTERVAL ...`
- `CONVERT(x, TYPE)`（部分位置已用 `CAST` 替代）

如果用到这些函数且要跨方言，**目前需要回退到 mapper.xml 原生 SQL**。

## 相关链接

- [WriteMode 完整章](/pages/core/service/write-mode) — UPSERT/IGNORE/REPLACE 在三方言的具体表现
- [Stream 收集器](/pages/core/stream/collectors) — `toMapCount` 等下推聚合在 PG/DM 上的差异
