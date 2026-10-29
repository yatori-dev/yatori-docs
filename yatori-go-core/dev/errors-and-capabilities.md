# 错误与能力位规范

## 1. 错误模型

V3 使用两层错误：

1. **哨兵错误**：`ErrUnsupported`、`ErrNotLoggedIn`、`ErrInvalidArgument`、`ErrNotFound`；
2. **结构化错误**：`*core.Error`，带平台、操作、错误码、底层错误。

```go
var (
	ErrUnsupported      = errors.New("yatori: operation not supported by platform")
	ErrNotLoggedIn      = errors.New("yatori: not logged in")
	ErrInvalidArgument  = errors.New("yatori: invalid argument")
	ErrNotFound         = errors.New("yatori: not found")
)
```

```go
type Error struct {
	Platform Platform
	Op       string
	Code     string
	Message  string
	Err      error
}
```

### 1.1 包装旧错误

```go
if err := agg.PullCourseList(c.cache); err != nil {
	return nil, core.Wrap(core.MyPlatform, "courses", err)
}
```

`Wrap` 会保留底层错误，调用方仍然可以 `errors.Is`/`errors.As`。

### 1.2 能力不支持

```go
return nil, core.Unsupported(core.MyPlatform, "works")
```

错误文本：

```text
yatori: MYPLATFORM: works: yatori: operation not supported by platform
```

### 1.3 参数错误

```go
return nil, core.Invalid(core.MyPlatform, "study", "node raw data is missing; call Tree first")
```

### 1.4 未登录

```go
return nil, core.NotLoggedIn(core.MyPlatform, "courses")
```

### 1.5 找不到

```go
return nil, core.NotFound(core.MyPlatform, "course", "course not found")
```

---

## 2. 错误使用规则

### 2.1 不要 `log.Fatal` / `os.Exit` / `panic`

适配器是库代码，不能让宿主进程退出。

```go
// 错误
if err != nil {
	log.Fatal(err)
}

// 正确
if err != nil {
	return nil, core.Wrap(core.MyPlatform, "courses", err)
}
```

### 2.2 不要返回裸 JSON 字符串

```go
// 错误
return nil, errors.New(jsonString)

// 正确
return nil, core.Wrap(core.MyPlatform, "login", fmt.Errorf("login failed: %s", jsonString))
```

### 2.3 不要吞掉错误

```go
// 错误
if err != nil {
	return nil, nil
}

// 正确
if err != nil {
	return nil, core.Wrap(core.MyPlatform, "tree", err)
}
```

如果单个章节失败不影响整体，可以记录日志并继续：

```go
if err != nil {
	c.Logger.Debugf("chapter %s failed: %v", chapter.ID, err)
	continue
}
```

### 2.4 错误信息要可定位

推荐格式：

```go
core.Wrap(core.MyPlatform, "study.video", err)
core.Wrap(core.MyPlatform, "work.submit", err)
core.Wrap(core.MyPlatform, "exam.enter", err)
```

`Op` 用点号表示子步骤，便于日志检索。

---

## 3. 能力位

```go
type Capability uint32

const (
	CapLogin Capability = 1 << iota
	CapCookieLogin
	CapCourses
	CapTree
	CapStudy
	CapWorks
	CapExams
	CapSignIn
	CapQRCodeLogin
)
```

### 3.1 设置规则

| 能力位 | 设置条件 |
|---|---|
| `CapLogin` | `Login` 可用 |
| `CapCookieLogin` | `LoginWithCookie` 可用 |
| `CapCourses` | `Courses` 可用 |
| `CapTree` | `Tree` 可用 |
| `CapStudy` | `Study` 可用 |
| `CapWorks` | `Works` 和 `DoWork` 都可用 |
| `CapExams` | `Exams` 和 `DoExam` 都可用 |
| `CapSignIn` | `SignIn` 可用 |
| `CapQRCodeLogin` | 实现了 `core.QRCodeLogin` |

### 3.2 部分支持

如果平台只有列表、没有提交：

- 推荐：不设置 `CapExams`，`DoExam` 返回 `ErrUnsupported`；
- 或者：设置 `CapExams`，但在文档中明确写“仅列表”。

当前 ENAAE 属于后者。新增平台建议采用第一种，避免调用方误解。

### 3.3 能力位不是数据状态

```go
// 错误理解
if !client.Capabilities().Has(core.CapWorks) {
	return // 以为没有作业
}

// 正确
// CapWorks 只表示平台有作业接口
works, _ := client.Works(ctx, course)
// works 可能为空
```

### 3.4 能力位不是登录状态

```go
if err := client.Login(ctx); err != nil {
	// ...
}
// 登录后才能调用 Courses
```

未登录调用 `Courses` 返回 `ErrNotLoggedIn`，不是 `ErrUnsupported`。

---

## 4. 动态调用的一致性

`Call` 必须和强类型方法返回同样的错误：

```go
func (c *client) Call(ctx context.Context, action core.Action, params map[string]any) (any, error) {
	return core.Call(ctx, c, action, params)
}
```

`core.Call` 会调用你实现的方法，所以错误会原样返回：

```go
_, err := client.Call(ctx, core.ActionWorks, map[string]any{"courseId": "c1"})
if errors.Is(err, core.ErrUnsupported) {
	// 平台不支持
}
```

---

## 5. 错误处理检查表

- [ ] 没有 `log.Fatal`
- [ ] 没有 `os.Exit`
- [ ] 没有 `panic`
- [ ] 所有旧动作错误都 `core.Wrap`
- [ ] 不支持的能力返回 `core.Unsupported`
- [ ] 参数问题返回 `core.Invalid`
- [ ] 未登录返回 `core.NotLoggedIn`
- [ ] 错误 Op 可定位
- [ ] 没有吞掉关键错误
- [ ] `Call` 与强类型方法错误一致
- [ ] 能力位真实
- [ ] 文档写明部分支持/限制
