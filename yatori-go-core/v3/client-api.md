# Client API

`yatori.Client` 是 V3 唯一的平台操作入口。所有平台适配器都实现同一个接口，所以业务代码不需要为每个平台写一套类型和分支。

```go
type Client interface {
	Platform() Platform
	Capabilities() Capability

	Login(ctx context.Context) error
	LoginWithCookie(ctx context.Context, cookie string) error
	Session() Session

	Courses(ctx context.Context) ([]Course, error)
	Tree(ctx context.Context, course Course) ([]Node, error)

	Study(ctx context.Context, req StudyRequest) (*StudyResult, error)

	Works(ctx context.Context, course Course) ([]Work, error)
	DoWork(ctx context.Context, req WorkRequest) (*AnswerResult, error)

	Exams(ctx context.Context, course Course) ([]Exam, error)
	DoExam(ctx context.Context, req ExamRequest) (*AnswerResult, error)

	SignIn(ctx context.Context, req SignInRequest) (*SignInResult, error)

	Call(ctx context.Context, action Action, params map[string]any) (any, error)
	Close() error
}
```

## 创建客户端

```go
func New(cfg Config) (Client, error)
```

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.XueXiTong,
	Account: yatori.Account{
		Username: "ACCOUNT",
		Password: "PASSWORD",
	},
})
if err != nil {
	return err
}
defer client.Close()
```

`New` 只做参数校验和适配器构造，不会发起网络请求。真正登录发生在 `Login`。

## 基础信息

### `Platform() Platform`

返回当前客户端对应的平台，例如 `yatori.XueXiTong`。

```go
if client.Platform() == yatori.XueXiTong {
	// 学习通专属逻辑
}
```

### `Capabilities() Capability`

返回平台能力位图。详见 [能力与错误](/yatori-go-core/v3/capabilities)。

```go
caps := client.Capabilities()
fmt.Println(caps.String())
// 例如：login,cookie-login,courses,tree,study,works,exams
```

## 登录

### `Login(ctx) error`

使用 `Config.Account` 中的账号信息登录。

```go
if err := client.Login(ctx); err != nil {
	return err
}
```

不同平台的行为：

- 账号密码平台：执行账号密码登录，必要时自动处理验证码。
- 支持 Cookie 的平台：如果 `Account.Cookie` 非空，会优先走 Cookie/Token 登录。
- 智慧树：`Login` 不可用，必须使用 `QRCodeLogin` 接口。

### `LoginWithCookie(ctx, cookie) error`

导入已有会话。不是所有平台都支持；不支持时返回 `ErrUnsupported`。

```go
if err := client.LoginWithCookie(ctx, "cookie_string"); err != nil {
	if errors.Is(err, yatori.ErrUnsupported) {
		// 这个平台不支持 Cookie 登录
	}
	return err
}
```

支持情况：

| 平台 | Cookie/Token 登录 | 说明 |
|---|---|---|
| XUEXITONG | ✅ | 浏览器 Cookie |
| ICVE | ✅ | 浏览器 Cookie |
| CQIE | ✅ | 传 access_token |
| ENAAE | ✅ | 浏览器 Cookie |
| WELEARN | ✅ | 浏览器 Cookie |
| QSXT | ✅ | 传 token |
| TTCDW | ✅ | 浏览器 Cookie |
| 其他 | ❌ | 返回 `ErrUnsupported` |

### `Session() Session`

返回当前会话快照：

```go
s := client.Session()
fmt.Println(s.Platform, s.Account, s.UserID)
fmt.Println(s.Cookie)
```

字段说明：

| 字段 | 说明 |
|---|---|
| `Platform` | 平台 |
| `Account` | 账号 |
| `UserID` | 平台用户 ID，可能为空 |
| `Cookie` | Cookie 字符串，可能为空 |
| `Token` | Token，可能为空 |
| `Extra` | 平台额外信息，例如 token、schoolId、sign 等 |

## 课程

### `Courses(ctx) ([]Course, error)`

拉取当前账号可见的课程列表。

```go
courses, err := client.Courses(ctx)
if err != nil {
	return err
}
for _, course := range courses {
	fmt.Println(course.ID, course.Name, course.Progress, course.Status)
}
```

`Course` 的 `Raw` 字段保存平台原始对象，`Extra` 保存可序列化的平台 ID。**把 `Course` 原样传给 `Tree`、`Study` 最稳妥**，不要自己只拼一个 ID。

### `Tree(ctx, course) ([]Node, error)`

拉取一门课程的章节/节点树。

```go
nodes, err := client.Tree(ctx, course)
if err != nil {
	return err
}
```

返回的 `Node` 可能是树形结构：

- `Children` 非空：章节/模块节点；
- `Children` 为空：真正可学习的叶子节点。

遍历所有叶子节点：

```go
for _, node := range yatori.Flatten(nodes) {
	fmt.Println(node.ID, node.Name, node.Kind, node.Progress)
}
```

平台差异：

- 学习通：`Course → Chapter → Point`，Point 可能是视频、音频、文档、外链、作业、考试、直播、讨论。
- 英华：课程下直接是节点，节点带 `TabVideo/TabFile/TabWork/TabExam` 标记。
- 职教云/课堂行/WeLearn：章节 → 任务点。
- TTCDW：项目 → 课堂 → 课程 → 视频，适配器会把课程扁平化后返回。
- 青书：章节 → 节点（视频/文档等）。

## 学习

### `Study(ctx, req) (*StudyResult, error)`

`Study` 是**学习进度原语**，不是“自动刷完一整门课”的编排器。不同平台粒度不同：

| 平台 | `Study` 的行为 |
|---|---|
| XUEXITONG | 提交一次视频/音频进度；文档/外链直接完成 |
| YINGHUA | 提交一次观看时长 |
| CQIE | 提交一次视频进度 |
| TTCDW | 提交一次视频进度 |
| ICVE | 直接完成当前任务点 |
| KETANGX | 直接完成当前视频 |
| WELEARN | 直接完成当前任务点 |
| QSXT | 开始/提交一次学习会话 |
| HAIQIKEJI | 提交一次百分比进度；Fast 模式直接完成 |

请求：

```go
type StudyRequest struct {
	Course   Course
	Node     Node
	Action   StudyAction
	Mode     StudyMode
	Position time.Duration
	Duration time.Duration
	IsDrag   bool
	Extra    map[string]any
}
```

字段：

| 字段 | 说明 |
|---|---|
| `Course` / `Node` | 从 `Courses` / `Tree` 拿到的对象，原样传回 |
| `Action` | `start` / `progress` / `pause` / `finish` |
| `Mode` | `normal` / `fast` / `web` |
| `Position` | 当前学习位置，例如 `60 * time.Second` |
| `Duration` | 节点总时长，部分平台可省略 |
| `IsDrag` | 是否模拟拖拽进度 |
| `Extra` | 平台额外参数 |

示例：

```go
result, err := client.Study(ctx, yatori.StudyRequest{
	Course:   course,
	Node:     node,
	Action:   yatori.StudyActionProgress,
	Mode:     yatori.StudyModeNormal,
	Position: 60 * time.Second,
})
if err != nil {
	return err
}
fmt.Println(result.Submitted, result.Progress, result.Completed)
```

返回：

```go
type StudyResult struct {
	CourseID  string
	NodeID    string
	Kind      NodeKind
	Submitted bool
	Position  time.Duration
	Progress  float64
	Completed bool
	Message   string
	Raw       any
}
```

循环学习由调用方控制：

```go
position := time.Duration(0)
for {
	result, err := client.Study(ctx, yatori.StudyRequest{
		Course:   course,
		Node:     node,
		Action:   yatori.StudyActionProgress,
		Position: position,
	})
	if err != nil {
		return err
	}
	position = result.Position
	if result.Completed || (node.Duration > 0 && position >= node.Duration) {
		break
	}
	time.Sleep(5 * time.Second)
}
```

::: tip 为什么不做成自动完成
不同平台的节奏、风控、验证码、人脸策略不同。V3 把节奏交给调用方，避免一个通用循环把所有平台都按同一种频率请求。
:::

## 作业

### `Works(ctx, course) ([]Work, error)`

拉取课程作业列表。平台不支持时返回 `ErrUnsupported`。

```go
if yatori.Supports(client, yatori.CapWorks) {
	works, err := client.Works(ctx, course)
	if err != nil {
		return err
	}
	for _, work := range works {
		fmt.Println(work.ID, work.Name, work.Status)
	}
}
```

### `DoWork(ctx, req) (*AnswerResult, error)`

完成一份作业。

```go
result, err := client.DoWork(ctx, yatori.WorkRequest{
	Course: course,
	Work:   work,
	Source: yatori.AnswerSourceAI, // ai / bank / builtin / manual
	Submit: true,
})
```

`AnswerSource`：

| 值 | 说明 |
|---|---|
| `AnswerSourceAI` | 使用 `Options.AI` |
| `AnswerSourceBank` | 使用 `Options.QuestionBank` |
| `AnswerSourceBuiltin` | 使用平台随题返回的答案；没有时使用默认答案 |
| `AnswerSourceManual` | 不自动作答，调用方自行填充 |

平台差异：

- 学习通：`EnterWorkAction + 逐题拉取 + AI/题库/内置 + 逐题提交`。
- 英华：使用平台提供的 AI/题库动作。
- 青书：使用平台随题返回的参考答案。
- 海旗：`DoWork` 会处理该课程下所有作业节点，而不是只处理传入的这一份。

## 考试

### `Exams(ctx, course) ([]Exam, error)`

拉取考试列表。

```go
exams, err := client.Exams(ctx, course)
```

### `DoExam(ctx, req) (*AnswerResult, error)`

完成一场考试。

```go
result, err := client.DoExam(ctx, yatori.ExamRequest{
	Course: course,
	Exam:   exam,
	Source: yatori.AnswerSourceAI,
	Submit: true,
})
```

平台差异：

- 学习通：进入考试 → 逐题拉取 → 作答 → 最后一题交卷。
- 英华：支持 AI/题库作答。
- 海旗：支持 AI/内置标答，考试是否交卷由 `Submit` 控制。
- ENAAE：只提供考试列表，`DoExam` 返回 `ErrUnsupported`。

## 签到

### `SignIn(ctx, req) (*SignInResult, error)`

只有少数平台实现，例如工学云。

```go
result, err := client.SignIn(ctx, yatori.SignInRequest{
	Location: "公司地址",
	Extra: map[string]any{
		"country":   "中国",
		"province":  "广东省",
		"city":      "深圳市",
		"area":      "南山区",
		"longitude": "113.93",
		"latitude":  "22.53",
		"address":   "科技园",
		"playType":  "START",
	},
})
```

## 动态调用

### `Call(ctx, action, params) (any, error)`

弱类型分发，适合配置驱动/JSON 场景。详见 [动态调用](/yatori-go-core/v3/dynamic-call)。

```go
result, err := client.Call(ctx, yatori.ActionCourses, nil)
```

## 关闭

### `Close() error`

释放客户端持有的资源。建议 `defer client.Close()`。

## 辅助函数

### `yatori.Supports(client, capability) bool`

```go
if yatori.Supports(client, yatori.CapWorks) {
	// ...
}
```

### `yatori.Flatten(nodes) []Node`

把树形节点拍平成叶子节点列表。

### `yatori.ParsePlatform(raw) (Platform, error)`

把 `"xuexitong"`、`"XXT"`、`"chaoxing"` 等别名转成平台常量。

### `yatori.ParseAction(raw) (Action, error)`

把 `"courses"`、`"study"` 等字符串转成 `Action`。
