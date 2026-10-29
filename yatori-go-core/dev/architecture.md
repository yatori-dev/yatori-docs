# 架构与分层

理解分层是开发 core 的第一步。V3 的目标是：**公开面稳定、平台实现可替换、旧代码可复用**。

## 目录结构

```text
yatori-go-core/
├─ yatori.go / types.go / errors.go      # package yatori：唯一公开入口
├─ core/                                 # 公开契约层
│  ├─ client.go                          # Client 接口
│  ├─ model.go / request.go              # 统一数据模型
│  ├─ capability.go                      # 能力位
│  ├─ errors.go                          # 哨兵错误 + *Error
│  ├─ dispatch.go                        # Call 动态分发
│  ├─ registry.go                        # 平台注册表
│  ├─ platform.go                        # 平台常量、别名、描述
│  └─ account.go                         # Config、Account、Options、Session
├─ internal/driver/                      # 适配器层（外部不可导入）
│  ├─ driver.go                          # 注册所有适配器
│  ├─ driverutil/                        # 适配器共享工具
│  └─ <platform>/adapter.go              # 每个平台一个包
├─ internal/api/                         # 协议层（旧 api/）
├─ internal/aggregation/                 # 业务动作层（旧 aggregation/）
├─ que-core/                             # AI 题库、标准题目模型
├─ models/                               # 枚举（ctype 等）
├─ utils/                                # 工具（HTTP、图片、日志、资源）
├─ config/ global/ common/               # 旧配置兼容层（Deprecated）
├─ cmd/hello/                            # 原 main.go
└─ examples/                             # 示例与旧测试
```

## 每一层负责什么

### 1. 根包 `yatori`

职责：

- 暴露 `New`、`Call`、`Supports`、`Flatten` 等函数；
- 用类型别名重新导出 `core` 的类型和常量；
- 通过空导入 `internal/driver` 触发所有适配器注册。

示例：

```go
// yatori.go
import _ "github.com/yatori-dev/yatori-go-core/internal/driver"

func New(cfg Config) (Client, error) {
	return core.New(cfg)
}
```

根包**不实现平台逻辑**，只做门面。

### 2. `core`

职责：

- 定义 `Client` 接口；
- 定义 `Course/Node/Work/Exam/Session` 等统一模型；
- 定义 `Capability`、`ErrUnsupported` 等契约；
- 提供平台注册表 `Register/New`；
- 提供动态分发 `Call`。

`core` **不能导入**：

- `internal/driver`；
- `internal/api`；
- `internal/aggregation`；
- 根包 `yatori`。

否则会形成循环依赖。

### 3. `internal/driver/<platform>`

职责：

- 实现 `core.Client`；
- 把 `internal/aggregation` / `internal/api` 的结果映射成 `core` 模型；
- 处理平台登录、Cookie/Token、会话快照；
- 声明能力位；
- 在 `init()` 里注册自己。

适配器**可以导入**：

- `core`；
- `driverutil`；
- `internal/api/<platform>`；
- `internal/aggregation/<platform>`；
- `models/ctype`；
- `que-core/*`；
- `utils`（只在必要时）。

适配器**不应该导入**：

- 根包 `yatori`；
- 其他平台的 adapter；
- `global.Config`；
- 新的全局变量。

### 4. `internal/api/<platform>`

职责：

- 负责平台 HTTP 协议、加密、签名、请求重试；
- 返回原始 JSON 字符串或平台结构体；
- 不感知 `core` 模型。

这一层是旧代码，新增平台时可以复用，也可以按需扩展。

### 5. `internal/aggregation/<platform>`

职责：

- 在 `api` 之上做业务动作，例如“拉课程列表”“进入作业”“提交学时”；
- 处理平台业务状态、分页、HTML 解析；
- 仍然返回平台结构体或裸 JSON。

这一层也是旧代码。**适配器不要重复实现这里的逻辑**，除非旧代码确实无法复用。

### 6. `que-core`

职责：

- AI 调用；
- 标准题目模型；
- 外部题库协议；
- 题目相似度匹配。

适配器在 `DoWork` / `DoExam` 里通过 `internal/aggregation` 间接使用它，不需要直接改。

## 依赖方向

```text
yatori (root)
  ├─ core
  └─ internal/driver
       ├─ core
       ├─ driverutil
       ├─ internal/aggregation/<platform>
       │    └─ internal/api/<platform>
       └─ utils / models / que-core
```

规则：

- **只能向下依赖**，不能反向依赖；
- `core` 不知道任何具体平台；
- `internal/api` 不知道 `driver`；
- `internal/aggregation` 不知道 `driver`；
- 根包只依赖 `core` 和 `driver` 的注册副作用。

