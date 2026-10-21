# Adapter API 规范

这篇文档是 `core.Client` 的**实现契约**。新增平台时，按方法逐个对照。

## 生命周期

```text
New(cfg)
  ├─ 校验参数
  ├─ 构造平台 cache
  └─ 配置代理
       ↓
Login(ctx)
  ├─ 调用平台登录
  ├─ 处理 Cookie/Token
  └─ loggedIn = true
       ↓
Courses(ctx) → Tree(ctx) → Study(ctx)
       ↓
Works/Exams → DoWork/DoExam
       ↓
Close()
```

## 通用规则

### 1. 公开方法必须加锁

```go
func (c *client) Courses(ctx context.Context) ([]core.Course, error) {
	unlock := c.Lock()
	defer unlock()
	// ...
}
```

原因：底层 cache 的 cookie、token、map 不是并发安全的。一个 `Client` 对应一个会话，方法必须串行。

不要在持锁时调用另一个公开方法，否则会死锁：

```go
// 错误：Courses 内部又调用 Tree，Tree 会再次 Lock
func (c *client) Courses(ctx) {
	unlock := c.Lock()
	defer unlock()
	c.Tree(ctx, ...) // 死锁
}
```

需要复用逻辑时，拆成 `xxxLocked` 私有方法。

### 2. 不在 New 里发网络请求

`New` 只做构造。登录、OCR、下载资源都放到 `Login`。

### 3. 上下文

旧动作有的支持 `context.Context`，有的不支持。支持时优先传 `ctx`：

```go
courses, err := agg.PullCourseListContext(ctx, c.cache)
```

不支持时，在调用前检查：

```go
if err := ctx.Err(); err != nil {
	return nil, err
}
```

### 4. 错误

```go
return core.Wrap(core.MyPlatform, "courses", err)
return core.Unsupported(core.MyPlatform, "works")
return core.Invalid(core.MyPlatform, "study", "node raw data is missing")
return core.NotLoggedIn(core.MyPlatform, "courses")
```

不要在 adapter 里 `log.Fatal`、`os.Exit`、`panic`。

### 5. 能力位

只设置你真正实现的方法：

```go
func (c *client) Capabilities() core.Capability {
	return core.CapLogin | core.CapCourses | core.CapTree | core.CapStudy
}
```

### 6. 状态缓存

建议在 adapter 里维护：

```go
type client struct {
	driverutil.Base
	loggedIn bool

	courses map[string]core.Course
	nodes   map[string]core.Node
	works   map[string]*agg.Work
	exams   map[string]*agg.Exam
}
```

用途：

- 让 `Tree` 只传 `courseId` 时能回查；
- 让 `Study` 只传 `nodeId` 时能回查；
- 让 `DoWork`/`DoExam` 只传 ID 时能回查。

---

## New

```go
func New(cfg core.Config) (core.Client, error)
```

### 必须做

- 校验账号/URL/学校/Cookie；
- 构造平台 cache；
- 配置代理；
- 初始化缓存 map。

### 不要做

- 登录；
- 拉课程；
- 初始化 OCR；
- 下载资源；
- 读写全局变量。

### 模板

```go
func New(cfg core.Config) (core.Client, error) {
	if cfg.Account.Username == "" && cfg.Account.Cookie == "" {
		return nil, core.Invalid(core.MyPlatform, "new", "username or cookie is required")
	}
	cache := &api.MyPlatformUserCache{
		Account:  cfg.Account.Username,
		Password: cfg.Account.Password,
	}
	if enabled, proxy := driverutil.ProxyConfig(cfg); enabled {
		cache.IpProxySW = true
		cache.ProxyIP = proxy
	}
	return &client{
		Base:    driverutil.NewBase(cfg),
		cache:   cache,
		courses: map[string]core.Course{},
		nodes:   map[string]core.Node{},
	}, nil
}
```

---

## Platform

```go
func (c *client) Platform() core.Platform
```

直接返回平台常量：

```go
func (c *client) Platform() core.Platform { return core.MyPlatform }
```

---

## Capabilities

```go
func (c *client) Capabilities() core.Capability
```

### 规则

- 实现了 `Login` → `CapLogin`；
- 实现了 `LoginWithCookie` → `CapCookieLogin`；
- 实现了 `Courses` → `CapCourses`；
- 实现了 `Tree` → `CapTree`；
- 实现了 `Study` → `CapStudy`；
- 实现了 `Works` 和 `DoWork` → `CapWorks`；
- 实现了 `Exams` 和 `DoExam` → `CapExams`；
- 实现了 `SignIn` → `CapSignIn`；
- 实现了扫码登录 → `CapQRCodeLogin`。

### 部分支持

