# 完整示例

这篇文档给出可以直接改造使用的完整示例：

1. 单账号：登录 → 课程 → 章节 → 学习 → 作业 → 考试；
2. 课程过滤；
3. 多账号并发；
4. 智慧树扫码登录；
5. 优雅退出与错误处理。

::: warning 运行前
示例中的账号、密码、URL、API Key 都是占位符。请替换成你自己的信息，并遵守目标平台的使用条款。
:::

## 1. 单账号完整任务循环

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yatori-dev/yatori-go-core"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	client, err := yatori.New(yatori.Config{
		Platform: yatori.XueXiTong,
		Account: yatori.Account{
			Username: os.Getenv("YATORI_ACCOUNT"),
			Password: os.Getenv("YATORI_PASSWORD"),
		},
		Options: yatori.Options{
			ProxyURL: os.Getenv("YATORI_PROXY"),
			AI: &yatori.AIConfig{
				Type:   yatori.AIDeepSeek,
				Model:  "deepseek-chat",
				APIKey: os.Getenv("YATORI_AI_KEY"),
			},
		},
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()

	if err := client.Login(ctx); err != nil {
		panic(err)
	}
	fmt.Println("登录成功：", client.Session().Account)

	courses, err := client.Courses(ctx)
	if err != nil {
		panic(err)
	}

	for _, course := range courses {
		if !includeCourse(course.Name) {
			continue
		}
		if err := runCourse(ctx, client, course); err != nil {
			fmt.Fprintf(os.Stderr, "课程 %s 执行失败：%v\n", course.Name, err)
		}
	}
}

func includeCourse(name string) bool {
	include := []string{} // 例如：[]string{"软件工程"}
	exclude := []string{} // 例如：[]string{"形势与政策"}

	for _, item := range exclude {
		if item == name {
			return false
		}
	}
	if len(include) == 0 {
		return true
	}
	for _, item := range include {
		if item == name {
			return true
		}
	}
	return false
}

func runCourse(ctx context.Context, client yatori.Client, course yatori.Course) error {
	fmt.Printf("\n=== %s (%.1f%%) ===\n", course.Name, course.Progress)

	// 1. 学习
	if yatori.Supports(client, yatori.CapTree) {
		nodes, err := client.Tree(ctx, course)
		if err != nil {
			return fmt.Errorf("tree: %w", err)
		}
		for _, node := range yatori.Flatten(nodes) {
			if err := studyNode(ctx, client, course, node); err != nil {
				return err
			}
		}
	}

	// 2. 作业
	if yatori.Supports(client, yatori.CapWorks) {
		works, err := client.Works(ctx, course)
		if err != nil && !errors.Is(err, yatori.ErrUnsupported) {
			return fmt.Errorf("works: %w", err)
		}
		for _, work := range works {
			if work.Status == "已完成" || work.Status == "finished" {
				continue
			}
			result, err := client.DoWork(ctx, yatori.WorkRequest{
				Course: course,
				Work:   work,
				Source: yatori.AnswerSourceAI,
				Submit: true,
			})
			if err != nil {
				fmt.Fprintf(os.Stderr, "作业 %s 失败：%v\n", work.Name, err)
				continue
			}
			fmt.Printf("作业 %s 提交：%v\n", work.Name, result.Submitted)
		}
	}

	// 3. 考试
	if yatori.Supports(client, yatori.CapExams) {
		exams, err := client.Exams(ctx, course)
		if err != nil && !errors.Is(err, yatori.ErrUnsupported) {
			return fmt.Errorf("exams: %w", err)
		}
		for _, exam := range exams {
			if exam.Status != "待做" && exam.Status != "待重考" {
				continue
			}
			result, err := client.DoExam(ctx, yatori.ExamRequest{
				Course: course,
				Exam:   exam,
				Source: yatori.AnswerSourceAI,
				Submit: true,
			})
			if err != nil {
				fmt.Fprintf(os.Stderr, "考试 %s 失败：%v\n", exam.Name, err)
				continue
			}
			fmt.Printf("考试 %s 提交：%v\n", exam.Name, result.Submitted)
		}
	}

	return nil
}

