# 代码风格与 PR

## 1. 命名

### 平台常量

```go
const MyPlatform Platform = "MYPLATFORM"
```

- 全大写字符串；
- Go 常量名用大驼峰；
- 别名放在 `platformAliases`。

### 适配器包

```text
internal/driver/myplatform
package myplatform
```

- 目录小写；
- 包名与目录一致；
- 一个平台一个包。

### 文件

```text
adapter.go          # 主实现
helpers.go          # 纯映射函数、ID 生成
adapter_test.go     # 测试
testdata/           # 脱敏响应
```

### 类型

```go
type client struct { ... }        // 不导出
func New(...) (core.Client, error) // 导出
```

外部只通过 `core.Client` 使用，不需要导出 `Client` 类型。

---

## 2. 注释

### 必须写注释的地方

- `New`：说明需要哪些账号字段；
- `Login`：说明验证码/扫码/Cookie 行为；
- `Study`：说明是“一次进度”还是“直接完成”；
- `DoWork`/`DoExam`：说明答案来源和提交行为；
- 平台特殊逻辑：例如人脸、滑块、辅助 exe。

### 注释风格

```go
// Login 使用账号密码登录。若 Account.Cookie 非空，会优先走 Cookie 登录。
func (c *client) Login(ctx context.Context) error {
```

不要写“设置变量”“循环”这种废话注释。

---

## 3. 不要引入新的全局状态

错误：

```go
var globalCache = map[string]string{}
```

正确：

```go
type client struct {
	cache map[string]string
}
```

原因：

- 多账号会互相污染；
- 测试之间会互相影响；
- 库使用者无法控制生命周期。

---

## 4. 不要新增不必要的依赖

新增依赖前先问：

- 标准库能不能做？
- 现有依赖能不能做？
- 这个依赖是否跨平台？
- 是否会显著增大二进制？

新增依赖需要在 PR 描述里说明理由。

---

## 5. 不要修改旧代码的行为，除非必要

适配器优先复用 `internal/api` / `internal/aggregation`。如果必须改旧代码：

- 保持函数签名兼容；
- 不要删除导出函数；
- 先加测试；
- 在 PR 描述里说明影响范围。

---

## 6. 错误与日志

- 新代码不写 `log.Fatal`/`os.Exit`/`panic`；
- 适配器日志用 `c.Logger.Debugf` / `Warnf`；
- 不要打印账号密码、Cookie、Token、API Key；
- 错误用 `core.Wrap` / `core.Unsupported` / `core.Invalid` / `core.NotLoggedIn`。

---

## 7. 文档更新

新增平台必须更新：

| 文件 | 内容 |
|---|---|
| `README.md` | 平台能力表 |
| `yatori-docs/yatori-go-core/docs.md` | 支持平台表 |
| `yatori-docs/yatori-go-core/v2/platforms.md` | 账号参数、能力、注意事项 |
| `yatori-docs/yatori-go-core/v2/capabilities.md` | 能力矩阵 |
| `yatori-docs/yatori-go-core/v2/getting-started.md` | 新必填字段 |
| `yatori-docs/yatori-go-core/dev/new-platform.md` | 参考实现链接（可选） |

文档要求：

- 写清楚必填字段；
- 写清楚 Cookie/Token 支持；
- 写清楚部分支持；
- 写清楚已知限制；
- 给出最小示例。

---

## 8. 提交前检查

```bash
gofmt -w core types.go internal/driver/myplatform internal/driver/driver.go
go build ./...
go vet ./...
go test . ./core
go test -run '^$' ./...
```

有映射测试：

```bash
go test ./internal/driver/myplatform
```

有并发：

```bash
go test -race ./core ./internal/driver/myplatform
```

---

## 9. PR 描述模板

```markdown
## 平台

- 平台名称：
- 平台常量：`MYPLATFORM`
- 账号要求：账号/密码、URL、学校、Cookie？

## 能力

- [ ] Login
- [ ] Cookie 登录
- [ ] Courses
- [ ] Tree
- [ ] Study
- [ ] Works / DoWork
- [ ] Exams / DoExam
- [ ] SignIn
- [ ] QRCodeLogin

## 实现说明

- 复用的旧动作：
- 新增的旧动作（如有）：
- 特殊处理（验证码/人脸/滑块/代理）：

## 测试

- [ ] `go build ./...`
- [ ] `go vet ./...`
- [ ] `go test . ./core`
- [ ] `go test -run '^$' ./...`
- [ ] 映射测试
- [ ] 手动联调（可选，不提交账号）

## 已知限制

- 
```

---

## 10. 评审清单

### 结构

- [ ] 平台常量、描述、别名、`AllPlatforms` 都加了
- [ ] 根包 `types.go` 别名加了
- [ ] `driver.go` 空导入加了
- [ ] adapter `init` 注册了
- [ ] `var _ core.Client = (*client)(nil)` 加了

### 行为

- [ ] `New` 不发网络请求
- [ ] 所有公开方法加锁
- [ ] 所有方法检查 `loggedIn`
- [ ] Cookie/Token 分支正确
- [ ] OCR/资源初始化在 `Login`
- [ ] 错误包装正确
- [ ] 能力位真实
- [ ] 没有 `log.Fatal/os.Exit`

### 映射

- [ ] `Course.ID` 唯一稳定
- [ ] `Course.Extra` 足够
- [ ] `Node.ID` 唯一
- [ ] `Node.Kind` 准确
- [ ] `Duration` 单位正确
- [ ] `Progress` 0–100
- [ ] `Raw` 类型一致

### 测试与文档

- [ ] 构造测试
- [ ] 映射测试
- [ ] 根包 smoke test
- [ ] README/文档更新
- [ ] 没有真实账号/密钥

---

## 11. 提交信息

推荐格式：

```text
feat(driver): add <platform> adapter
fix(driver/<platform>): handle <case>
docs: update <platform> capability table
test(driver/<platform>): add mapping tests
```

不要提交：

- 真实账号；
- Cookie/Token；
- API Key；
- 大体积测试响应（除非必要且已脱敏）。
