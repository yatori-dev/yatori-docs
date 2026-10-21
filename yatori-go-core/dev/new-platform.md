# 新增平台完整教程

这篇文档从零开始，带你新增一个平台适配器。按照步骤做，最后你会得到：

- 一个可以在 `yatori.New(...)` 里使用的平台常量；
- 一个实现 `core.Client` 的适配器；
- 正确的登录、课程、章节、学习、作业/考试能力声明；
- 不依赖真实账号的测试；
- 完整的文档和 PR 检查清单。

为了便于理解，示例平台叫 `MYPLATFORM`，代码放在 `internal/driver/myplatform`。

---

## 0. 先调研平台

在写代码前，先确认这些信息：

| 问题 | 目的 |
|---|---|
| 登录方式是什么？账号密码、验证码、扫码、Cookie？ | 决定 `Login` / `LoginWithCookie` |
| 课程列表接口是什么？返回 JSON 还是 HTML？ | 决定 `Courses` |
| 课程层级是什么？课程 → 章节 → 任务点？项目 → 课堂 → 课程 → 视频？ | 决定 `Tree` 的树形结构 |
| 任务点有哪些类型？视频、音频、文档、直播、作业、考试？ | 决定 `NodeKind` 和 `Study` |
| 学习接口是一次提交还是分次提交？ | 决定 `Study` 的语义 |
| 有没有作业/考试接口？答案来源是什么？ | 决定 `Works` / `Exams` / `AnswerSource` |
| 有没有签到？ | 决定 `SignIn` |
| 是否需要代理、OCR、辅助 exe？ | 决定 `Options` 和资源初始化 |
| 平台是否有反爬/签名/加密？ | 决定是否需要新增 `internal/api` 代码 |

调研输出建议写成一个简单的表格，PR 描述里也要写。

---

## 1. 增加平台常量

修改 `core/platform.go`。

### 1.1 定义常量

```go
const (
	// ...
	MyPlatform Platform = "MYPLATFORM"
)
```

平台字符串建议：

- 全大写；
- 使用平台官方英文名或账号类型名；
- 不要用中文；
- 不要和已有常量重复。

### 1.2 增加描述

```go
var platformDescriptions = map[Platform]string{
	// ...
	MyPlatform: "我的平台",
}
```

`Platform.Valid()` 依赖这个 map。**忘记加描述会导致 `New` 直接报 unsupported platform。**

### 1.3 增加别名

```go
var platformAliases = map[string]Platform{
	// ...
	"MYPLATFORM": MyPlatform,
	"MY":         MyPlatform,
}
```

别名用于兼容配置里的不同写法，例如 `"xuexitong"`、`"XXT"`、`"chaoxing"`。

### 1.4 加入 AllPlatforms

```go
func AllPlatforms() []Platform {
	return []Platform{
		// ...
		MyPlatform,
	}
}
```

这个列表用于：

- `yatori.AllPlatforms()`；
- 文档和测试；
- 检查所有平台是否注册。

---

## 2. 增加根包别名

修改根目录 `types.go`：

```go
const (
	// ...
	MyPlatform = core.MyPlatform
)
```

如果不加这一行，用户只能写 `core.MyPlatform`，不能写 `yatori.MyPlatform`。根包的目标是“一个 import 完成所有事”，所以必须加。

---

## 3. 创建适配器目录

```text
internal/driver/myplatform/
├─ adapter.go
├─ helpers.go        # 可选：纯映射函数
└─ adapter_test.go   # 可选：单元测试
```

包名建议与目录名一致：

```go
package myplatform
```

---

## 4. 最小可运行骨架

先写一个**不接真实接口、但能编译和注册**的骨架。这样可以先验证注册链路，再逐步替换成真实逻辑。

