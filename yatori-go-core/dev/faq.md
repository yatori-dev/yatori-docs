# 开发常见坑

## 1. `New` 返回 `no adapter registered for platform`

### 现象

```text
yatori: MYPLATFORM: new: no adapter registered for platform
```

### 原因

- 忘记在 adapter 里写 `init() { core.Register(...) }`；
- 忘记在 `internal/driver/driver.go` 空导入；
- 平台常量不在 `platformDescriptions` 里。

### 修复

```go
func init() {
	core.Register(core.MyPlatform, New)
}
```

```go
import _ "github.com/yatori-dev/yatori-go-core/internal/driver/myplatform"
```

---

## 2. `New` 返回 `unsupported platform`

### 原因

`core/platform.go` 的 `platformDescriptions` 没有加新平台。

### 修复

```go
var platformDescriptions = map[Platform]string{
	MyPlatform: "我的平台",
}
```

---

## 3. `Courses` 返回 `ErrUnsupported`

### 原因

- `Capabilities()` 没有设置 `CapCourses`；
- 方法没有实现，直接返回 `core.Unsupported`。

### 修复

```go
func (c *client) Capabilities() core.Capability {
	return core.CapLogin | core.CapCourses
}
```

并实现 `Courses`。

---

## 4. `Courses` 返回 `ErrNotLoggedIn`

### 原因

- 没有调用 `Login`；
- `Login` 没有设置 `loggedIn = true`；
- `Login` 失败但被忽略。

### 修复

```go
if err := client.Login(ctx); err != nil {
	return err
}
```

并在 adapter 的 `Login` 成功后设置：

```go
c.loggedIn = true
```

---

## 5. 死锁

### 现象

调用 `Courses` 一直卡住。

### 原因

公开方法里又调用了另一个公开方法：

```go
func (c *client) Courses(ctx) {
	unlock := c.Lock()
	defer unlock()
	c.Tree(ctx, ...) // Tree 也会 Lock
}
```

### 修复

拆成 `xxxLocked`：

```go
func (c *client) Courses(ctx) {
	unlock := c.Lock()
	defer unlock()
	return c.coursesLocked(ctx)
}
```

---

## 6. Cookie 被覆盖 / 数据竞争

### 原因

没有加锁，多个 goroutine 同时修改 `cache.cookies`。

### 修复

所有公开方法加锁：

```go
unlock := c.Lock()
defer unlock()
```

多账号时，每个账号一个 `Client`，不要共享。

---

## 7. `Tree` 返回空 children

### 可能原因

- 章节未开放；
- 章节下确实没有任务点；
- 单个章节请求失败，被 `continue` 跳过；
- 平台只返回扁平节点。

### 修复

- 记录 `c.Logger.Debugf`；
- 确认平台接口返回；
- 如果是锁定章节，属于正常情况；
- 如果是失败，修错误处理。

---

## 8. `Study` 报 `node raw data is missing`

### 原因

`Study` 只拿到 `nodeId`，但 `Tree` 没有被调用，或者没有把节点存入 `c.nodes`。

### 修复

1. 先调用 `Tree`；
2. 在 `Tree` 里存：

```go
c.nodes[node.ID] = node
```

3. `Study` 里回查：

```go
if stored, ok := c.nodes[req.Node.ID]; ok {
	raw = stored.Raw
}
```

---

## 9. `DoWork` 报 `work raw data is missing`

### 原因

- 没有先调用 `Works`；
- `Works` 没有把作业存入 `c.works`；
- `Work.Raw` 类型和 `DoWork` 断言类型不一致。

### 修复

```go
// Works
c.works[item.ID] = item
out = append(out, core.Work{..., Raw: item})

// DoWork
work, ok := req.Work.Raw.(*agg.Work)
if !ok || work == nil {
	work = c.works[req.Work.ID]
}
```

统一使用值或指针。

---

## 10. Progress 显示成 0.5%

### 原因

平台是 0–1，适配器没有乘 100。

### 修复

```go
Progress: item.Progress * 100
```

统一 0–100。

