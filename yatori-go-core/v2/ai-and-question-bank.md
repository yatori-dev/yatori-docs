# AI 与题库

作业和考试是平台差异最大的部分。V2 把答案来源抽象成 `AnswerSource`，由适配器决定具体怎么调用。

## 1. 三种答案来源

```go
type AnswerSource string

const (
	AnswerSourceAI      AnswerSource = "ai"
	AnswerSourceBank    AnswerSource = "bank"
	AnswerSourceBuiltin AnswerSource = "builtin"
	AnswerSourceManual  AnswerSource = "manual"
)
```

| 来源 | 说明 | 需要配置 |
|---|---|---|
| `ai` | 调用 `Options.AI` 配置的 AI 服务 | `Options.AI` |
| `bank` | 调用 `Options.QuestionBank` 配置的外部题库 | `Options.QuestionBank` |
| `builtin` | 使用平台随题返回的答案；没有时使用默认答案 | 通常不需要 |
| `manual` | 不自动作答，由调用方自行填充 | 不需要 |

## 2. AI 配置

```go
Options: yatori.Options{
	AI: &yatori.AIConfig{
		Type:   yatori.AIDeepSeek,
		URL:    "",              // 留空使用内置默认地址
		Model:  "deepseek-chat", // 按服务商填写
		APIKey: "sk-xxxx",
	},
},
```

字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `Type` | 是 | AI 服务类型 |
| `URL` | 否 | 自定义接口地址；留空使用默认 |
| `Model` | 是 | 模型名称 |
| `APIKey` | 是 | API Key |

支持的 `AIType`：

| 常量 | 值 |
|---|---|
| `yatori.AIChatGLM` | `CHATGLM` |
| `yatori.AIXingHuo` | `XINGHUO` |
| `yatori.AITongYi` | `TONGYI` |
| `yatori.AIDouBao` | `DOUBAO` |
| `yatori.AIOpenAI` | `OPENAI` |
| `yatori.AIDeepSeek` | `DEEPSEEK` |
| `yatori.AIMetaAi` | `METAAI` |
| `yatori.AISilicon` | `SILICON` |
| `yatori.AIOther` | `OTHER` |

### 平台如何使用 AI

| 平台 | AI 行为 |
|---|---|
| XUEXITONG | 逐题调用 AI，解析 JSON 答案数组；失败时回退默认答案 |
| YINGHUA | 逐题调用 AI，并把答案转换成平台选项格式 |
| ZXCPKS | 逐题调用 AI；没有内置标答时使用 |
| QSXT | 不使用 AI，直接使用平台随题返回的参考答案 |
| 其他 | 没有作业/考试能力 |

## 3. 外部题库配置

```go
Options: yatori.Options{
	QuestionBank: &yatori.QuestionBankConfig{
		URL: "http://127.0.0.1:8083",
	},
},
```

字段：

| 字段 | 说明 |
|---|---|
| `URL` | 题库服务地址 |
| `Key` | 预留字段，当前适配器未使用 |
| `Timeout` | 预留字段，当前适配器未使用 |

题库协议见 [题库对接文档](/bank-interface-api/docs)。

### 平台如何使用题库

| 平台 | 题库行为 |
|---|---|
| XUEXITONG | 逐题请求题库；未命中时使用默认答案 |
| YINGHUA | 逐题请求题库，并转换成平台选项格式 |
| ZXCPKS | 不支持 `AnswerSourceBank` |
| QSXT | 不使用题库，直接使用平台答案 |

## 4. 内置答案

`AnswerSourceBuiltin` 的含义因平台而异：

| 平台 | 行为 |
|---|---|
| XUEXITONG | 使用默认答案 `A`；不会调用 AI/题库 |
| YINGHUA | 返回 `ErrUnsupported` |
| QSXT | 使用平台随题返回的参考答案 |
| ZXCPKS | 使用平台随题返回的内置标答 |

::: warning
`builtin` 不是“万能正确答案”。学习通的默认答案只是兜底，不能保证正确率。
:::

## 5. 手动答案

`AnswerSourceManual` 表示“适配器不自动作答”。当前实现不会把 `WorkRequest.Answers` / `ExamRequest.Answers` 逐题写回平台，而是保留平台题目结构，等待后续扩展。

如果你需要完全自定义答题，建议：

1. 用 `Works` / `Exams` 拿到任务；
2. 用平台 `Raw` 字段读取原始题目；
3. 自己实现答题逻辑；
4. 直接调用平台专属接口（需要你自己维护，或等待 V2 后续版本提供 `DoWorkWithAnswers`）。

## 6. 完整示例

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.XueXiTong,
	Account: yatori.Account{
		Username: "ACCOUNT",
		Password: "PASSWORD",
	},
	Options: yatori.Options{
		AI: &yatori.AIConfig{
			Type:   yatori.AIDeepSeek,
			Model:  "deepseek-chat",
			APIKey: "sk-xxxx",
		},
		QuestionBank: &yatori.QuestionBankConfig{
			URL: "http://127.0.0.1:8083",
		},
	},
})
if err != nil {
	return err
}

works, err := client.Works(ctx, course)
if err != nil {
	return err
}
for _, work := range works {
	result, err := client.DoWork(ctx, yatori.WorkRequest{
		Course: course,
		Work:   work,
		Source: yatori.AnswerSourceAI,
		Submit: true,
	})
	if err != nil {
		fmt.Printf("作业 %s 失败：%v\n", work.Name, err)
		continue
	}
	fmt.Printf("作业 %s：提交=%v 分数=%.1f\n", work.Name, result.Submitted, result.Score)
}
```

## 7. 答案结果

```go
type AnswerResult struct {
	TaskID    string
	Title     string
	Submitted bool
	Score     float64
	Answers   []Answer
	Message   string
	Raw       any
}
```

| 字段 | 说明 |
|---|---|
| `Submitted` | 是否已提交 |
| `Score` | 分数；很多平台提交后不会立即返回 |
| `Answers` | 已作答的题目列表，可能为空 |
| `Message` | 平台返回消息 |
| `Raw` | 平台原始响应，调试用 |

## 8. 安全建议

- 不要把 `APIKey`、`QuestionBank.Key` 写进日志；
- 不要把包含答案的 `Raw` 直接返回给前端；
- 题库服务建议只在内网访问；
- 作业/考试提交前先确认平台规则，避免误交卷。

## 9. 调试 AI 是否可用

SDK 根包不直接暴露 AI 健康检查，但可以使用公开的 `que-core/aiq`：

```go
import (
	"github.com/yatori-dev/yatori-go-core/models/ctype"
	"github.com/yatori-dev/yatori-go-core/que-core/aiq"
)

if err := aiq.AICheck(aiURL, model, apiKey, ctype.AiType(aiType)); err != nil {
	fmt.Println("AI 不可用：", err)
}
```

注意：`aiq.AICheck` 的参数类型使用 `models/ctype.AiType`，与 `yatori.AIType` 的字符串值一致，可以直接转换。
