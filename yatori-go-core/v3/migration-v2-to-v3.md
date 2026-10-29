# V2 迁移 V3

V3 是一次结构性重构，不是简单加几个函数。最重要的变化是：

- 旧的 `api/*`、`aggregation/*` 已移动到 `internal/`，**外部项目不能再直接导入**；
- 根包变成 `package yatori`，统一入口是 `yatori.New(...)`；
- 不再需要 `global.Config`、`common.InitConfig`、`utils.YatoriCoreInit`；
- 平台差异通过 `Client` + `Capabilities()` + `ErrUnsupported` 表达。

## 1. 迁移前后对照

### 登录

V1：

```go
import (
	xuexitongApi "github.com/yatori-dev/yatori-go-core/api/xuexitong"
	"github.com/yatori-dev/yatori-go-core/aggregation/xuexitong"
)

cache := &xuexitongApi.XueXiTUserCache{
	Name:     "ACCOUNT",
	Password: "PASSWORD",
}
if err := xuexitong.XueXiTLoginAction(cache); err != nil {
	return err
}
```

V3：

```go
import "github.com/yatori-dev/yatori-go-core"

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

if err := client.Login(ctx); err != nil {
	return err
}
```

### 拉课程

V1：

```go
courses, err := xuexitong.XueXiTPullCourseAction(cache)
```

V3：

```go
courses, err := client.Courses(ctx)
```

### 拉章节

V1：

```go
key, _ := strconv.Atoi(course.Key)
chapters, _, err := xuexitong.PullCourseChapterAction(cache, course.Cpi, key)
```

V3：

```go
nodes, err := client.Tree(ctx, course)
```

### 学视频

V1：

```go
xuexitong.VideoSubmitStudyTimeAction(cache, &videoDTO, playingTime, mode, isdrag)
```

V3：

```go
client.Study(ctx, yatori.StudyRequest{
	Course:   course,
	Node:     node,
	Action:   yatori.StudyActionProgress,
	Position: 60 * time.Second,
})
```

### 写作业

V1：

```go
works, _ := xuexitong.PullWorkListAction(cache, course)
xuexitong.EnterWorkAction(cache, &work)
question, _ := work.PullWorkQuestionAction(cache, i)
question.WriteQuestionForAIAction(cache, aiUrl, model, aiType, apiKey)
question.SubmitWorkAnswerAction(cache, true)
```

V3：

```go
works, _ := client.Works(ctx, course)
client.DoWork(ctx, yatori.WorkRequest{
	Course: course,
	Work:   work,
	Source: yatori.AnswerSourceAI,
	Submit: true,
})
```

### 写考试

V1：

```go
exams, _ := xuexitong.PullExamListAction(cache, course)
xuexitong.EnterExamAction(cache, &exam)
question, _ := exam.PullExamQuestionAction(cache, i)
question.WriteQuestionForAIAction(cache, aiUrl, model, aiType, apiKey)
question.SubmitExamAnswerAction(cache, true)
```

V3：

```go
exams, _ := client.Exams(ctx, course)
client.DoExam(ctx, yatori.ExamRequest{
	Course: course,
	Exam:   exam,
	Source: yatori.AnswerSourceAI,
	Submit: true,
})
```

## 2. 类型映射

| V2 类型 | V3 类型 |
|---|---|
| `xuexitong.XueXiTCourse` | `yatori.Course` |
| `yinghua.YingHuaCourse` | `yatori.Course` |
| `icve.IcveCourse` | `yatori.Course` |
| `qsxt.QsxtCourse` | `yatori.Course` |
| `ttcdw.TtcdwProject/ClassRoom/Course` | `yatori.Course`（已扁平化） |
| `XueXiTUserCache` 等平台 Cache | `yatori.Client` |
| 平台章节/视频/任务点 | `yatori.Node` |
| 平台作业 | `yatori.Work` |
| 平台考试 | `yatori.Exam` |
| 平台登录返回的 cookie/token | `yatori.Session` |

## 3. 配置迁移

V1 通常依赖 YAML：

