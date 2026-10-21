# 测试与验收

core 的测试原则：**默认不依赖真实账号**。真实账号只用于本地手动联调，不能进 CI。

## 1. 测试分层

| 层级 | 目标 | 是否需要账号 |
|---|---|---|
| 编译断言 | 适配器是否实现 `core.Client` | 否 |
| 构造函数测试 | `New` 是否正确校验参数 | 否 |
| 纯映射测试 | 平台结构体 → core 模型 | 否 |
| 注册测试 | 平台是否出现在 `Registered()` | 否 |
| 编译全部包 | 所有包和测试能否编译 | 否 |
| 手动联调 | 真实登录/课程/学习 | 是，仅本地 |

## 2. 编译期断言

在每个 adapter 文件末尾加：

```go
var _ core.Client = (*client)(nil)
```

如果漏实现方法，`go build` 会直接失败。

扫码平台再加：

```go
var _ core.QRCodeLogin = (*client)(nil)
```

## 3. 构造函数测试

```go
func TestNewRequiresAccount(t *testing.T) {
	_, err := New(core.Config{Platform: core.MyPlatform})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestNewRequiresURL(t *testing.T) {
	_, err := New(core.Config{
		Platform: core.MyPlatform,
		Account:  core.Account{Username: "u", Password: "p"},
	})
	if err == nil {
		t.Fatal("expected url error")
	}
}
```

`New` 不应该发网络请求，所以这些测试可以快速、离线运行。

## 4. 纯映射测试

### 4.1 把映射抽成纯函数

```go
func mapCourse(raw agg.MyPlatformCourse) core.Course {
	return core.Course{
		ID:       raw.CourseID,
		Name:     raw.CourseName,
		Progress: raw.Progress,
		Extra: map[string]string{
			"courseId": raw.CourseID,
			"classId":  raw.ClassID,
		},
		Raw: raw,
	}
}
```

### 4.2 写测试

```go
func TestMapCourse(t *testing.T) {
	raw := agg.MyPlatformCourse{
		CourseID:   "c1",
		CourseName: "软件工程",
		ClassID:    "class-1",
		Progress:   35,
	}
	got := mapCourse(raw)
	if got.ID != "c1" || got.Name != "软件工程" || got.Progress != 35 {
		t.Fatalf("unexpected course: %+v", got)
	}
	if got.Extra["classId"] != "class-1" {
		t.Fatalf("missing classId: %+v", got.Extra)
	}
}
```

### 4.3 测试 Node 映射

```go
func TestMapNode(t *testing.T) {
	raw := agg.MyPlatformNode{
		ID:       "n1",
		Name:     "第一章",
		Type:     "video",
		Duration: 600,
		Progress: 50,
	}
	got := mapNode(raw)
	if got.Kind != core.NodeVideo {
		t.Fatalf("kind = %s", got.Kind)
	}
	if got.Duration != 10*time.Minute {
		t.Fatalf("duration = %v", got.Duration)
	}
}
```

### 4.4 测试 ID 唯一性

```go
func TestNodeIDsAreUnique(t *testing.T) {
	nodes := []core.Node{
		{ID: "video:1:0:a"},
		{ID: "video:1:0:b"},
	}
	seen := map[string]bool{}
	for _, node := range nodes {
		if seen[node.ID] {
			t.Fatalf("duplicate node id: %s", node.ID)
		}
		seen[node.ID] = true
	}
}
```

## 5. 注册测试

在根包 `yatori_test.go` 里：

```go
func TestRegisteredPlatforms(t *testing.T) {
	want := AllPlatforms()
	got := Registered()
	set := map[Platform]bool{}
	for _, p := range got {
		set[p] = true
	}
	for _, p := range want {
		if !set[p] {
			t.Errorf("platform %s not registered", p)
		}
	}
}
```

新增平台时，确保：

- `core/platform.go` 的 `AllPlatforms` 包含它；
- `internal/driver/driver.go` 空导入它；
- adapter 的 `init` 注册它。

## 6. 构造 smoke test

在 `TestNewAllPlatformsSmoke` 里加：

```go
{Platform: yatori.MyPlatform, Account: yatori.Account{Username: "u", Password: "p"}},
```

如果平台需要 URL/School，也要填：

```go
{Platform: yatori.MyPlatform, Account: yatori.Account{Username: "u", Password: "p", URL: "https://example.com"}},
```

## 7. 编译全部包

```bash
go test -run '^$' ./...
```

它会编译所有包和测试，但不执行测试函数。适合在提交前快速检查“有没有编译错误”。

## 8. 单元测试

```bash
go test ./core ./internal/driver/myplatform
```

如果只想跑某个测试：

```bash
go test ./internal/driver/myplatform -run TestMapCourse -v
```

## 9. 竞态测试

适配器有并发逻辑或共享状态时：

```bash
go test -race ./core ./internal/driver/myplatform
```

## 10. 手动联调（可选）

不要把真实账号写进测试文件。用环境变量：

```go
func TestLiveLogin(t *testing.T) {
	if os.Getenv("YATORI_LIVE") != "1" {
		t.Skip("set YATORI_LIVE=1 to run")
	}
	client, err := New(core.Config{
		Platform: core.MyPlatform,
		Account: core.Account{
			Username: os.Getenv("YATORI_ACCOUNT"),
			Password: os.Getenv("YATORI_PASSWORD"),
			URL:      os.Getenv("YATORI_URL"),
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Login(context.Background()); err != nil {
		t.Fatal(err)
	}
}
```

CI 默认跳过；本地需要时：

```bash
set YATORI_LIVE=1
set YATORI_ACCOUNT=...
set YATORI_PASSWORD=...
go test ./internal/driver/myplatform -run TestLiveLogin -v
```

## 11. 测试数据

推荐目录：

```text
internal/driver/myplatform/
├─ adapter.go
├─ adapter_test.go
└─ testdata/
   ├─ course_list.json
   ├─ node_list.json
   └─ work_detail.json
```

要求：

- 脱敏：删除账号、手机号、Cookie、Token、真实姓名；
- 只保留结构；
- 不要提交真实响应中的个人信息；
- 大文件可以裁剪字段。

## 12. 测试检查表

- [ ] `var _ core.Client = (*client)(nil)`
- [ ] `New` 参数校验测试
- [ ] `mapCourse` / `mapNode` 纯函数测试
- [ ] ID 唯一性测试
- [ ] `Progress`/`Duration` 单位测试
- [ ] 根包注册测试
- [ ] `TestNewAllPlatformsSmoke` 增加平台
- [ ] `go test -run '^$' ./...` 通过
- [ ] `go vet ./...` 通过
- [ ] 真实账号信息没有进仓库
