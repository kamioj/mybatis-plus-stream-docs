# 快速开始

## 定义实体

```java
@Data
@TableName("user")
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

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
@Mapper
public interface UserMapper extends BaseMapper<User> {}
```

## 定义 Service

**接口**继承 `IMysqlServiceBase<T>`：

```java
public interface UserService extends IMysqlServiceBase<User> {
    // 你的自定义方法
}
```

**实现类**继承 `MysqlServiceBaseImpl<Mapper, Entity>`：

```java
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
        return userService.list(where -> where.eq(User::getRole, role));
    }

    // 流式查询
    @GetMapping("/top10")
    public List<User> top10() {
        return userService.stream()
            .filter(where -> where.eq(User::getRole, "user"))
            .sorted(order -> order.orderDesc(User::getId))
            .limit(10)
            .collect(Collectors.toList());
    }

    // 统计
    @GetMapping("/count")
    public int countByRole(@RequestParam String role) {
        return userService.count(where -> where.eq(User::getRole, role));
    }
}
```