func studyNode(ctx context.Context, client yatori.Client, course yatori.Course, node yatori.Node) error {
	if node.Completed || node.Kind == yatori.NodeChapter {
		return nil
	}

	position := time.Duration(0)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		result, err := client.Study(ctx, yatori.StudyRequest{
			Course:   course,
			Node:     node,
			Action:   yatori.StudyActionProgress,
			Mode:     yatori.StudyModeNormal,
			Position: position,
		})
		if err != nil {
			if errors.Is(err, yatori.ErrUnsupported) {
				fmt.Printf("跳过不支持的节点：%s (%s)\n", node.Name, node.Kind)
				return nil
			}
			return fmt.Errorf("study %s: %w", node.Name, err)
		}

		fmt.Printf("学习 %s：%.1f%%\n", node.Name, result.Progress)
		position = result.Position
		if result.Completed {
			break
		}
		if node.Duration > 0 && position >= node.Duration {
			break
		}
		if node.Duration <= 0 {
			break
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
	return nil
}
```

## 2. 只学习，不写作业/考试

```go
func studyOnly(ctx context.Context, client yatori.Client) error {
	courses, err := client.Courses(ctx)
	if err != nil {
		return err
	}
	for _, course := range courses {
		nodes, err := client.Tree(ctx, course)
		if err != nil {
			continue
		}
		for _, node := range yatori.Flatten(nodes) {
			if node.Completed || node.Kind == yatori.NodeChapter {
				continue
			}
			_, err := client.Study(ctx, yatori.StudyRequest{
				Course:   course,
				Node:     node,
				Action:   yatori.StudyActionProgress,
				Position: 60 * time.Second,
			})
			if err != nil && !errors.Is(err, yatori.ErrUnsupported) {
				return err
			}
		}
	}
	return nil
}
```

## 3. 多账号并发

每个账号一个 `Client`，不要共享：

```go
type Account struct {
	Username string
	Password string
}

func runAccounts(ctx context.Context, accounts []Account) {
	var wg sync.WaitGroup
	for _, account := range accounts {
		account := account
		wg.Add(1)
		go func() {
			defer wg.Done()

			client, err := yatori.New(yatori.Config{
				Platform: yatori.XueXiTong,
				Account: yatori.Account{
					Username: account.Username,
					Password: account.Password,
				},
			})
			if err != nil {
				fmt.Fprintf(os.Stderr, "[%s] new: %v\n", account.Username, err)
				return
			}
			defer client.Close()

			if err := client.Login(ctx); err != nil {
				fmt.Fprintf(os.Stderr, "[%s] login: %v\n", account.Username, err)
				return
			}

			courses, err := client.Courses(ctx)
			if err != nil {
				fmt.Fprintf(os.Stderr, "[%s] courses: %v\n", account.Username, err)
				return
			}
			for _, course := range courses {
				_, _ = client.Tree(ctx, course)
				// 这里可以复用上面的 runCourse
			}
		}()
	}
	wg.Wait()
}
```

并发建议：

- 同时并发账号数不要太大，建议从 1–3 开始；
- 同一账号不要多开；
- 每个账号可以配置独立代理；
- 被平台限流时增加间隔，不要无限重试。

## 4. 智慧树扫码登录

```go
func zhiHuiShuLogin(ctx context.Context) (yatori.Session, error) {
	client, err := yatori.New(yatori.Config{
		Platform: yatori.ZhiHuiShu,
	})
	if err != nil {
		return yatori.Session{}, err
	}
	defer client.Close()

	qr, ok := client.(yatori.QRCodeLogin)
	if !ok {
		return yatori.Session{}, errors.New("client does not support QR login")
	}

	imageBase64, token, err := qr.QRCode(ctx)
	if err != nil {
		return yatori.Session{}, err
	}

	// 把 imageBase64 输出到前端/终端，让用户扫码
	fmt.Println("二维码 base64：", imageBase64)

	return qr.WaitQRCode(ctx, token)
}
```

## 5. 从 JSON 配置创建客户端

```go
type UserConfig struct {
	Platform string `json:"platform"`
	Username string `json:"username"`
	Password string `json:"password"`
	URL      string `json:"url"`
	School   string `json:"school"`
	Cookie   string `json:"cookie"`
	Proxy    string `json:"proxy"`
}

func clientFromConfig(raw UserConfig) (yatori.Client, error) {
	platform, err := yatori.ParsePlatform(raw.Platform)
	if err != nil {
		return nil, err
	}
	return yatori.New(yatori.Config{
		Platform: platform,
		Account: yatori.Account{
			Username: raw.Username,
			Password: raw.Password,
			URL:      raw.URL,
			School:   raw.School,
			Cookie:   raw.Cookie,
		},
		Options: yatori.Options{
			ProxyURL: raw.Proxy,
		},
	})
}
```

## 6. 优雅退出

所有网络操作都接收 `context.Context`。把 `ctx` 传到每个方法里，用户按 `Ctrl+C` 时可以尽快退出：

```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

if err := client.Login(ctx); err != nil {
	return err
}
```

旧平台动作内部有自己的重试逻辑，`ctx` 不能中断所有底层请求，但可以在两次重试之间尽快返回。

## 7. 错误处理模板

```go
func handleErr(err error) {
	if err == nil {
		return
	}
	switch {
	case errors.Is(err, yatori.ErrUnsupported):
		fmt.Println("平台不支持该操作")
	case errors.Is(err, yatori.ErrNotLoggedIn):
		fmt.Println("登录已失效，请重新登录")
	case errors.Is(err, yatori.ErrInvalidArgument):
		fmt.Println("参数错误：", err)
	default:
		fmt.Println("执行失败：", err)
	}
}
```