```go
package myplatform

import (
	"context"

	"github.com/yatori-dev/yatori-go-core/core"
	"github.com/yatori-dev/yatori-go-core/internal/driver/driverutil"
)

func init() {
	core.Register(core.MyPlatform, New)
}

type client struct {
	driverutil.Base
	loggedIn bool

	courses map[string]core.Course
	nodes   map[string]core.Node
}

// New 只做参数校验和对象构造，不要发网络请求。
func New(cfg core.Config) (core.Client, error) {
	if cfg.Account.Username == "" && cfg.Account.Cookie == "" {
		return nil, core.Invalid(core.MyPlatform, "new", "username or cookie is required")
	}
	return &client{
		Base:    driverutil.NewBase(cfg),
		courses: map[string]core.Course{},
		nodes:   map[string]core.Node{},
	}, nil
}

func (c *client) Platform() core.Platform { return core.MyPlatform }

func (c *client) Capabilities() core.Capability {
	return core.CapLogin | core.CapCourses | core.CapTree | core.CapStudy
}

func (c *client) Login(ctx context.Context) error {
	unlock := c.Lock()
	defer unlock()

	// TODO: 调用平台登录接口
	c.loggedIn = true
	return nil
}

func (c *client) LoginWithCookie(ctx context.Context, cookie string) error {
	return core.Unsupported(core.MyPlatform, "login_with_cookie")
}

func (c *client) Session() core.Session {
	return core.Session{
		Platform: core.MyPlatform,
		Account:  c.Account().Username,
	}
}

func (c *client) Courses(ctx context.Context) ([]core.Course, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "courses")
	}

	// TODO: 调用平台课程列表接口
	courses := []core.Course{
		{ID: "demo-course", Name: "示例课程", Progress: 0},
	}
	for _, course := range courses {
		c.courses[course.ID] = course
	}
	return courses, nil
}

func (c *client) Tree(ctx context.Context, course core.Course) ([]core.Node, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "tree")
	}

	// TODO: 调用平台章节/任务点接口
	nodes := []core.Node{
		{
			ID:       "demo-video",
			CourseID: course.ID,
			Name:     "示例视频",
			Kind:     core.NodeVideo,
		},
	}
	for _, node := range nodes {
		c.nodes[node.ID] = node
	}
	return nodes, nil
}

func (c *client) Study(ctx context.Context, req core.StudyRequest) (*core.StudyResult, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "study")
	}

	// TODO: 调用平台学习接口
	return &core.StudyResult{
		CourseID:  req.Course.ID,
		NodeID:    req.Node.ID,
		Kind:      req.Node.Kind,
		Submitted: true,
		Progress:  100,
		Completed: true,
	}, nil
}

func (c *client) Works(ctx context.Context, course core.Course) ([]core.Work, error) {
	return nil, core.Unsupported(core.MyPlatform, "works")
}

func (c *client) DoWork(ctx context.Context, req core.WorkRequest) (*core.AnswerResult, error) {
	return nil, core.Unsupported(core.MyPlatform, "work")
}

func (c *client) Exams(ctx context.Context, course core.Course) ([]core.Exam, error) {
	return nil, core.Unsupported(core.MyPlatform, "exams")
}

func (c *client) DoExam(ctx context.Context, req core.ExamRequest) (*core.AnswerResult, error) {
	return nil, core.Unsupported(core.MyPlatform, "exam")
}

func (c *client) SignIn(ctx context.Context, req core.SignInRequest) (*core.SignInResult, error) {
	return nil, core.Unsupported(core.MyPlatform, "sign_in")
}

func (c *client) Call(ctx context.Context, action core.Action, params map[string]any) (any, error) {
	return core.Call(ctx, c, action, params)
}

func (c *client) Close() error { return nil }

var _ core.Client = (*client)(nil)
```

::: tip 这个骨架的作用
它已经可以注册、创建、调用 `Courses/Tree/Study`，只是返回假数据。先让它编译通过，再逐段替换成真实接口，排查问题会容易很多。
:::

---

## 5. 注册到 driver.go

修改 `internal/driver/driver.go`，加一行空导入：

```go
import (
	// ...
	_ "github.com/yatori-dev/yatori-go-core/internal/driver/myplatform"
)
```

没有这一步，`yatori.New(yatori.Config{Platform: yatori.MyPlatform})` 会返回：

```text
yatori: MYPLATFORM: new: no adapter registered for platform
```

---

## 6. 实现 New

### 6.1 职责

`New` 只做：

- 参数校验；
- 构造平台 cache；
- 配置代理；
- 初始化内存缓存。

