# 平台说明

每个平台的账号参数、支持能力和注意事项都不同。这篇文档按平台列出最常见的问题。

::: tip 通用规则
1. 先看 [能力与错误](/yatori-go-core/v2/capabilities) 确认平台支持哪些方法。
2. `Account.URL` 不是所有平台都需要；需要时通常要求填写**登录后的站点地址**。
3. Cookie/Token 登录优先使用 `Account.Cookie`。
4. 一个 `Client` 对应一个账号。
:::

## 超星学习通（XUEXITONG）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.XueXiTong,
	Account: yatori.Account{
		Username: "手机号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.XueXiTong` |
| 别名 | `XUEXITONG`、`XXT`、`CHAOXING` |
| 必填 | `Username`、`Password`，或 `Cookie` |
| URL | 不需要 |
| Cookie 登录 | 支持，把浏览器 Cookie 填到 `Account.Cookie` |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`、`works`、`exams`

`Study` 支持：

- 视频：`NodeVideo`
- 音频：`NodeAudio`
- 文档：`NodeDocument`
- 外链：`NodeLink`
- 作业/考试节点请用 `Works` / `Exams`，不要直接 `Study`
- 直播/讨论：目前返回 `ErrUnsupported`

注意：

- 登录和章节操作可能触发图片验证码，适配器会自动处理。
- 视频提交可能触发人脸校验，适配器会尝试平台内的人脸流程；失败时返回错误。
- 首次使用会在运行目录生成 `./assets`（OCR 模型、人脸素材等）。
- 课程作业/考试使用 `Options.AI` 或 `Options.QuestionBank`；未配置时会使用内置默认答案。

## 英华学堂（YINGHUA）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.YingHua,
	Account: yatori.Account{
		URL:      "https://mooc.example.com",
		Username: "学号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.YingHua` |
| 必填 | `URL`、`Username`、`Password` |
| URL | 必填，必须是登录后的学校站点地址 |
| Cookie 登录 | 不支持 |

支持能力：

`login`、`courses`、`tree`、`study`、`works`、`exams`

注意：

- URL 填错时登录会返回“请填写正确的 url 链接”。
- 作业/考试支持 AI 和外部题库，需要配置 `Options.AI` 或 `Options.QuestionBank`。
- 学习节奏由调用方控制，`Study` 一次提交一个观看时长。

## 智慧职教 / 职教云（ICVE）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.ICVE,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
		// 或者 Cookie: "浏览器 Cookie",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.ICVE` |
| 别名 | `ICVE`、`ZJY` |
| 必填 | `Username`、`Password`，或 `Cookie` |
| URL | 可选 |
| Cookie 登录 | 支持 |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`

注意：

- `Study` 会直接完成当前任务点，不按 `Position` 逐秒提交。
- 登录验证码需要 OCR 和平台辅助 exe；首次登录会在 `./assets` 释放 `tencentCollect.exe`、`tencentPowSolve.exe` 和 OCR 模型。
- 没有单独的作业/考试接口，`Works` / `Exams` 返回 `ErrUnsupported`。

## 重庆工程学院（CQIE）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.CQIE,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
		// 或者 Cookie: "access_token",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.CQIE` |
| 必填 | `Username`、`Password`，或 `Cookie`（access_token） |
| URL | 不需要 |
| Cookie 登录 | 支持，传 access_token |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`

注意：

- `Study` 提交一次视频进度，内部会先获取学习分配 ID。
- 视频段里内嵌的作业由学习保存流程处理，不单独暴露 `Works`。
- 没有独立考试接口。

## 中国教育干部网络学院（ENAAE）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.ENAAE,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.ENAAE` |
| 必填 | `Username`、`Password`，或 `Cookie` |
| URL | 不需要 |
| Cookie 登录 | 支持 |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`、`exams`（仅列表）

注意：

- `Courses` 会把“项目 → 课程”扁平化成课程列表。
- `Study` 普通模式按时间戳提交；`StudyModeFast` 使用分钟数快速提交。
- `Exams` 只提供考试列表，`DoExam` 返回 `ErrUnsupported`。

## WeLearn 随行课堂（WELEARN）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.WeLearn,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.WeLearn` |
| 必填 | `Username`、`Password`，或 `Cookie` |
| URL | 不需要 |
| Cookie 登录 | 支持 |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`

注意：

- `Study` 会直接完成当前任务点。
- 没有作业/考试接口。

## 青书学堂（QSXT）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.QSXT,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
		// 或者 Cookie: "token",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.QSXT` |
| 别名 | `QSXT`、`QINGSHUXUE`、`QINGSHUXUETANG` |
| 必填 | `Username`、`Password`，或 `Cookie`（token） |
| URL | 不需要 |
| Cookie 登录 | 支持，传 token |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`、`works`

注意：

- 登录验证码是算术题，适配器会自动识别。
- `Study` 使用平台学习会话；第一次会 start，之后提交进度，`finish` 结束会话。
- 作业使用平台随题返回的参考答案，`AnswerSource` 对青书不生效。
- 课程资料（materials）目前没有暴露为统一接口。

## TTCDW

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.TTCDW,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.TTCDW` |
| 必填 | `Username`、`Password`，或 `Cookie` |
| URL | 不需要 |
| Cookie 登录 | 支持 |

支持能力：

`login`、`cookie-login`、`courses`、`tree`、`study`

注意：

- `Courses` 会把“项目 → 课堂 → 课程”扁平化成课程列表，课程 ID 由多段平台 ID 组合，避免重名冲突。
- `Study` 提交一次视频进度。
- 没有作业/考试接口。

## 课堂行（KETANGX）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.Ketangx,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.Ketangx` |
| 必填 | `Username`、`Password` |
| URL | 不需要 |
| Cookie 登录 | 不支持 |

支持能力：

`login`、`courses`、`tree`、`study`

注意：

- `Study` 会直接完成视频。
- 没有作业/考试接口。

## 海旗科技（ZXCPKS / HAIQIKEJI）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.HaiQiKeJi,
	Account: yatori.Account{
		URL:      "https://school.haiqikeji.com/",
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.HaiQiKeJi` |
| 别名 | `ZXCPKS`、`HAIQIKEJI`、`HQKJ` |
| 必填 | `URL`、`Username`、`Password` |
| URL | 必填，学校站点 |
| Cookie 登录 | 不支持 |

支持能力：

`login`、`courses`、`tree`、`study`、`works`、`exams`

注意：

- `Study` 普通模式提交百分比进度；`StudyModeFast` 或 `StudyActionFinish` 会走快速完成。
- 作业/考试支持 AI 和平台内置标答：
  - `AnswerSourceAI`：调用 `Options.AI`；
  - `AnswerSourceBuiltin`：只使用平台随题返回的标答；
  - `AnswerSourceBank`：不支持。
- `DoWork` / `DoExam` 会处理该课程下所有相关节点，而不是只处理传入的那一份。

## 安全微伴（WEIBAN）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.WeiBan,
	Account: yatori.Account{
		School:   "学校名称",
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.WeiBan` |
| 必填 | `School`、`Username`、`Password` |
| URL | 不需要 |
| Cookie 登录 | 不支持 |

支持能力：

`login`

注意：

- 只实现登录，课程/学习/作业/考试都会返回 `ErrUnsupported`。
- `School` 必须与平台学校列表中的名称完全一致。

## CELA

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.CELA,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.CELA` |
| 必填 | `Username`、`Password` |
| URL | 不需要 |
| Cookie 登录 | 不支持 |

支持能力：

`login`

注意：

- 登录包含图片验证码，适配器会自动 OCR。
- 只实现登录。

## 中国大学 MOOC（MOOC）

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.MOOC,
	Account: yatori.Account{
		Username: "账号",
		Password: "密码",
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.MOOC` |
| 必填 | `Username`、`Password` |
| URL | 不需要 |
| Cookie 登录 | 不支持 |

支持能力：

`login`

注意：

- 只实现登录。
- 登录流程包含 `InitCookiesApi → GtApi → PowGetPApi → LoginApi`，适配器已封装。

## 智慧树（ZHIHUISHU）

智慧树没有账号密码登录，使用扫码登录。

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.ZhiHuiShu,
})
if err != nil {
	return err
}

