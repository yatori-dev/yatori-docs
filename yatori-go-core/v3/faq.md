# 常见问题

## 基础概念

### `ErrUnsupported` 是什么意思？

平台不支持当前操作。例如微伴只有登录，调用 `client.Courses` 就会返回包装了 `ErrUnsupported` 的错误。

```go
if errors.Is(err, yatori.ErrUnsupported) {
	// 平台没有这个功能
}
```

不要用 `err == yatori.ErrUnsupported`，因为适配器会加上平台和操作上下文。

### `Capabilities()` 和 `ErrUnsupported` 有什么区别？

- `Capabilities()`：调用前预判，告诉你平台实现了哪些能力；
- `ErrUnsupported`：调用后兜底，确认平台确实不支持。

两者配合使用，详见 [能力与错误](/yatori-go-core/v3/capabilities)。

### `Capabilities()` 能判断当前账号有没有作业吗？

不能。能力位只表示“平台实现了这个接口”。课程没有作业时，`Works` 返回空切片和 `nil` 错误。

### `Capabilities()` 能判断有没有登录吗？

不能。未登录时调用 `Courses` 会返回 `ErrNotLoggedIn`。

## 登录

### 为什么登录失败？

按顺序检查：

1. 账号密码是否正确；
2. 平台是否需要 `Account.URL`（英华、海旗）；
3. 平台是否需要 `Account.School`（微伴）；
4. 网络/代理是否可用；
5. 是否触发验证码或风控；
6. 是否需要使用 Cookie/Token 登录。

### 英华/海旗为什么要填 URL？

这两个平台的接口地址与学校站点绑定。英华的 URL 必须是**登录后的站点地址**，不是登录页；海旗的 URL 是学校站点根地址。

### Cookie/Token 怎么填？

统一填到 `Account.Cookie`：

```go
Account: yatori.Account{
	Username: "账号",
	Password: "密码",
	Cookie:   "cookie_or_token",
},
```

支持情况见 [平台说明](/yatori-go-core/v3/platforms)。

### 智慧树为什么不能 `Login`？

智慧树只有扫码登录。请使用 `yatori.QRCodeLogin` 接口：

```go
qr := client.(yatori.QRCodeLogin)
imageBase64, token, _ := qr.QRCode(ctx)
session, _ := qr.WaitQRCode(ctx, token)
```

## 学习

### 为什么 `Study` 一次就完成了？

不同平台的粒度不同：

- 学习通/英华/CQIE/TTCDW：提交一次进度；
- 职教云/课堂行/WeLearn：一次调用完成整个节点；
- 青书：开始/提交一次学习会话；
- 海旗：提交一次百分比，Fast 模式直接完成。

以 `StudyResult.Completed` 为准，不要假设所有平台都需要循环。

### `Study` 的 `Position` 是什么单位？

`time.Duration`，例如 `60 * time.Second`。动态调用时也支持 `"60s"` 或 `60`（秒）。

### 为什么 `Tree` 返回的章节没有子节点？

可能原因：

- 章节未开放；
- 章节下确实没有任务点；
- 平台接口临时失败（适配器会记录 debug 日志并返回空 children）；
- 该平台只返回扁平节点。

### 学习通的直播/讨论节点为什么返回 `ErrUnsupported`？

V3 目前只统一了视频、音频、文档、外链等主要节点。直播/讨论的接口差异较大，尚未纳入统一 `Study`，后续版本会补齐。

## 作业与考试

### `Works` 返回空切片，是失败吗？

不是。表示课程没有作业，或者当前账号没有可见作业。`err` 为 `nil`。

### `DoWork` 的 `AnswerSource` 怎么选？

| 来源 | 适用场景 |
|---|---|
| `AnswerSourceAI` | 已配置 `Options.AI` |
| `AnswerSourceBank` | 已配置 `Options.QuestionBank` |
| `AnswerSourceBuiltin` | 平台随题返回答案，例如青书、海旗 |
| `AnswerSourceManual` | 你自己填充答案 |

### 青书为什么不使用 AI？

青书的作业接口会随题返回参考答案，适配器直接使用平台答案，所以 `AnswerSource` 对青书不生效。

### 海旗的 `DoWork` 为什么处理了所有作业？

海旗的作业/考试接口按课程节点聚合，适配器沿用旧实现的行为：一次处理该课程下所有相关任务，而不是只处理传入的那一份。调用后请以 `AnswerResult.Raw` / 日志为准。