**不要在 `New` 里登录、拉课程、下载资源、初始化 OCR。**

### 6.2 标准写法

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

### 6.3 参数校验规则

| 平台要求 | 校验 |
|---|---|
| 账号密码 | `Username` / `Password` 非空 |
| Cookie 登录 | `Cookie` 非空 |
| 需要学校站点 | `URL` 非空 |
| 需要学校名称 | `School` 非空 |
| 扫码登录 | 允许空账号 |

不要把“平台特有字段”加到 `core.Account` 上。优先用 `Account.Extra`：

```go
school := cfg.Account.Extra["school"]
```

---

## 7. 实现 Login / LoginWithCookie / Session

### 7.1 Login

```go
func (c *client) Login(ctx context.Context) error {
	unlock := c.Lock()
	defer unlock()

	// 1. 如果配置了 Cookie，优先 Cookie 登录
	if c.Account().Cookie != "" {
		return c.loginWithCookieLocked(c.Account().Cookie)
	}

	// 2. 需要 OCR 的平台在这里初始化
	driverutil.EnsureOCR()

	// 3. 调用旧业务动作
	if err := agg.MyPlatformLoginAction(c.cache); err != nil {
		return core.Wrap(core.MyPlatform, "login", err)
	}

	c.loggedIn = true
	return nil
}
```

规则：

- 必须加锁；
- 不要在 `New` 里初始化 OCR；
- 旧动作返回的错误要 `core.Wrap`；
- 登录成功后设置 `loggedIn = true`。

### 7.2 LoginWithCookie

```go
func (c *client) LoginWithCookie(ctx context.Context, cookie string) error {
	unlock := c.Lock()
	defer unlock()
	return c.loginWithCookieLocked(cookie)
}

func (c *client) loginWithCookieLocked(cookie string) error {
	c.cache.Password = cookie
	if err := agg.MyPlatformCookieLoginAction(c.cache); err != nil {
		return core.Wrap(core.MyPlatform, "login_with_cookie", err)
	}
	c.loggedIn = true
	return nil
}
```

如果平台不支持 Cookie 登录：

```go
func (c *client) LoginWithCookie(ctx context.Context, cookie string) error {
	return core.Unsupported(core.MyPlatform, "login_with_cookie")
}
```

并且 **不要** 设置 `CapCookieLogin`。

### 7.3 Session

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

原则：

- 能拿到 Cookie 就填 `Cookie`；
- 能拿到 Token 就填 `Token`；
- 其他会话字段放 `Extra`；
- 不要返回平台原始结构体。

---

## 8. 实现 Courses

```go
func (c *client) Courses(ctx context.Context) ([]core.Course, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "courses")
	}

	list, err := agg.MyPlatformPullCourseAction(c.cache)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "courses", err)
	}

	out := make([]core.Course, 0, len(list))
	for _, item := range list {
		course := core.Course{
			ID:       item.CourseID,
			Name:     item.CourseName,
			Teacher:  item.Teacher,
			Cover:    item.Cover,
			Progress: item.Progress,
			Status:   mapStatus(item.Status),
			Extra: map[string]string{
				"courseId":     item.CourseID,
				"classId":      item.ClassID,
				"semesterId":   item.SemesterID,
				"courseInfoId": item.CourseInfoID,
			},
			Raw: item,
		}
		c.courses[course.ID] = course
		out = append(out, course)
	}
	return out, nil
}
```

要点：

- `Course.ID` 必须稳定且唯一；
- `Extra` 必须包含 `Tree` 需要的所有平台 ID；
- `Raw` 保存平台原始对象；
- 把课程存进 `c.courses`，方便 `Tree` 只用 ID 时回查。

---

## 9. 实现 Tree

