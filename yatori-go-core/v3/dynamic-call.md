# 动态调用

`Client.Call` 是弱类型分发入口，适合：

- Web 后端从 JSON 配置读取要执行的动作；
- 任务调度器把动作存进数据库；
- 不想在业务代码里写大量类型分支；
- 需要把平台能力暴露给前端/HTTP API。

## 方法签名

```go
func (c Client) Call(ctx context.Context, action Action, params map[string]any) (any, error)
```

`Action` 是字符串常量：

```go
const (
	ActionLogin           Action = "login"
	ActionLoginWithCookie Action = "login_with_cookie"
	ActionSession         Action = "session"
	ActionCourses         Action = "courses"
	ActionTree            Action = "tree"
	ActionStudy           Action = "study"
	ActionWorks           Action = "works"
	ActionDoWork          Action = "do_work"
	ActionExams           Action = "exams"
	ActionDoExam          Action = "do_exam"
	ActionSignIn          Action = "sign_in"
)
```

## 返回类型

`Call` 返回 `any`，需要类型断言：

| Action | 返回类型 |
|---|---|
| `login` | `nil` |
| `login_with_cookie` | `nil` |
| `session` | `yatori.Session` |
| `courses` | `[]yatori.Course` |
| `tree` | `[]yatori.Node` |
| `study` | `*yatori.StudyResult` |
| `works` | `[]yatori.Work` |
| `do_work` | `*yatori.AnswerResult` |
| `exams` | `[]yatori.Exam` |
| `do_exam` | `*yatori.AnswerResult` |
| `sign_in` | `*yatori.SignInResult` |

示例：

```go
raw, err := client.Call(ctx, yatori.ActionCourses, nil)
if err != nil {
	return err
}
courses, ok := raw.([]yatori.Course)
if !ok {
	return errors.New("unexpected result type")
}
```

## 参数类型规则

`params` 的值可以是 Go 原生类型，也可以是 SDK 结构体：

| 参数类型 | 支持的值 |
|---|---|
| 字符串 | `string`、`fmt.Stringer` |
| 时间 | `time.Duration`、`int`/`int64`/`float64`（秒）、`"60s"` 字符串 |
| 布尔 | `bool`、`"true"`、`1`、`0` |
| 课程 | `yatori.Course`、`*yatori.Course` |
| 节点 | `yatori.Node`、`*yatori.Node` |
| 作业 | `yatori.Work`、`*yatori.Work` |
| 考试 | `yatori.Exam`、`*yatori.Exam` |

如果没有传结构体，只传 ID，适配器会尝试从内部缓存中查找。因此推荐顺序是：

```text
Courses → Tree → Study
Works → DoWork
Exams → DoExam
```

如果跨进程/重启后只有 ID，没有缓存，请把完整的 `Course` / `Node` / `Work` / `Exam` 结构体传进来（至少带上 `Extra`）。

## Action 参数表

### login

```go
_, err := client.Call(ctx, yatori.ActionLogin, nil)
```

使用 `Config.Account` 登录，没有额外参数。

### login_with_cookie

```go
_, err := client.Call(ctx, yatori.ActionLoginWithCookie, map[string]any{
	"cookie": "cookie_or_token",
})
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `cookie` | 是 | Cookie 或平台 Token |

### session

```go
raw, err := client.Call(ctx, yatori.ActionSession, nil)
session := raw.(yatori.Session)
```

### courses

```go
raw, err := client.Call(ctx, yatori.ActionCourses, nil)
```

### tree

```go
raw, err := client.Call(ctx, yatori.ActionTree, map[string]any{
	"courseId": course.ID,
})
```

或者传完整课程：

```go
raw, err := client.Call(ctx, yatori.ActionTree, map[string]any{
	"course": course,
})
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `course` | 二选一 | 完整 `Course` |
| `courseId` | 二选一 | 课程 ID；适配器会从缓存查找 |

### study

