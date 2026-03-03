# 数据导出

## 导出用户列表（DTO 映射）

```java
@Data
public class UserExportDTO {
    private Long id;
    private String username;
    private String nickname;
    private String role;
    private Integer creditScore;
    private String creditLevel;
}

@GetMapping("/export")
public List<UserExportDTO> exportUsers(
    @RequestParam(required = false) String role) {

    return userService.list(
        where -> where.eq(role != null, User::getRole, role),
        order -> order.orderAsc(User::getId),
        10000,
        select -> select.select(User::getId, UserExportDTO::getId)
              .select(User::getUsername, UserExportDTO::getUsername)
              .select(User::getNickname, UserExportDTO::getNickname)
              .select(User::getRole, UserExportDTO::getRole)
              .select(User::getCreditScore, UserExportDTO::getCreditScore)
              .selectCase(c -> c
                  .whenThenValue(cw -> cw.ge(User::getCreditScore, 200), "优秀")
                  .whenThenValue(cw -> cw.ge(User::getCreditScore, 100), "良好")
                  .elseValue("一般"),
                  UserExportDTO::getCreditLevel),
        UserExportDTO.class);
}
```

## 导出统计报表

```java
@Data
public class ExportStatsDTO {
    private String role;
    private Long count;
    private Double avgScore;
    private Integer maxScore;
    private Integer minScore;
    private String userList;
}

@GetMapping("/export-stats")
public List<ExportStatsDTO> exportStats() {
    return userService.listGroup(
        group -> group.groupBy(User::getRole),
        where -> {},
        order -> order.orderFunc(func -> func.count(), false),
        100,
        select -> select.select(User::getRole, ExportStatsDTO::getRole)
              .selectFunc(func -> func.count(), ExportStatsDTO::getCount)
              .selectFunc(func -> func.avg(User::getCreditScore), ExportStatsDTO::getAvgScore)
              .selectFunc(func -> func.max(User::getCreditScore), ExportStatsDTO::getMaxScore)
              .selectFunc(func -> func.min(User::getCreditScore), ExportStatsDTO::getMinScore)
              .selectFunc(func -> func.groupConcat(User::getUsername, ","), ExportStatsDTO::getUserList),
        ExportStatsDTO.class);
}
```

## 流式导出大数据量

分页遍历，避免一次性加载全部数据到内存：

```java
@GetMapping("/export-large")
public void exportLarge(HttpServletResponse response) throws IOException {
    response.setContentType("text/csv");
    response.setHeader("Content-Disposition", "attachment; filename=users.csv");

    PrintWriter writer = response.getWriter();
    writer.println("ID,Username,Role,Score");

    int pageNum = 1;
    int pageSize = 1000;
    IPage<User> page;

    do {
        page = userService.page(
            new Page<>(pageNum, pageSize),
            where -> where.eq(User::getRole, "user"));

        for (User user : page.getRecords()) {
            writer.printf("%d,%s,%s,%d%n",
                user.getId(), user.getUsername(),
                user.getRole(), user.getCreditScore());
        }

        pageNum++;
    } while (page.getCurrent() < page.getPages());

    writer.flush();
}
```

## 提取 ID 列表供其他系统使用

```java
// 提取所有活跃用户的 ID
List<Long> activeIds = userService.stream()
    .filter(where -> where
        .eq(User::getRole, "user")
        .ge(User::getCreditScore, 100))
    .mapToColumn(User::getId)
    .collect(Collectors.toList());

// 提取所有用户名（去重）
List<String> uniqueRoles = userService.stream()
    .mapToColumn(User::getRole)
    .distinct()
    .collect(Collectors.toList());
```

## 构建前端下拉选项

```java
@GetMapping("/options/roles")
public List<Map<String, Object>> roleOptions() {
    return userService.listGroup(
        group -> group.groupBy(User::getRole),
        where -> {},
        select -> select.select(User::getRole, RoleOptionDTO::getRole)
              .selectFunc(func -> func.count(), RoleOptionDTO::getCount),
        RoleOptionDTO.class)
    .stream()
    .map(dto -> Map.<String, Object>of(
        "label", dto.getRole() + " (" + dto.getCount() + ")",
        "value", dto.getRole()))
    .collect(Collectors.toList());
}
```