```go
func (c *client) Tree(ctx context.Context, course core.Course) ([]core.Node, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "tree")
	}

	raw, err := c.resolveCourse(course)
	if err != nil {
		return nil, err
	}

	list, err := agg.MyPlatformPullNodeAction(c.cache, raw)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "tree", err)
	}

	out := make([]core.Node, 0, len(list))
	for _, item := range list {
		node := core.Node{
			ID:        item.NodeID,
			CourseID:  course.ID,
			ParentID:  item.ParentID,
			Name:      item.Name,
			Kind:      mapNodeKind(item.Type),
			Duration:  driverutil.Seconds(item.Duration),
			Progress:  item.Progress,
			Completed: item.Completed,
			Extra: map[string]string{
				"nodeId":      item.NodeID,
				"courseId":    item.CourseID,
				"knowledgeId": item.KnowledgeID,
				"cardIndex":   fmt.Sprint(item.CardIndex),
			},
			Raw: item,
		}
		c.nodes[node.ID] = node
		out = append(out, node)
	}
	return out, nil
}
```

要点：

- 有层级就建 `Children`；
- 没有层级就返回扁平列表；
- `Node.ID` 必须唯一；
- `Kind` 尽量准确，识别不了用 `NodeUnknown`；
- `Duration` 用 `time.Duration`，注意平台单位是秒还是毫秒；
- `Progress` 统一 0–100。

### 9.1 resolveCourse

```go
func (c *client) resolveCourse(course core.Course) (agg.MyPlatformCourse, error) {
	if stored, ok := c.courses[course.ID]; ok {
		if raw, ok := stored.Raw.(agg.MyPlatformCourse); ok {
			return raw, nil
		}
	}
	if raw, ok := course.Raw.(agg.MyPlatformCourse); ok {
		return raw, nil
	}
	if course.Extra == nil {
		return agg.MyPlatformCourse{}, core.Invalid(core.MyPlatform, "course", "course raw data is missing; call Courses first")
	}
	return agg.MyPlatformCourse{
		CourseID: course.Extra["courseId"],
		ClassID:  course.Extra["classId"],
	}, nil
}
```

优先用 `Raw`，其次用 `Extra` 重建。两者都没有时返回 `ErrInvalidArgument`，不要静默返回空课程。

---

## 10. 实现 Study

`Study` 是适配器里最需要想清楚的方法。先确定你的平台属于哪一种：

### 模式 A：一次提交进度（英华/CQIE/TTCDW 类似）

```go
func (c *client) Study(ctx context.Context, req core.StudyRequest) (*core.StudyResult, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "study")
	}

	raw, ok := req.Node.Raw.(agg.MyPlatformNode)
	if !ok {
		stored, exists := c.nodes[req.Node.ID]
		if !exists {
			return nil, core.Invalid(core.MyPlatform, "study", "node raw data is missing; call Tree first")
		}
		raw = stored.Raw.(agg.MyPlatformNode)
	}

	position := int(req.Position.Seconds())
	if req.Action == core.StudyActionFinish {
		position = raw.Duration
	}

	report, err := agg.MyPlatformSubmitStudyTime(c.cache, raw, position)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "study", err)
	}

	return &core.StudyResult{
		CourseID:  req.Course.ID,
		NodeID:    req.Node.ID,
		Kind:      req.Node.Kind,
		Submitted: true,
		Position:  driverutil.Seconds(position),
		Progress:  calcProgress(position, raw.Duration),
		Completed: position >= raw.Duration,
		Message:   report,
		Raw:       report,
	}, nil
}
```

> 示例里的 `calcProgress` 和 `c.startIDs` 需要你按平台补充：前者把当前位置换算成 0–100，后者是 start/submit 模式的会话缓存。`c.works`、`c.exams` 同理，需要在 `client` 结构体里声明。

### 模式 B：一次调用完成整个节点（职教云/课堂行/WeLearn 类似）

```go
if err := agg.MyPlatformCompleteNode(c.cache, raw); err != nil {
	return nil, core.Wrap(core.MyPlatform, "study", err)
}
return &core.StudyResult{
	CourseID:  req.Course.ID,
	NodeID:    req.Node.ID,
	Kind:      req.Node.Kind,
	Submitted: true,
	Progress:  100,
	Completed: true,
}, nil
```

### 模式 C：先 start 再提交（青书类似）

```go
startID := c.startIDs[raw.ID]
if startID == "" || req.Action == core.StudyActionStart {
	startID, err = agg.MyPlatformStartStudy(c.cache, raw)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "study.start", err)
	}
	c.startIDs[raw.ID] = startID
}

report, err := agg.MyPlatformSubmitStudy(c.cache, startID, req.Action == core.StudyActionFinish)
```