---

## 11. Duration 显示成几毫秒

### 原因

把秒当成 `time.Duration` 的纳秒。

### 修复

```go
Duration: driverutil.Seconds(item.Duration)
```

或：

```go
Duration: time.Duration(item.DurationMillis) * time.Millisecond
```

---

## 12. 节点 ID 冲突

### 原因

- 用课程名/节点名做 ID；
- 用切片索引做 ID；
- 组合 ID 缺少关键字段。

### 修复

```go
ID: fmt.Sprintf("video:%d:%d:%s", knowledgeID, cardIndex, objectID)
```

保证稳定、唯一、不透明。

---

## 13. `Raw` 存数据库后无法使用

### 原因

`Raw` 是平台对象，不是可序列化数据。

### 修复

持久化只保存 `Extra`：

```go
type SavedCourse struct {
	ID    string            `json:"id"`
	Name  string            `json:"name"`
	Extra map[string]string `json:"extra"`
}
```

恢复时：

```go
core.Course{ID: saved.ID, Name: saved.Name, Extra: saved.Extra}
```

---

## 14. 进程被 `log.Fatal` 杀掉

### 原因

旧代码或适配器里调用了 `log.Fatal` / `os.Exit`。

### 修复

改成返回错误：

```go
if err != nil {
	return nil, core.Wrap(core.MyPlatform, "courses", err)
}
```

新代码禁止 `log.Fatal` / `os.Exit` / `panic`。

---

## 15. `New` 很慢 / 启动就写 `assets`

### 原因

在 `New` 里调用了 `driverutil.EnsureOCR()` 或 `utils.YatoriCoreInit()`。

### 修复

移到 `Login`：

```go
func (c *client) Login(ctx context.Context) error {
	unlock := c.Lock()
	defer unlock()
	driverutil.EnsureOCR()
	// ...
}
```

---

## 16. 平台常量加了，但用户写 `yatori.MyPlatform` 编译失败

### 原因

只加了 `core.MyPlatform`，没有加根包别名。

### 修复

`types.go`：

```go
const MyPlatform = core.MyPlatform
```

---

## 17. `Call` 参数解析失败

### 原因

- 参数名写错；
- `position` 不是合法时长；
- `courseId` / `nodeId` 没有传；
- 只传 ID，但缓存里没有（没有先调用 `Courses`/`Tree`）。

### 修复

```go
client.Call(ctx, yatori.ActionStudy, map[string]any{
	"courseId": course.ID,
	"nodeId":   node.ID,
	"position": "60s",
	"mode":     "normal",
})
```

先 `Courses` → `Tree`，或直接传完整 `Course`/`Node`。

---

## 18. 能力位设置了，但方法返回 `ErrUnsupported`

### 原因

能力位和方法实现不一致。

### 修复

- 要么实现方法；
- 要么去掉能力位；
- 部分支持时，文档写清楚。

---

## 19. 测试需要真实账号

### 原因

测试直接调用 `Login`，没有跳过开关。

### 修复

```go
if os.Getenv("YATORI_LIVE") != "1" {
	t.Skip("set YATORI_LIVE=1 to run")
}
```

CI 默认不跑真实账号测试。

---

## 20. 文档没更新

### 现象

代码合了，但用户不知道新平台怎么填账号。

### 修复

更新：

- `README.md` 能力表；
- `yatori-go-core/docs.md` 平台表；
- `v2/platforms.md` 账号参数；
- `v2/capabilities.md` 能力矩阵。

---

## 21. `go vet` 报错

### 常见

- 复制了包含 `sync.Mutex` 的结构体；
- 格式化字符串参数不匹配；
- 未使用的变量。

### 修复

```bash
go vet ./...
```

按提示修，不要忽略。

---

## 22. 平台接口变了

### 步骤

1. 先复现；
2. 抓请求/响应；
3. 改 `internal/api`；
4. 改 `internal/aggregation`；
5. 改 adapter 映射；
6. 补测试；
7. 更新文档。

不要直接改 adapter 绕过旧层，否则会越来越乱。
