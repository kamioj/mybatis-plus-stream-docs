# 安装

## 添加依赖

在 `pom.xml` 中添加：

```xml
<dependency>
    <groupId>zmxe.cn</groupId>
    <artifactId>mybatis-plus-stream-boot-starter</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
```

::: tip 提示
该 starter 会自动引入 MyBatis-Plus 3.5.9，无需额外添加 MyBatis-Plus 依赖。
:::

## 数据库配置

`application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/your_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis-plus:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

## 分页插件配置

使用 `page()` 系列方法前，**必须**配置分页插件：

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
不配置分页插件，`page()` 方法不会分页，会返回全量数据！
:::

## Mapper 扫描

确保 Spring Boot 能扫描到你的 Mapper 接口，两种方式任选其一：

```java
// 方式一：在 Mapper 接口上加 @Mapper
@Mapper
public interface UserMapper extends BaseMapper<User> {}

// 方式二：在启动类上加 @MapperScan
@SpringBootApplication
@MapperScan("com.example.mapper")
public class Application { ... }
```