### 10.1 不支持的节点

如果某个节点类型无法统一处理：

```go
return nil, core.Unsupported(core.MyPlatform, "study/live")
```

不要返回空结果假装成功。

---

## 11. 实现 Works / DoWork / Exams / DoExam

### 11.1 平台没有作业/考试

```go
func (c *client) Works(ctx context.Context, course core.Course) ([]core.Work, error) {
	return nil, core.Unsupported(core.MyPlatform, "works")
}
```

并且不要在 `Capabilities()` 里设置 `CapWorks`。

### 11.2 平台有作业列表

```go
func (c *client) Works(ctx context.Context, course core.Course) ([]core.Work, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "works")
	}

	raw, err := c.resolveCourse(course)
	if err != nil {
		return nil, err
	}
	list, err := agg.MyPlatformPullWorkList(c.cache, raw)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "works", err)
	}

	out := make([]core.Work, 0, len(list))
	for i := range list {
		item := &list[i]
		c.works[item.ID] = item
		out = append(out, core.Work{
			ID:            item.ID,
			CourseID:      course.ID,
			Name:          item.Title,
			Status:        item.Status,
			QuestionCount: item.QuestionCount,
			Extra: map[string]string{
				"workId":   item.ID,
				"courseId": item.CourseID,
			},
			Raw: item,
		})
	}
	return out, nil
}
```

### 11.3 DoWork

```go
func (c *client) DoWork(ctx context.Context, req core.WorkRequest) (*core.AnswerResult, error) {
	unlock := c.Lock()
	defer unlock()
	if !c.loggedIn {
		return nil, core.NotLoggedIn(core.MyPlatform, "work")
	}

	work, ok := req.Work.Raw.(*agg.MyPlatformWork)
	if !ok || work == nil {
		work = c.works[req.Work.ID]
	}
	if work == nil {
		return nil, core.Invalid(core.MyPlatform, "work", "work raw data is missing; call Works first")
	}

	report, err := agg.MyPlatformDoWork(c.cache, *work, req.Source, req.Submit)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "work", err)
	}

	return &core.AnswerResult{
		TaskID:    req.Work.ID,
		Title:     work.Title,
		Submitted: req.Submit,
		Message:   report,
		Raw:       report,
	}, nil
}
```

### 11.4 考试

和作业类似，只是接口换成 `Exams` / `DoExam`。注意：

- `Submit` 表示是否交卷；
- 有些平台要求最后一题才交卷，适配器内部处理；
- 不支持提交时，`DoExam` 返回 `ErrUnsupported`。

---

## 12. 实现 SignIn

```go
func (c *client) SignIn(ctx context.Context, req core.SignInRequest) (*core.SignInResult, error) {
	unlock := c.Lock()
	defer unlock()

	report, err := agg.MyPlatformSignIn(c.cache, req.Location, req.Extra)
	if err != nil {
		return nil, core.Wrap(core.MyPlatform, "sign_in", err)
	}
	return &core.SignInResult{
		Success: true,
		Message: report,
		Raw:     report,
	}, nil
}
```

平台不支持时：

```go
return nil, core.Unsupported(core.MyPlatform, "sign_in")
```

---

## 13. Call 和 Close

```go
func (c *client) Call(ctx context.Context, action core.Action, params map[string]any) (any, error) {
	return core.Call(ctx, c, action, params)
}

func (c *client) Close() error {
	return nil
}
```

`Call` 不需要你重新实现分发逻辑，`core.Call` 会自动调用你已经实现的方法。

---

## 14. 注册和 smoke test

### 14.1 注册

```go
func init() {
	core.Register(core.MyPlatform, New)
}
```

### 14.2 根包测试

在 `yatori_test.go` 的 `TestNewAllPlatformsSmoke` 里增加：

```go
{Platform: yatori.MyPlatform, Account: yatori.Account{Username: "u", Password: "p"}},
```

确保 `yatori.New` 能构造成功。

### 14.3 接口断言

在 adapter 文件末尾加：

```go
var _ core.Client = (*client)(nil)
```

编译期检查是否漏实现方法。

---

## 15. 测试