### ENAAE 的考试为什么不能提交？

ENAAE 目前只实现了考试列表，`DoExam` 返回 `ErrUnsupported`。

## 配置与资源

### 为什么运行目录会出现 `assets` 目录？

部分平台沿用旧实现的相对路径：

- 验证码图片：`./assets/code/`
- 职教云辅助 exe：`./assets/tencentCollect.exe`、`./assets/tencentPowSolve.exe`
- OCR 模型：`./assets/*.onnx`、`./assets/onnxruntime_*.dll`
- 学习通人脸素材：`./assets/faces/`

新 SDK 已经改为按需释放，但路径仍然是相对当前工作目录的。请确保运行目录可写。

`Options.WorkDir` 目前是预留字段，旧动作还没有全部迁移到它。

### 可以关闭日志吗？

适配器自身使用 `Options.Logger`；传 `yatori.NopLogger()` 可以关闭适配器日志。旧平台动作仍会向标准输出打印部分日志，这是历史行为。

### 代理怎么配置？

```go
Options: yatori.Options{
	ProxyURL: "http://127.0.0.1:7890",
},
```

旧缓存只接受主机和端口，适配器会解析 URL 后传入。带用户名密码的代理支持有限，建议使用本地无认证代理。

### AI 配置怎么写？

```go
Options: yatori.Options{
	AI: &yatori.AIConfig{
		Type:   yatori.AIDeepSeek,
		Model:  "deepseek-chat",
		APIKey: "sk-xxxx",
	},
},
```

`Type` 可用值见 [快速开始](/yatori-go-core/v3/getting-started#_5-4-ai-配置)。

### 外部题库怎么接？

```go
Options: yatori.Options{
	QuestionBank: &yatori.QuestionBankConfig{
		URL: "http://127.0.0.1:8083",
	},
},
```

题库协议见 [题库对接文档](/bank-interface-api/docs)。

## 并发与稳定性

### 可以多个 goroutine 共用一个 Client 吗？

不建议。一个 `Client` 对应一个账号/会话，方法内部会串行访问底层状态。多账号请为每个账号创建独立 `Client`。

### 多账号并发多少合适？

从 1–3 个账号开始，观察平台限流和封控情况。不要无限并发，也不要在同一账号上多开。

### 登录失效怎么办？

重新调用 `client.Login(ctx)`：

```go
if errors.Is(err, yatori.ErrNotLoggedIn) {
	if err := client.Login(ctx); err != nil {
		return err
	}
}
```

部分平台的动作内部会自动重登，但不要完全依赖它。

### 可以把 `Client` 存到数据库吗？

不可以。`Client` 持有网络会话和指针，不能序列化。需要持久化时保存：

- 平台；
- 账号；
- `Session.Cookie` / `Session.Token`；
- 课程/节点的 `Extra`。

## 编译与依赖

### `gcc: executable file not found`

需要安装 GCC/MinGW-w64，并确保 `gcc` 在 `PATH` 中。Windows 推荐使用 MinGW-w64。

### `CGO_ENABLED=0` 可以吗？

不可以。部分依赖需要 CGO。请设置：

```bash
set CGO_ENABLED=1
```

### 为什么二进制这么大？

根包会注册全部平台适配器，因此会链接所有平台依赖（包括 OCR、SQLite、ONNX Runtime）。这是“一个入口支持全部平台”的代价。

当前版本必须导入根包，因此会链接全部平台依赖。后续版本会提供按平台拆分的公开 driver 包，届时可以只链接需要的平台。

## 迁移

### 还能导入 `api/*` 或 `aggregation/*` 吗？

不能。它们已经移动到 `internal/`，外部模块无法导入。请使用根包 `yatori`。

### `global.Config` 还能用吗？

可以编译，但已标记 `Deprecated`。新代码请把配置显式传给 `yatori.New`。

### `utils.YatoriCoreInit()` 还需要调用吗？

新 SDK 不需要。适配器会在需要时初始化 OCR/辅助资源。只有你仍在直接使用旧 `api`/`aggregation` 代码时才需要。

## 其他

### 如何查看平台原始数据？

用 `Course.Raw`、`Node.Raw`、`Work.Raw`、`Exam.Raw`。它们只在当前进程有效，不要序列化。

### 如何提交问题？

请附上：

- 平台；
- 脱敏后的错误信息；
- 复现代码；
- `go version`、操作系统；
- 是否使用代理/Cookie/AI。

不要提交真实账号密码、Cookie、Token、API Key。