qr, ok := client.(yatori.QRCodeLogin)
if !ok {
	return errors.New("当前客户端不支持扫码登录")
}

// 1. 生成二维码
imageBase64, token, err := qr.QRCode(ctx)
if err != nil {
	return err
}

// 2. 把 imageBase64 转成图片，交给用户扫描
// 例如：data:image/png;base64,<imageBase64>

// 3. 等待扫码确认
session, err := qr.WaitQRCode(ctx, token)
if err != nil {
	return err
}
fmt.Println("登录成功：", session.Token)
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.ZhiHuiShu` |
| 别名 | `ZHIHUISHU`、`ZHS`、`ZHIDAO` |
| 必填 | 无 |
| 能力 | `qr-code-login` |

注意：

- `client.Login(ctx)` 对智慧树不可用，会返回参数错误提示你使用扫码接口。
- `WaitQRCode` 默认每 5 秒轮询一次，直到扫码确认或 `ctx` 取消。
- 扫码成功后，`Session.Token` 是 `oncePassword`，`Session.Extra` 里还有 `uuid`。

## 工学云（GONGXUE）

工学云只实现签到。

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.GongXue,
	Account: yatori.Account{
		Username: "手机号",
		Password: "密码",
	},
})
if err != nil {
	return err
}

result, err := client.SignIn(ctx, yatori.SignInRequest{
	Location: "科技园",
	Extra: map[string]any{
		"country":   "中国",
		"province":  "广东省",
		"city":      "深圳市",
		"area":      "南山区",
		"longitude": "113.93",
		"latitude":  "22.53",
		"address":   "科技园",
		"playType":  "START", // START 上班，END 下班
	},
})
```

| 项目 | 说明 |
|---|---|
| 平台常量 | `yatori.GongXue` |
| 别名 | `GONGXUE`、`GXY` |
| 必填 | `Username`、`Password` |
| 能力 | `sign-in` |

注意：

- `Login` 是空操作，真正的认证发生在 `SignIn`。
- 旧实现失败时只写日志、不返回错误，所以 `SignInResult.Success` 表示“流程已执行”，不代表服务器一定接受。
- `Extra` 中的省市区、经纬度会影响签到结果，请按实际位置填写。

## 平台选择速查

```go
platform, err := yatori.ParsePlatform("xuexitong")
if err != nil {
	return err
}

client, err := yatori.New(yatori.Config{
	Platform: platform,
	Account:  account,
})
```
