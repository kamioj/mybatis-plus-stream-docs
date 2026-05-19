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

继承 `StreamBaseMapper`（在 MP 的 `BaseMapper` 上多了批量写入与 MERGE INTO 入口）：

```java
@Mapper
public interface UserMapper extends StreamBaseMapper<User> {}
```

## 定义 Service

**接口**继承 `IStreamService<T>`：

```java
public interface UserService extends IStreamService<User> {
    // 你的自定义方法
}
```

**实现类**继承 `StreamServiceImpl<Mapper, Entity>`：

```java
@Service
public class UserServiceImpl
    extends StreamServiceImpl<UserMapper, User>
    implements UserService {
    // 你的自定义方法实现
}
```

::: tip 旧名字兼容
4.0 起，`IMysqlServiceBase` 改名为 `IStreamService`；`MysqlServiceBaseImpl` 改名为 `StreamServiceImpl`。**旧名字仍可用**（标记 `@Deprecated`），但新代码请用新名字，IDE 会提示替换。
:::

## 第一组查询

### 按主键查询

```sql
SELECT * FROM user WHERE id = 1 LIMIT 1
```

```java
// Stream 形式
User user = userService.stream()
    .filter(where -> where.eq(User::getId, 1L))
    .findFirst()
    .orElse(null);

// 一行语法
User user = userService.get(User::getId, 1L);
```

### 按角色列出

```sql
SELECT * FROM user WHERE role = 'user'
```

```java
// Stream 形式
List<User> users = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .collect(Collectors.toList());

// 一行语法
List<User> users = userService.list(where -> where.eq(User::getRole, "user"));
```

### Top 10（条件 + 排序 + 限制）

```sql
SELECT * FROM user WHERE role = 'user' ORDER BY id DESC LIMIT 10
```

```java
List<User> top10 = userService.stream()
    .filter(where -> where.eq(User::getRole, "user"))
    .sorted(order -> order.orderDesc(User::getId))
    .limit(10)
    .collect(Collectors.toList());
```

### 分组计数（SQL 下推聚合）

```sql
SELECT role, COUNT(*) FROM user GROUP BY role
```

```java
Map<String, Long> byRole = userService.stream().toMapCount(User::getRole);
// { "admin": 3, "user": 42, "guest": 17 }
```

### DTO 映射

```sql
SELECT username AS username, credit_score AS score
FROM user WHERE role = 'user' LIMIT 5
```

```java
@Data
class UserDTO { private String username; private Integer score; }

List<UserDTO> list = userService.stream()
    .map(select -> select.select(User::getUsername,    UserDTO::getUsername)
               .select(User::getCreditScore, UserDTO::getScore),
         UserDTO.class)
    .filter(where -> where.eq(User::getRole, "user"))
    .limit(5)
    .collect(Collectors.toList());
```

## 完整 Controller 示例

```java
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.stream()
            .filter(where -> where.eq(User::getId, id))
            .findFirst()
            .orElse(null);
    }

    @GetMapping("/by-role")
    public List<User> listByRole(@RequestParam String role) {
        return userService.stream()
            .filter(where -> where.eq(User::getRole, role))
            .collect(Collectors.toList());
    }

    @GetMapping("/top10")
    public List<User> top10() {
        return userService.stream()
            .filter(where -> where.eq(User::getRole, "user"))
            .sorted(order -> order.orderDesc(User::getId))
            .limit(10)
            .collect(Collectors.toList());
    }

    @GetMapping("/count-by-role")
    public Map<String, Long> countByRole() {
        return userService.stream().toMapCount(User::getRole);
    }
}
```

## 下一步

- [Stream API 全景](/pages/core/stream/stream) — `filter / sorted / map / join / group / page / collect` 所有操作
- [Stream 收集器](/pages/core/stream/collectors) — `toMap / groupingBy / toMapCount` 等 SQL 下推聚合
- [where](/pages/core/wrapper/where) — WHERE 条件完整能力
- [select](/pages/core/wrapper/select) — SELECT 投影与 DTO 映射
