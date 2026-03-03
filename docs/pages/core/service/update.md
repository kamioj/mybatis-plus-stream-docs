# update

按条件更新指定字段。

## 方法签名

```java
int update(Consumer<NormalSetLambdaQueryWrapper> set,
           Consumer<NormalWhereLambdaQueryWrapper> predicate)

int updateJoin(Consumer<JoinLambdaQueryWrapper<T>> join,
               Consumer<NormalSetLambdaQueryWrapper> set,
               Consumer<NormalWhereLambdaQueryWrapper> predicate)
```

## 基本用法

```java
int updated = userService.update(
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```

## 函数表达式赋值 (setFunc)

在原值基础上修改，而不是覆盖：

```java
// credit_score = credit_score + 5
userService.update(
    set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5)),
    where -> where.eq(User::getUsername, "user1"));

// credit_score = credit_score * 2
userService.update(
    set -> set.setFunc(User::getCreditScore, f -> f.multiply(User::getCreditScore, 2)),
    where -> where.eq(User::getUsername, "user1"));
```

::: warning set vs setFunc
```java
set -> set.set(User::getCreditScore, 100)     // SET credit_score = 100（覆盖）
set -> set.setFunc(User::getCreditScore, f -> f.add(User::getCreditScore, 5))
                                            // SET credit_score = credit_score + 5（累加）
```
当需要"在原值基础上修改"时，必须用 `setFunc`。
:::

## 条件跳过赋值

`condition` 为 `false` 时跳过该 SET：

```java
userService.update(
    set -> set.set(User::getCreditScore, 999)
          .set(false, User::getNickname, "CHANGED"),  // 不执行
    where -> where.eq(User::getUsername, "user1"));
```

## updateJoin — 连表更新

```java
int updated = userService.updateJoin(
    join -> join.innerJoin(Demand.class, User::getId, Demand::getUserId),
    set -> set.set(User::getCreditScore, 200),
    where -> where.eq(User::getUsername, "user1"));
```
