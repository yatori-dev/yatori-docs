# 会话与持久化

登录之后，平台会返回 Cookie、Token 或其他会话凭据。V3 用 `Session` 统一表示这些信息。

## Session 结构

```go
type Session struct {
	Platform Platform
	Account  string
	UserID   string
	Cookie   string
	Token    string
	Extra    map[string]string
}
```

| 字段 | 说明 |
|---|---|
| `Platform` | 平台 |
| `Account` | 账号 |
| `UserID` | 平台用户 ID，可能为空 |
| `Cookie` | Cookie 字符串，可能为空 |
| `Token` | Token，可能为空 |
| `Extra` | 平台额外信息，例如 `sign`、`schoolId`、`oncePassword` |

读取：

```go
session := client.Session()
fmt.Println(session.Cookie)
fmt.Println(session.Token)
```

## Cookie 与 Token 的区别

不同平台使用不同的会话凭据：

| 平台 | 主要凭据 | 登录方式 |
|---|---|---|
| XUEXITONG | Cookie | `LoginWithCookie` |
| ICVE | Cookie | `LoginWithCookie` |
| ENAAE | Cookie + ASUSS | `LoginWithCookie` |
| WELEARN | Cookie | `LoginWithCookie` |
| TTCDW | Cookie | `LoginWithCookie` |
| CQIE | access_token | `LoginWithCookie`（传 token） |
| QSXT | token | `LoginWithCookie`（传 token） |
| 其他 | 账号密码 | `Login` |

统一入口都是 `Account.Cookie` 或 `LoginWithCookie`，具体格式见 [平台说明](/yatori-go-core/v3/platforms)。

## 保存会话

```go
type SavedSession struct {
	Platform string            `json:"platform"`
	Account  string            `json:"account"`
	UserID   string            `json:"userId"`
	Cookie   string            `json:"cookie"`
	Token    string            `json:"token"`
	Extra    map[string]string `json:"extra"`
}

func saveSession(s yatori.Session) SavedSession {
	return SavedSession{
		Platform: string(s.Platform),
		Account:  s.Account,
		UserID:   s.UserID,
		Cookie:   s.Cookie,
		Token:    s.Token,
		Extra:    s.Extra,
	}
}
```

::: warning
Cookie/Token 等同于账号密码，必须加密保存，不要提交到 Git，不要返回给前端。
:::

## 恢复会话

```go
func restore(ctx context.Context, saved SavedSession) (yatori.Client, error) {
	platform, err := yatori.ParsePlatform(saved.Platform)
	if err != nil {
		return nil, err
	}
	client, err := yatori.New(yatori.Config{
		Platform: platform,
		Account: yatori.Account{
			Username: saved.Account,
			Cookie:   firstNonEmpty(saved.Cookie, saved.Token),
		},
	})
	if err != nil {
		return nil, err
	}
	if err := client.LoginWithCookie(ctx, firstNonEmpty(saved.Cookie, saved.Token)); err != nil {
		return nil, err
	}
	return client, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
```

注意：

- 不是所有平台都支持 Cookie 登录；
- 某些平台的 `Session.Cookie` 可能为空，需要把 `Token` 填到 `Account.Cookie`；
- 恢复失败时回退到账号密码登录。

## 会话失效

会话可能因为以下原因失效：

- 平台主动过期；
- 异地登录/挤号；
- 代理 IP 变化；
- 平台风控。

统一处理方式：

```go
if errors.Is(err, yatori.ErrNotLoggedIn) {
	if err := client.Login(ctx); err != nil {
		return err
	}
	// 重试当前操作
}
```

部分平台的旧动作内部会自动重登，但不要完全依赖它。业务层最好有自己的重登策略。

## 多账号

每个账号保存一份 `Session`：

```go
type AccountState struct {
	Account yatori.Account
	Session yatori.Session
}
```

恢复时按账号创建独立 `Client`，不要共享 `Client`。

## 安全建议

- Cookie/Token 使用 AES-GCM 或系统密钥链加密；
- 日志中只打印账号掩码，例如 `138****0000`；
- 不要把 `Session` 直接序列化后返回给 Web 前端；
- 不要把 Cookie/Token 写进 URL；
- 代理账号密码也不要明文保存。