如果平台只有考试列表、没有提交：

- 要么不要设置 `CapExams`；
- 要么设置，但在文档中明确写“仅列表，`DoExam` 返回 `ErrUnsupported`”。

当前 ENAAE 属于后者。

---

## Login

```go
func (c *client) Login(ctx context.Context) error
```

### 步骤

1. `c.Lock()`；
2. 如果 `Account.Cookie` 非空，走 Cookie 登录；
3. 需要 OCR 的平台调用 `driverutil.EnsureOCR()`；
4. 调用旧登录动作；
5. 失败 `core.Wrap`；
6. 成功 `loggedIn = true`。

### Cookie 优先

```go
if c.Account().Cookie != "" {
	return c.loginWithCookieLocked(c.Account().Cookie)
}
```

### 资源初始化

只在需要时初始化：

```go
driverutil.EnsureOCR()
```

不要放在 `New`，因为：

- 会在构造对象时写 `./assets`；
- 会让只用 Cookie 登录的用户也承担初始化成本；
- 会让错误发生得更早、更难定位。

---

## LoginWithCookie

```go
func (c *client) LoginWithCookie(ctx context.Context, cookie string) error
```

### 支持 Cookie

```go
func (c *client) LoginWithCookie(ctx context.Context, cookie string) error {
	unlock := c.Lock()
	defer unlock()
	return c.loginWithCookieLocked(cookie)
}

func (c *client) loginWithCookieLocked(cookie string) error {
	c.cache.Password = cookie
	if err := agg.MyPlatformCookieLogin(c.cache); err != nil {
		return core.Wrap(core.MyPlatform, "login_with_cookie", err)
	}
	c.loggedIn = true
	return nil
}
```

### 不支持 Cookie

```go
return core.Unsupported(core.MyPlatform, "login_with_cookie")
```

并且不要设置 `CapCookieLogin`。

---

## Session

```go
func (c *client) Session() core.Session
```

### 目标

返回一个**可持久化**的会话快照。

```go
func (c *client) Session() core.Session {
	return core.Session{
		Platform: core.MyPlatform,
		Account:  c.cache.Account,
		UserID:   c.cache.UserID,
		Cookie:   driverutil.CookieHeader(c.cache.Cookies),
		Token:    c.cache.Token,
		Extra: map[string]string{
			"schoolId": c.cache.SchoolID,
		},
	}
}
```

### 注意

- 不要把 `*http.Cookie` 切片直接放进去；
- 不要放平台原始 cache；
- `Extra` 只放字符串。

---

## Courses

```go
func (c *client) Courses(ctx context.Context) ([]core.Course, error)
```

### 步骤

1. `c.Lock()`；
2. 检查 `loggedIn`；
3. 调用旧动作；
4. 映射成 `[]core.Course`；
5. 存入 `c.courses`；
6. 返回。

### 映射检查表

| 字段 | 要求 |
|---|---|
| `ID` | 稳定、唯一 |
| `Name` | 可读 |
| `Progress` | 0–100 |
| `Status` | `not_started/active/finished` |
| `Extra` | 包含 `Tree` 需要的全部 ID |
| `Raw` | 平台原始对象 |

### 错误

```go
if err != nil {
	return nil, core.Wrap(core.MyPlatform, "courses", err)
}
```

---

## Tree

```go
func (c *client) Tree(ctx context.Context, course core.Course) ([]core.Node, error)
```

### 步骤

1. `c.Lock()`；
2. 检查 `loggedIn`；
3. `resolveCourse`；
4. 调用旧动作；
5. 映射成 `[]core.Node`；
6. 存入 `c.nodes`；
7. 返回。

### 树形 vs 扁平

- 平台有章节层级：用 `Children` 建树；
- 平台只有扁平列表：直接返回 `[]core.Node`；
- 平台有“项目/课堂/课程”多级结构：在 `Courses` 阶段扁平化成课程，`Tree` 只返回课程下的节点。

### Node 检查表

| 字段 | 要求 |
|---|---|
| `ID` | 稳定、唯一，不解析内部格式 |
| `CourseID` | 必填 |
| `ParentID` | 有层级时填 |
| `Kind` | 尽量准确 |
| `Duration` | `time.Duration`，注意秒/毫秒 |
| `Progress` | 0–100 |
| `Completed` | 平台完成标记 |
| `Children` | 子节点 |
| `Extra` | `Study` 需要的全部 ID |
| `Raw` | 平台原始对象 |

### 错误处理

- 整个接口失败：返回 `core.Wrap`；
- 单个章节失败：记录 `c.Logger.Debugf`，继续返回其他章节；
- 空章节：返回空 `Children`，不要报错。

---

## Study

