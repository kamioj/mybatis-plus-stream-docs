# 快速开始

## 安装依赖

在 `pom.xml` 中添加依赖：

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

使用 `page()` 系列方法前，**必须**配置 MyBatis-Plus 分页插件：

```java
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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

## 定义实体

```java
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String nickname;
    private String role;
    private Integer creditScore;
}
```

## 定义 Mapper

```java
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

## 定义 Service

**接口**继承 `IMysqlServiceBase<T>`：

```java
import com.baomidou.mybatisplus.extension.service.IMysqlServiceBase;

public interface UserService extends IMysqlServiceBase<User> {
    // 你的自定义方法
}
```

**实现类**继承 `MysqlServiceBaseImpl<Mapper, Entity>`：

```java
import com.baomidou.mybatisplus.extension.service.impl.MysqlServiceBaseImpl;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl
    extends MysqlServiceBaseImpl<UserMapper, User>
    implements UserService {
    // 你的自定义方法实现
}
```

## 开始使用

```java
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 按字段查询
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.get(User::getId, id);
    }

    // 条件查询
    @GetMapping("/by-role")
    public List<User> listByRole(@RequestParam String role) {
        return userService.list(w -> w.eq(User::getRole, role));
    }

    // 流式查询
    @GetMapping("/top10")
    public List<User> top10() {
        return userService.stream()
            .filter(w -> w.eq(User::getRole, "user"))
            .sorted(o -> o.orderDesc(User::getId))
            .limit(10)
            .collect(Collectors.toList());
    }

    // 统计
    @GetMapping("/count")
    public int countByRole(@RequestParam String role) {
        return userService.count(w -> w.eq(User::getRole, role));
    }
}
```

::: info 下一步
- 了解完整的 [查询 API](/api/query)
- 学习 [WHERE 条件](/api/where) 的所有用法
- 探索 [Stream 流式 API](/api/stream)
:::
