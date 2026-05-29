# 安装

## 添加依赖

`pom.xml`：

```xml
<dependency>
    <groupId>io.github.kamioj</groupId>
    <artifactId>mybatis-plus-stream-boot-starter</artifactId>
    <version>4.1.2.0</version>
</dependency>
```

::: tip
- starter 自动引入 MyBatis-Plus **3.5.16**，无需额外添加 MP 依赖
- 版本号格式 `{MP-major}.{MP-minor}.{MP-patch}.{本库迭代号}`，即 `4.1.2.0` 跟随 MP 4.1.1
:::

## 数据源配置

### MySQL（默认）

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/your_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

### PostgreSQL

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/your_db
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
```

启动时切方言：

```java
@PostConstruct
public void init() { DialectRegistry.use(DbType.POSTGRE_SQL); }
```

详见 [多方言支持](/pages/core/dialect/dialect)。

### 达梦 DM

```yaml
spring:
  datasource:
    url: jdbc:dm://localhost:5236/YOUR_SCHEMA
    username: SYSDBA
    password: SYSDBA001
    driver-class-name: dm.jdbc.driver.DmDriver
```

```java
@PostConstruct
public void init() { DialectRegistry.use(DbType.DM); }
```

## 分页插件配置

使用 `page()` / `pageJoin()` / `pageGroup()` 前**必须**配置分页插件：

```java
@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

::: warning 重要
不配置分页插件，`page()` 不会真正分页——会返回全量数据。
:::

## Mapper 扫描

两种方式任选其一：

```java
// 方式 1：每个 Mapper 接口加 @Mapper
@Mapper
public interface UserMapper extends StreamBaseMapper<User> {}

// 方式 2：启动类加 @MapperScan
@SpringBootApplication
@MapperScan(basePackages = "com.example.mapper", annotationClass = Mapper.class)
public class Application { ... }
```

::: tip 为什么用 StreamBaseMapper 而不是 BaseMapper
`StreamBaseMapper` 继承 MP 的 `BaseMapper`，**多提供** `insertDuplicate / insertIgnore / insertReplace / mergeInto / updateBatch` 等批量写入入口。

如果你只用读侧 API，`BaseMapper` 也能 work，但失去了 `saveDuplicate / saveIgnore / saveReplace` 这些 service 层方法的底层支持。
:::

## 下一步

- [快速开始](/pages/quickstart/quickstart) — 写第一个查询
- [介绍](/pages/quickstart/introduce) — 了解整体能力地图
