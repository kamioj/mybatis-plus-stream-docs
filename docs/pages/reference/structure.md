# 项目结构

## 核心类一览

```
com.baomidou.mybatisplus.extension/
├── service/
│   ├── IMysqlServiceBase<T>          # 核心服务接口（你的 Service 继承它）
│   └── impl/
│       └── MysqlServiceBaseImpl<M,T> # 核心服务实现（你的 ServiceImpl 继承它）
│
├── NormalWhereLambdaQueryWrapper      # WHERE 条件构建器
├── NormalSetLambdaQueryWrapper        # SET 赋值构建器
├── SelectLambdaQueryWrapper<R>        # SELECT 列映射构建器
├── JoinLambdaQueryWrapper<T>          # JOIN 连表构建器
├── GroupLambdaQueryWrapper            # GROUP BY 分组构建器
├── OrderLambdaQueryWrapper            # ORDER BY 排序构建器
├── GroupFunctionLambdaQueryWrapper    # 聚合/函数表达式构建器
├── DuplicateSetLambdaQueryWrapper<T>  # ON DUPLICATE KEY UPDATE 构建器
│
├── MybatisQueryableStream1~5<T,R>    # 查询流（类似 Java Stream）
├── MybatisExecutableStream<T>        # 可执行流（更新/删除/插入）
├── MybatisStream<T>                  # 流基类
│
├── SingleValue                       # 单值 DTO（用于子查询 SELECT 单列）
├── ExQueryWrapper                    # 扩展 QueryWrapper
└── ExecutableQueryWrapper            # 可执行 QueryWrapper
```

## 你需要写的代码

一个典型的项目只需要：

### 1. 实体类 (Entity)

```java
@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String role;
    private Integer creditScore;
}
```

### 2. Mapper 接口

```java
@Mapper
public interface UserMapper extends BaseMapper<User> {}
```

### 3. Service 接口

```java
public interface UserService extends IMysqlServiceBase<User> {
    // 自定义方法（可选）
}
```

### 4. Service 实现

```java
@Service
public class UserServiceImpl
    extends MysqlServiceBaseImpl<UserMapper, User>
    implements UserService {
    // 自定义方法实现（可选）
}
```

### 5. DTO 类（连表/分组查询时使用）

```java
@Data
public class UserOrderDTO {
    private String username;
    private String orderStatus;
    private Long orderCount;
}
```

::: tip
DTO 的字段名不需要与实体字段名一致，通过 `select()` 映射时会自动对应。
:::

## Lambda 表达式速查

框架中所有查询条件都通过 Lambda 的 `Consumer` 回调传入：

| 参数类型 | 简写 | 作用 | 示例 |
|---------|------|------|------|
| `Consumer<NormalWhereLambdaQueryWrapper>` | `w -> ...` | WHERE 条件 | `where -> where.eq(User::getRole, "admin")` |
| `Consumer<OrderLambdaQueryWrapper>` | `o -> ...` | 排序 | `order -> order.orderDesc(User::getId)` |
| `Consumer<SelectLambdaQueryWrapper<R>>` | `s -> ...` | SELECT 映射 | `select -> select.select(User::getName, DTO::getName)` |
| `Consumer<JoinLambdaQueryWrapper<T>>` | `j -> ...` | JOIN 连表 | `join -> join.leftJoin(Order.class, ...)` |
| `Consumer<GroupLambdaQueryWrapper>` | `g -> ...` | GROUP BY | `group -> group.groupBy(User::getRole)` |
| `Consumer<NormalSetLambdaQueryWrapper>` | `s -> ...` | SET 赋值 | `set -> set.set(User::getScore, 100)` |
| `Function<GroupFunctionLambdaQueryWrapper, V>` | `x -> ...` | 函数表达式 | `func -> func.count()` |