```yaml
users:
  - accountType: XUEXITONG
    account: "ACCOUNT"
    password: "PASSWORD"
```

V3 不再强制读取 YAML。你可以从任意来源构造：

```go
cfg := yatori.Config{
	Platform: yatori.XueXiTong,
	Account: yatori.Account{
		Username: user.Account,
		Password: user.Password,
	},
	Options: yatori.Options{
		ProxyURL: user.Proxy,
		AI: &yatori.AIConfig{
			Type:   yatori.AIDeepSeek,
			Model:  setting.Model,
			APIKey: setting.APIKey,
		},
	},
}
```

旧 `config`、`global`、`common` 仍然保留，但已标记为 `Deprecated`。新代码不要再用它们。

## 4. 控制台（yatori-go-console）迁移

`yatori-go-console` 是独立模块，**不能导入本模块的 `internal/`**。V3 之后它必须改用根包 `yatori`：

```go
// 旧代码
import (
	"github.com/yatori-dev/yatori-go-core/api/xuexitong"
	"github.com/yatori-dev/yatori-go-core/aggregation/xuexitong"
)

// 新代码
import "github.com/yatori-dev/yatori-go-core"
```

迁移步骤：

1. 删除所有 `api/*`、`aggregation/*` 导入；
2. 把每个平台的 `UserCache` 替换为 `yatori.Client`；
3. 把 `FilterAccount + UserLoginOperation` 替换为 `yatori.New + client.Login`；
4. 把各平台 `logic/<platform>` 里的刷课循环替换为 `Courses → Tree → Study`；
5. 把作业/考试逻辑替换为 `Works → DoWork`、`Exams → DoExam`；
6. 把 `AutoExam`、`ApiQueSetting` 映射到 `Options.AI`、`Options.QuestionBank`；
7. 删除对 `global.Config` 的依赖，改为显式传 `yatori.Config`。

## 5. 行为差异

| 项目 | V2 | V3 |
|---|---|---|
| `Study` | 各平台函数签名不同 | 统一 `StudyRequest`，粒度由平台决定 |
| 错误 | 大量返回裸 JSON 字符串 | 哨兵错误 + `*yatori.Error` |
| 平台差异 | 调用方自己判断 | `Capabilities()` + `ErrUnsupported` |
| 会话 | 各平台 Cache 私有字段 | `Session()` 快照 |
| 验证码 | 调用方自己初始化资源 | 适配器在登录时按需初始化 |
| 资源目录 | `utils.YatoriCoreInit()` 整体释放 | 按需释放 OCR/辅助资源 |

## 6. 迁移检查清单

- [ ] 不再导入 `github.com/yatori-dev/yatori-go-core/api/...`
- [ ] 不再导入 `github.com/yatori-dev/yatori-go-core/aggregation/...`
- [ ] 不再调用 `utils.YatoriCoreInit()`（除非你仍在使用旧代码）
- [ ] 不再依赖 `global.Config`
- [ ] 每个账号创建一个 `yatori.Client`
- [ ] 所有网络调用都传入 `context.Context`
- [ ] 使用 `errors.Is(err, yatori.ErrUnsupported)` 处理平台差异
- [ ] 使用 `yatori.Supports(client, capability)` 做能力预判
- [ ] 保存 `Extra` 而不是序列化 `Raw`
- [ ] 多账号并发时不要共享同一个 `Client`

## 7. 常见迁移错误

### `use of internal package not allowed`

你还在导入 `internal/api` 或 `internal/aggregation`。外部模块不能导入 `internal/`，请改用根包 `yatori`。

### `undefined: global.Config`

V3 不依赖全局配置。把配置显式传给 `yatori.New`。

### `client.Works` 返回 `ErrUnsupported`

该平台没有作业能力。用 `Capabilities()` 判断，或直接跳过。

### `client.Study` 立即返回 `Completed: true`

这是平台粒度差异，不是 bug。职教云/课堂行/WeLearn 等平台一次调用就会完成整个节点。

### `Course.Raw` 存进数据库后无法使用

`Raw` 是进程内对象，不能序列化。持久化请保存 `Extra`，或者重新调用 `Courses`。