至少写三类测试：

### 15.1 纯映射测试

把映射逻辑抽成纯函数：

```go
func mapNode(raw agg.MyPlatformNode) core.Node {
	return core.Node{
		ID:       raw.ID,
		Name:     raw.Name,
		Kind:     mapNodeKind(raw.Type),
		Progress: raw.Progress,
		Extra: map[string]string{
			"nodeId": raw.ID,
		},
		Raw: raw,
	}
}
```

测试：

```go
func TestMapNode(t *testing.T) {
	raw := agg.MyPlatformNode{ID: "n1", Name: "视频", Type: "video", Progress: 50}
	node := mapNode(raw)
	if node.ID != "n1" || node.Kind != core.NodeVideo || node.Progress != 50 {
		t.Fatalf("unexpected node: %+v", node)
	}
}
```

### 15.2 构造函数测试

```go
func TestNewRequiresAccount(t *testing.T) {
	if _, err := New(core.Config{Platform: core.MyPlatform}); err == nil {
		t.Fatal("expected error")
	}
}
```

### 15.3 编译测试

```bash
go test -run '^$' ./...
```

它会编译所有包和测试，但不会跑真实账号测试。

详见 [测试与验收](/yatori-go-core/dev/testing)。

---

## 16. 更新文档

新增平台必须更新：

| 文件 | 更新内容 |
|---|---|
| `README.md` | 平台能力表 |
| `yatori-docs/yatori-go-core/docs.md` | 支持平台表 |
| `yatori-docs/yatori-go-core/v2/platforms.md` | 账号参数、能力、注意事项 |
| `yatori-docs/yatori-go-core/v2/capabilities.md` | 能力矩阵 |
| `yatori-docs/yatori-go-core/v2/getting-started.md` | 如果有新的必填字段 |
| `yatori-docs/yatori-go-core/dev/new-platform.md` | 如果你的平台成为参考实现，补链接 |

文档要写清楚：

- 平台需要哪些账号字段；
- 是否支持 Cookie/Token；
- 哪些能力已实现；
- 哪些能力是部分实现；
- 已知限制。

---

## 17. 提交前检查

```bash
gofmt -w core types.go internal/driver/myplatform internal/driver/driver.go
go build ./...
go vet ./...
go test . ./core
go test -run '^$' ./...
```

如果平台有纯映射测试：

```bash
go test ./internal/driver/myplatform
```

有并发逻辑时：

```bash
go test -race ./core ./internal/driver/myplatform
```

---

## 18. 外部驱动/插件说明

当前 V2 的适配器放在 `internal/driver`，外部模块**不能导入**。这意味着：

- 给官方 core 新增平台：请向本仓库提交 PR；
- 维护自己的 fork：可以按本文步骤修改 fork；
- 想做成独立 Go 模块/插件：当前 V2 没有公开的 driver 注册 API，需要先向维护者提案，增加公开的 driver/注册机制。

不要尝试从外部模块导入 `internal/driver`，Go 会直接拒绝。

---

## 19. 最小可用版本建议

第一次提交不必把所有能力都做完。推荐顺序：

1. `New` + `Login` + `Session`；
2. `Courses`；
3. `Tree`；
4. `Study`（先支持视频）；
5. `Works` / `Exams`；
6. `SignIn`；
7. 补测试和文档。

每完成一步，只设置对应能力位。例如只完成登录时：

```go
func (c *client) Capabilities() core.Capability {
	return core.CapLogin
}
```

不要一次性声明所有能力，然后再返回 `ErrUnsupported`。

---

## 20. 参考实现

建议按复杂度阅读：

| 适配器 | 适合学习 |
|---|---|
| `internal/driver/yinghua/adapter.go` | 单层课程 + 视频 + 作业/考试 |
| `internal/driver/ketangx/adapter.go` | 极简课程/节点/完成 |
| `internal/driver/qsxt/adapter.go` | 章节分组 + start/submit 会话 |
| `internal/driver/ttcdw/adapter.go` | 多级项目/课堂/课程扁平化 |
| `internal/driver/xuexitong/adapter.go` | 复杂章节/卡片/多任务点类型 |

先读简单适配器，再读学习通。
