# 快速开始

这篇文档从零开始，带你完成：

1. 安装依赖；
2. 创建第一个 `yatori.Client`；
3. 登录；
4. 拉取课程；
5. 拉取章节/节点；
6. 提交一次学习进度。

## 1. 环境要求

| 依赖 | 要求 | 说明 |
|---|---|---|
| Go | 1.26+ | 与 `go.mod` 保持一致 |
| CGO | `CGO_ENABLED=1` | 部分平台依赖 SQLite / ONNX Runtime |
| GCC | Windows 推荐 MinGW-w64 | 没有 GCC 时 CGO 编译会失败 |
| 操作系统 | Windows / Linux / macOS | 各平台适配器的主要测试环境是 Windows |

Windows 下如果出现 `gcc: executable file not found`，需要安装 MinGW-w64 并把 `bin` 目录加入 `PATH`。

## 2. 安装

```bash
go get github.com/yatori-dev/yatori-go-core
```

在代码中导入根包：

```go
import "github.com/yatori-dev/yatori-go-core"
```

包名是 `yatori`，所以调用方式是 `yatori.New(...)`、`yatori.Config{...}`。

## 3. 第一个程序

新建一个目录，创建 `main.go`：

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/yatori-dev/yatori-go-core"
)

func main() {
	client, err := yatori.New(yatori.Config{
		Platform: yatori.XueXiTong,
		Account: yatori.Account{
			Username: "ACCOUNT",
			Password: "PASSWORD",
		},
		Options: yatori.Options{
			// 需要代理时填写，例如：
			// ProxyURL: "http://127.0.0.1:7890",

			// 需要 AI 答题时填写：
			// AI: &yatori.AIConfig{
			// 	Type:   yatori.AIDeepSeek,
			// 	Model:  "MODEL",
			// 	APIKey: "KEY",
			// },

			// 需要外部题库时填写：
			// QuestionBank: &yatori.QuestionBankConfig{
			// 	URL: "http://127.0.0.1:8083",
			// },
		},
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	// 1. 登录
	if err := client.Login(ctx); err != nil {
		panic(err)
	}
	fmt.Println("登录成功：", client.Session().Account)

	// 2. 拉取课程
	courses, err := client.Courses(ctx)
	if err != nil {
		panic(err)
	}

	for _, course := range courses {
		fmt.Printf("[%s] %s (%.1f%%)\n", course.ID, course.Name, course.Progress)

		// 3. 拉取课程树
		nodes, err := client.Tree(ctx, course)
		if err != nil {
			fmt.Printf("拉取章节失败：%v\n", err)
			continue
		}

		// 4. 遍历叶子节点，提交一次学习进度
		for _, node := range yatori.Flatten(nodes) {
			if node.Completed || node.Kind == yatori.NodeChapter {
				continue
			}

			result, err := client.Study(ctx, yatori.StudyRequest{
				Course:   course,
				Node:     node,
				Action:   yatori.StudyActionProgress,
				Mode:     yatori.StudyModeNormal,
				Position: 60 * time.Second,
			})
			if err != nil {
				if errors.Is(err, yatori.ErrUnsupported) {
					// 这个平台不支持当前节点类型，跳过
					continue
				}
				fmt.Printf("学习失败 %s：%v\n", node.Name, err)
				continue
			}
			fmt.Printf("学习 %s -> %.1f%%\n", node.Name, result.Progress)
		}
	}
}
```

## 4. 运行

```bash
go run .
```

如果账号、密码正确，你会看到类似输出：

```text
登录成功： 13800000000
[123456] 软件工程 (35.0%)
学习 第一章 绪论 -> 2.1%
学习 第二章 需求分析 -> 1.5%
```

## 5. Config 详解

### 5.1 `yatori.Config`

```go
type Config struct {
	Platform Platform
	Account  Account
	Options  Options
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `Platform` | 是 | 平台常量，如 `yatori.XueXiTong` |
| `Account` | 是 | 账号信息，见下表 |
| `Options` | 否 | 代理、AI、题库、超时、日志等 |

### 5.2 `yatori.Account`

```go
type Account struct {
	Username string
	Password string
	URL      string
	School   string
	Cookie   string
	Extra    map[string]string
}
```

| 字段 | 使用场景 |
|---|---|
| `Username` / `Password` | 账号密码登录 |
| `URL` | 英华、海旗等需要学校站点的平台 |
| `School` | 微伴需要学校名称 |
| `Cookie` | 支持 Cookie/Token 导入的平台 |
| `Extra` | 平台额外参数，例如工学云签到的省市区 |

### 5.3 `yatori.Options`

```go
type Options struct {
	ProxyURL     string
	Timeout      time.Duration
	WorkDir      string
	Logger       Logger
	AI           *AIConfig
	QuestionBank *QuestionBankConfig
}
```

| 字段 | 说明 |
|---|---|
| `ProxyURL` | HTTP 代理，例如 `http://127.0.0.1:7890` |
| `Timeout` | 单次高层操作的超时提示；旧动作仍使用自己的重试/超时 |
| `WorkDir` | 预留的资源/缓存目录；旧动作仍可能写入 `./assets` |
| `Logger` | 实现 `yatori.Logger` 接口即可接入你自己的日志 |
| `AI` | AI 答题配置，作业/考试时使用 |
| `QuestionBank` | 外部题库地址，作业/考试时使用 |

### 5.4 AI 配置

```go
Options: yatori.Options{
	AI: &yatori.AIConfig{
		Type:   yatori.AIDeepSeek,
		URL:    "",              // 留空使用平台默认地址
		Model:  "deepseek-chat", // 按服务商填写
		APIKey: "sk-xxxx",
	},
},
```

支持的 `AIType`：

`AIChatGLM`、`AIXingHuo`、`AITongYi`、`AIDouBao`、`AIOpenAI`、`AIDeepSeek`、`AIMetaAi`、`AISilicon`、`AIOther`。

## 6. 错误处理

SDK 使用哨兵错误，不要靠字符串匹配：

```go
import "errors"

if err := client.Login(ctx); err != nil {
	switch {
	case errors.Is(err, yatori.ErrInvalidArgument):
		// 账号、URL、学校等参数不合法
	case errors.Is(err, yatori.ErrNotLoggedIn):
		// 需要先登录
	case errors.Is(err, yatori.ErrUnsupported):
		// 当前平台不支持这个操作
	default:
		// 网络错误、平台业务错误、验证码错误等
	}
}
```

错误会带上平台和操作信息，例如：

```text
yatori: WEIBAN: works: yatori: operation not supported by platform
```

## 7. 并发与多账号

**一个 `Client` 对应一个账号、一个会话。**

- 同一个 `Client` 的方法会串行访问底层会话，适合单账号顺序执行。
- 多账号并发时，为每个账号创建独立的 `Client`，再在业务层用 goroutine 并发。
- 不要把同一个 `Client` 同时用于大量课程并发，否则可能触发平台的登录/风控限制。

示例：

```go
for _, account := range accounts {
	account := account
	go func() {
		client, err := yatori.New(yatori.Config{
			Platform: yatori.XueXiTong,
			Account:  account,
		})
		if err != nil {
			return
		}
		defer client.Close()
		_ = client.Login(context.Background())
	}()
}
```

## 8. 首次运行注意事项

- 英华、海旗等平台必须填写 `Account.URL`，且要是登录后的站点地址。
- 微伴必须填写 `Account.School`。
- 智慧树使用扫码登录，见 [平台说明](/yatori-go-core/v3/platforms#智慧树-zhihuishu)。
- 部分平台会在当前工作目录写入 `./assets`（验证码图片、辅助 exe、OCR 模型）。请确保运行目录可写，详见 [常见问题](/yatori-go-core/v3/faq#为什么运行目录会出现-assets-目录)。
- 如果使用 Cookie/Token 登录，把值填到 `Account.Cookie`，并先确认该平台支持 Cookie 登录（见 [平台说明](/yatori-go-core/v3/platforms)）。

## 下一步

- [Client API](/yatori-go-core/v3/client-api)：逐个方法说明。
- [能力与错误](/yatori-go-core/v3/capabilities)：平台支持矩阵。
- [完整示例](/yatori-go-core/v3/examples)：作业、考试、多账号。