```go
raw, err := client.Call(ctx, yatori.ActionStudy, map[string]any{
	"courseId":   course.ID,
	"nodeId":     node.ID,
	"studyAction": "progress",
	"mode":       "normal",
	"position":   "60s",
})
result := raw.(*yatori.StudyResult)
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `course` / `courseId` | 是 | 课程 |
| `node` / `nodeId` | 是 | 节点 |
| `studyAction` | 否 | 默认 `progress`，可选 `start` / `progress` / `pause` / `finish` |
| `mode` | 否 | 默认 `normal`，可选 `fast` / `web` |
| `position` | 否 | 当前进度，支持 `"60s"`、`60`、`time.Duration` |
| `duration` | 否 | 节点总时长 |
| `isDrag` | 否 | 是否模拟拖拽 |
| `extra` | 否 | 平台额外参数 |

### works

```go
raw, err := client.Call(ctx, yatori.ActionWorks, map[string]any{
	"courseId": course.ID,
})
```

### do_work

```go
raw, err := client.Call(ctx, yatori.ActionDoWork, map[string]any{
	"courseId": course.ID,
	"workId":   work.ID,
	"source":   "ai",
	"submit":   true,
})
result := raw.(*yatori.AnswerResult)
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `course` / `courseId` | 是 | 课程 |
| `work` / `workId` | 是 | 作业 |
| `source` | 否 | `ai` / `bank` / `builtin` / `manual` |
| `submit` | 否 | 默认 `true` |
| `extra` | 否 | 平台额外参数 |

### exams

```go
raw, err := client.Call(ctx, yatori.ActionExams, map[string]any{
	"courseId": course.ID,
})
```

### do_exam

```go
raw, err := client.Call(ctx, yatori.ActionDoExam, map[string]any{
	"courseId": course.ID,
	"examId":   exam.ID,
	"source":   "ai",
	"submit":   true,
})
```

### sign_in

```go
raw, err := client.Call(ctx, yatori.ActionSignIn, map[string]any{
	"location": "科技园",
	"extra": map[string]any{
		"country":   "中国",
		"province":  "广东省",
		"city":      "深圳市",
		"area":      "南山区",
		"longitude": "113.93",
		"latitude":  "22.53",
		"playType":  "START",
	},
})
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `userId` | 否 | 平台用户 ID |
| `location` | 否 | 地址 |
| `remark` | 否 | 备注 |
| `extra` | 否 | 平台额外参数 |

## 从 JSON 驱动

```go
type Task struct {
	Action string         `json:"action"`
	Params map[string]any `json:"params"`
}

func runTask(ctx context.Context, client yatori.Client, task Task) (any, error) {
	action, err := yatori.ParseAction(task.Action)
	if err != nil {
		return nil, err
	}
	return client.Call(ctx, action, task.Params)
}
```

配置示例：

```json
{
  "action": "study",
  "params": {
    "courseId": "123456",
    "nodeId": "video:789:0:object-1",
    "studyAction": "progress",
    "mode": "normal",
    "position": "60s"
  }
}
```

## 错误处理

`Call` 的错误与强类型方法完全一致：

```go
_, err := client.Call(ctx, yatori.ActionWorks, map[string]any{
	"courseId": course.ID,
})
switch {
case err == nil:
	// ok
case errors.Is(err, yatori.ErrUnsupported):
	// 平台不支持
case errors.Is(err, yatori.ErrInvalidArgument):
	// 参数缺失或类型不对
case errors.Is(err, yatori.ErrNotLoggedIn):
	// 未登录
default:
	// 网络/业务错误
}
```

## 什么时候不要用 Call

- 业务代码已经知道平台和动作：直接用强类型方法，编译期更安全。
- 需要处理复杂返回结构：强类型方法更清晰。
- 需要平台特有字段：直接用 `Raw`，不要从 `Call` 的 `any` 里猜。

`Call` 是“配置驱动”的补充，不是强类型 API 的替代品。