```go
func (c *client) Study(ctx context.Context, req core.StudyRequest) (*core.StudyResult, error)
```

### 三种模式

| 模式 | 适用 | 行为 |
|---|---|---|
| A | 英华/CQIE/TTCDW | 提交一次进度 |
| B | 职教云/课堂行/WeLearn | 一次调用完成整个节点 |
| C | 青书 | start → submit → finish |

### 必须处理

- `req.Action`：`start/progress/pause/finish`
- `req.Mode`：`normal/fast/web`
- `req.Position`
- `req.Node.Raw` 或 `c.nodes[req.Node.ID]`
- 不支持的节点类型 → `ErrUnsupported`

### 返回

```go
&core.StudyResult{
	CourseID:  req.Course.ID,
	NodeID:    req.Node.ID,
	Kind:      req.Node.Kind,
	Submitted: true,
	Position:  position,
	Progress:  progress,
	Completed: completed,
	Message:   report,
	Raw:       report,
}
```

### 注意

- `Progress` 必须是 0–100；
- `Position` 是 `time.Duration`；
- 不要伪造 `Completed`；
- 平台返回字符串错误时，包装成 `error`。

---

## Works

```go
func (c *client) Works(ctx context.Context, course core.Course) ([]core.Work, error)
```

### 步骤

1. `c.Lock()`；
2. 检查 `loggedIn`；
3. `resolveCourse`；
4. 调用旧动作；
5. 映射成 `[]core.Work`；
6. 存入 `c.works`；
7. 返回。

### 注意

- `Status` 是平台原始状态字符串，不强制统一；
- `QuestionCount` 可能为 0，直到进入作业后才拿到；
- `Raw` 必须是 `DoWork` 能识别的类型或指针。

---

## DoWork

```go
func (c *client) DoWork(ctx context.Context, req core.WorkRequest) (*core.AnswerResult, error)
```

### 步骤

1. `c.Lock()`；
2. 检查 `loggedIn`；
3. 从 `req.Work.Raw` 或 `c.works` 取原始作业；
4. 根据 `req.Source` 选择 AI/题库/内置/手动；
5. 调用旧动作；
6. 返回 `AnswerResult`。

### 注意

- `Submit` 表示最后是否提交；
- 学习通的作业是逐题提交，最后一题才真正提交；
- 英华的 AI/题库动作会处理整个过程；
- 海旗会处理课程下所有作业，文档要写清楚。

---

## Exams

```go
func (c *client) Exams(ctx context.Context, course core.Course) ([]core.Exam, error)
```

与 `Works` 类似。注意：

- 有的平台考试列表需要先进入课程；
- `StartAt/EndAt` 可能为空；
- `QuestionCount` 可能为 0；
- 只支持列表时，不要实现 `DoExam`，或返回 `ErrUnsupported` 并在文档说明。

---

## DoExam

```go
func (c *client) DoExam(ctx context.Context, req core.ExamRequest) (*core.AnswerResult, error)
```

与 `DoWork` 类似。注意：

- `Submit` 控制是否交卷；
- 有些平台要求最后一题才交卷；
- 有些平台有“开考 N 分钟内不允许交卷”的限制；
- 不要在没有确认的情况下自动交卷。

---

## SignIn

```go
func (c *client) SignIn(ctx context.Context, req core.SignInRequest) (*core.SignInResult, error)
```

### 注意

- 只有少数平台实现；
- `Extra` 放平台字段（省市区、经纬度、playType 等）；
- 旧实现可能失败只写日志、不返回错误，适配器要尽量补齐错误；
- `Success` 表示流程执行成功，不一定代表服务器接受。

---

## Call

```go
func (c *client) Call(ctx context.Context, action core.Action, params map[string]any) (any, error) {
	return core.Call(ctx, c, action, params)
}
```

不需要自己写 switch。

---

## Close

```go
func (c *client) Close() error { return nil }
```

如果适配器持有文件、连接、goroutine，在这里释放。大多数平台适配器不需要。

---

## 实现检查表

- [ ] `var _ core.Client = (*client)(nil)`
- [ ] `init()` 里 `core.Register`
- [ ] `driver.go` 空导入
- [ ] `New` 不发网络请求
- [ ] 所有公开方法加锁
- [ ] 所有方法检查 `loggedIn`
- [ ] 错误用 `core.Wrap/Unsupported/Invalid/NotLoggedIn`
- [ ] 没有 `log.Fatal/os.Exit`
- [ ] `Course.Extra` 足够重建
- [ ] `Node.ID` 唯一
- [ ] `Progress` 0–100
- [ ] `Duration` 用 `time.Duration`
- [ ] 能力位真实
- [ ] 根包别名
- [ ] 测试和文档
