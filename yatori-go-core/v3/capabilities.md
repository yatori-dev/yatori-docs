# 能力与错误

V3 的目标是“统一接口”，但平台能力并不完全相同。比如微伴只有登录，智慧树只有扫码登录，学习通有作业和考试，职教云没有作业接口。

为了既不强迫调用方写平台分支，又不隐藏平台差异，V2 提供了两套机制：

1. `client.Capabilities()`：调用前判断平台支持什么；
2. `yatori.ErrUnsupported`：调用后确认平台确实不支持。

## Capability 能力位

```go
type Capability uint32

const (
	CapLogin       Capability = 1 << iota // 账号密码登录
	CapCookieLogin                        // Cookie/Token 登录
	CapCourses                            // 课程列表
	CapTree                               // 章节/节点树
	CapStudy                              // 学习
	CapWorks                              // 作业
	CapExams                              // 考试
	CapSignIn                             // 签到
	CapQRCodeLogin                        // 扫码登录
)
```

能力位是位图，可以组合：

```go
caps := client.Capabilities()
fmt.Println(caps.String())
// 例如：login,cookie-login,courses,tree,study,works,exams
```

判断：

```go
if caps.Has(yatori.CapWorks) {
	// 支持作业
}
```

SDK 提供快捷函数：

```go
if yatori.Supports(client, yatori.CapWorks) {
	// ...
}
```

## ErrUnsupported

平台不支持某个操作时，适配器不会 panic，也不会返回空数据假装成功，而是返回一个包装了 `ErrUnsupported` 的错误：

```go
_, err := client.Works(ctx, course)
if errors.Is(err, yatori.ErrUnsupported) {
	// 这个平台没有作业能力
	return nil
}
```

错误文本会带上平台和操作：

```text
yatori: WEIBAN: works: yatori: operation not supported by platform
```

所以：

- 用 `errors.Is(err, yatori.ErrUnsupported)` 判断，**不要**用 `err == yatori.ErrUnsupported`；
- 用 `errors.Is(err, yatori.ErrNotLoggedIn)` 判断未登录；
- 用 `errors.Is(err, yatori.ErrInvalidArgument)` 判断参数错误。

## 结构化错误

所有错误都可以转换成 `*yatori.Error`：

```go
var sdkErr *yatori.Error
if errors.As(err, &sdkErr) {
	fmt.Println("平台：", sdkErr.Platform)
	fmt.Println("操作：", sdkErr.Op)
	fmt.Println("错误码：", sdkErr.Code)
	fmt.Println("消息：", sdkErr.Message)
	fmt.Println("底层错误：", sdkErr.Err)
}
```

字段：

| 字段 | 说明 |
|---|---|
| `Platform` | 平台常量 |
| `Op` | 操作名，例如 `login`、`study`、`work` |
| `Code` | 错误码，例如 `unsupported`、`not_logged_in`、`invalid_argument` |
| `Message` | 可读消息 |
| `Err` | 底层错误，可用 `errors.Unwrap` 继续追 |

## 三个不要混淆的概念

### 能力位 ≠ 当前账号有数据

`CapWorks` 表示“这个平台实现了作业接口”，不代表当前课程一定有作业。

```go
works, err := client.Works(ctx, course)
// works 可能是空切片，err 为 nil
```

### 能力位 ≠ 登录状态

`CapCourses` 表示“平台能拉课程”，不代表已经登录。

```go
courses, err := client.Courses(ctx)
// 未登录时返回 ErrNotLoggedIn，而不是 ErrUnsupported
```

### ErrUnsupported ≠ 网络错误

`ErrUnsupported` 是稳定的能力声明；网络错误、验证码错误、平台业务错误是另外的错误，不要混在一起处理。

```go
switch {
case errors.Is(err, yatori.ErrUnsupported):
	// 平台没有这个功能，跳过
case errors.Is(err, yatori.ErrNotLoggedIn):
	// 重新登录
case errors.Is(err, yatori.ErrInvalidArgument):
	// 参数问题
default:
	// 网络/业务问题，记录日志并重试或跳过
}
```

## 平台能力矩阵

图例：✅ 支持；⚠️ 部分支持；— 不支持。

| 平台 | 登录 | Cookie/Token | 课程 | 节点树 | 学习 | 作业 | 考试 | 签到 | 扫码 |
|---|---|---|---|---|---|---|---|---|---|
| XUEXITONG | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| YINGHUA | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| ICVE | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| CQIE | ✅ | ✅ Token | ✅ | ✅ | ✅ | — | — | — | — |
| ENAAE | ✅ | ✅ | ✅ | ✅ | ✅ | — | ⚠️ 列表 | — | — |
| WELEARN | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| QSXT | ✅ | ✅ Token | ✅ | ✅ | ✅ | ✅ | — | — | — |
| TTCDW | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| KETANGX | ✅ | — | ✅ | ✅ | ✅ | — | — | — | — |
| ZXCPKS | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| WEIBAN | ✅ | — | — | — | — | — | — | — | — |
| CELA | ✅ | — | — | — | — | — | — | — | — |
| MOOC | ✅ | — | — | — | — | — | — | — | — |
| ZHIHUISHU | — | — | — | — | — | — | — | — | ✅ |
| GONGXUE | — | — | — | — | — | — | — | ✅ | — |

说明：

- ENAAE 的“考试”目前只提供列表，`DoExam` 返回 `ErrUnsupported`；
- CQIE 的作业内嵌在视频段里，由 `Study` 的保存流程处理，不单独暴露 `Works`；
- QSXT 的作业使用平台随题返回的参考答案，不依赖 `Options.AI`；
- 海旗的 `DoWork` / `DoExam` 会处理该课程下所有相关节点，而不是只处理传入的那一份；
- 学习通的直播/讨论等复杂节点目前会返回 `ErrUnsupported`，视频/音频/文档/外链可用。

## 调用前判断的推荐写法

```go
func studyCourse(ctx context.Context, client yatori.Client, course yatori.Course) error {
	if !yatori.Supports(client, yatori.CapTree) {
		return nil
	}
	nodes, err := client.Tree(ctx, course)
	if err != nil {
		return err
	}
	for _, node := range yatori.Flatten(nodes) {
		if node.Completed || node.Kind == yatori.NodeChapter {
			continue
		}
		if _, err := client.Study(ctx, yatori.StudyRequest{
			Course:   course,
			Node:     node,
			Action:   yatori.StudyActionProgress,
			Position: 60 * time.Second,
		}); err != nil {
			if errors.Is(err, yatori.ErrUnsupported) {
				continue
			}
			return err
		}
	}
	return nil
}
```

## 动态调用同样适用

```go
_, err := client.Call(ctx, yatori.ActionWorks, map[string]any{
	"courseId": course.ID,
})
if errors.Is(err, yatori.ErrUnsupported) {
	// 平台不支持 Works
}
```