## 注册表如何工作

### 1. 适配器注册

每个适配器在 `init()` 里调用：

```go
func init() {
	core.Register(core.XueXiTong, New)
}
```

`core.Register` 会把平台常量映射到构造函数。

### 2. 根包触发注册

`internal/driver/driver.go` 空导入所有适配器：

```go
import (
	_ "github.com/yatori-dev/yatori-go-core/internal/driver/xuexitong"
	_ "github.com/yatori-dev/yatori-go-core/internal/driver/yinghua"
	// ...
)
```

根包再空导入 `internal/driver`：

```go
import _ "github.com/yatori-dev/yatori-go-core/internal/driver"
```

这样用户只导入根包，所有平台就自动注册了。

### 3. 创建客户端

```go
client, err := yatori.New(yatori.Config{
	Platform: yatori.XueXiTong,
	Account:  yatori.Account{...},
})
```

内部流程：

```text
yatori.New
  └─ core.New
       ├─ cfg.Validate()
       ├─ cfg.Options.Resolve()
       ├─ registry[cfg.Platform]
       └─ factory(cfg) → adapter.New(cfg) → core.Client
```

如果平台没有注册，`core.New` 会返回：

```text
yatori: <PLATFORM>: new: no adapter registered for platform
```

## 一次调用的完整链路

以 `client.Courses(ctx)` 为例：

```text
业务代码
  └─ adapter.Courses(ctx)
       ├─ c.Lock()
       ├─ 检查 loggedIn
       ├─ aggregation.PullCourseList(cache)
       ├─ 映射成 []core.Course
       └─ 返回
```

以 `client.Study(ctx, req)` 为例：

```text
业务代码
  └─ adapter.Study(ctx, req)
       ├─ c.Lock()
       ├─ 从 req.Node.Raw 或缓存取平台 DTO
       ├─ 根据 req.Action / req.Mode 选择平台接口
       ├─ 调用 aggregation/api
       └─ 组装 core.StudyResult
```

## 公开与内部的边界

| 内容 | 是否公开 | 说明 |
|---|---|---|
| `yatori.New` | ✅ | 唯一创建入口 |
| `yatori.Client` | ✅ | 唯一调用接口 |
| `core.Course/Node/...` | ✅ | 统一模型 |
| `core.Capability` | ✅ | 能力位 |
| `core.ErrUnsupported` | ✅ | 错误契约 |
| `internal/driver/*` | ❌ | 实现细节 |
| `internal/api/*` | ❌ | 协议细节 |
| `internal/aggregation/*` | ❌ | 业务动作细节 |
| `config/global/common` | ⚠️ | 兼容保留，Deprecated |

::: warning 为什么适配器必须放在 internal
适配器会直接依赖旧 `api` / `aggregation`。如果把它们公开，外部用户会绕过 `Client` 直接调用，导致 V3 的统一接口失去意义，也会让后续重构变得困难。
:::

## 新增平台时应该改哪些文件

| 文件 | 是否必须 | 说明 |
|---|---|---|
| `core/platform.go` | ✅ | 平台常量、描述、别名、`AllPlatforms` |
| `types.go` | ✅ | 根包常量别名 |
| `internal/driver/<name>/adapter.go` | ✅ | 适配器实现 |
| `internal/driver/driver.go` | ✅ | 空导入注册 |
| `yatori_test.go` | ✅ | 构造函数 smoke test |
| `README.md` | ✅ | 平台能力表 |
| `yatori-docs` 的 `docs.md` / `v3/platforms.md` / `v3/capabilities.md` | ✅ | 文档 |
| `internal/api/<name>` / `internal/aggregation/<name>` | 按需 | 只有旧代码不存在时才新增 |

## 设计取舍

### 为什么适配器不直接返回平台类型？

因为调用方不想为每个平台写一套类型断言。统一模型是 V3 的核心价值。

### 为什么保留 `Raw`？

有些平台字段无法完全抽象，或者调用方需要平台特有逻辑。`Raw` 提供逃生通道，但它不能序列化。

### 为什么 `Study` 不做成自动完成？

平台节奏、风控、验证码、人脸策略差异太大。V3 把节奏交给调用方，适配器只负责“一次学习动作”。

### 为什么平台能力要用位图？

位图可以在一个 `uint32` 里表达多个能力，判断成本低，也方便未来扩展。

## 下一步

- 动手新增平台：[新增平台完整教程](/yatori-go-core/dev/new-platform)
- 查看每个方法怎么写：[Adapter API 规范](/yatori-go-core/dev/adapter-api)
- 查看字段约定：[数据映射规范](/yatori-go-core/dev/data-mapping)
