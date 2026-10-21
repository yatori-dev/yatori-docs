# Yatori-go-core 开发手册

这本手册面向两类开发者：

1. **想给 core 增加新平台**：例如新增一个学校的网课平台、一个企业培训平台；
2. **想维护/修复现有平台适配器**：例如接口变了、字段变了、登录流程变了。

阅读完这本手册，你应该能够：

- 理解 V2 的分层和依赖方向；
- 按统一规范新增一个平台适配器；
- 正确实现 `Client` 的每个方法；
- 正确映射 `Course / Node / Work / Exam / Session`；
- 正确使用 `Capabilities()` 和 `ErrUnsupported`；
- 写出不依赖真实账号的测试；
- 按仓库要求提交 PR。

## 先看整体架构

```text
你的业务代码
  └─ yatori.New / yatori.Client          ← 唯一公开入口
       └─ core                            ← 接口、模型、错误、能力位、注册表
            └─ internal/driver/<平台>      ← 你要新增/维护的适配器
                 ├─ internal/aggregation   ← 平台业务动作（旧代码）
                 └─ internal/api           ← 平台 HTTP 协议（旧代码）
```

新增平台时，**不要重写一套 HTTP 协议**。优先复用 `internal/api` 和 `internal/aggregation` 里已有的实现；只有平台完全没有对应能力时，才新增底层代码。

## 七条硬规则

| 规则 | 说明 |
|---|---|
| 1. 公开面最小 | 只允许改 `yatori` 和 `core` 的公开 API；平台细节留在 `internal/` |
| 2. 适配器只做映射 | 不要把平台协议、加密、重试逻辑堆进 adapter |
| 3. 不退出进程 | 新代码禁止 `log.Fatal`、`os.Exit`、`panic` |
| 4. 不依赖全局配置 | 只用 `core.Config`，不要读 `global.Config` |
| 5. 一个 Client 一个会话 | 公开方法必须用 `c.Lock()` 串行化 |
| 6. 能力位必须真实 | 没实现的方法不要设置对应能力位 |
| 7. 必须注册和文档化 | 平台常量、驱动注册、能力矩阵、账号参数、测试都要补齐 |

## 推荐阅读顺序

| 顺序 | 文档 | 你会学到 |
|---|---|---|
| 1 | [架构与分层](/yatori-go-core/dev/architecture) | 每个目录负责什么、依赖方向、注册表怎么工作 |
| 2 | [新增平台完整教程](/yatori-go-core/dev/new-platform) | 从零新增一个平台的可复制步骤 |
| 3 | [Adapter API 规范](/yatori-go-core/dev/adapter-api) | `Login/Courses/Tree/Study/...` 每个方法怎么写 |
| 4 | [数据映射规范](/yatori-go-core/dev/data-mapping) | `Course/Node/ID/Extra/Raw/Progress` 的约定 |
| 5 | [错误与能力位](/yatori-go-core/dev/errors-and-capabilities) | 错误怎么返回、能力位怎么设置 |
| 6 | [测试与验收](/yatori-go-core/dev/testing) | 不依赖真实账号的测试方法 |
| 7 | [代码风格与 PR](/yatori-go-core/dev/style-and-pr) | 命名、文档、提交、评审清单 |
| 8 | [开发常见坑](/yatori-go-core/dev/faq) | 最容易踩的 20 个坑 |

## 最小开发流程

```text
1. 调研平台接口
2. 在 core/platform.go 增加平台常量
3. 在 types.go 增加根包别名
4. 新建 internal/driver/<name>/adapter.go
5. 实现 New / Login / Courses / Tree / Study
6. 按需实现 Works / Exams / SignIn
7. 在 internal/driver/driver.go 注册
8. 写测试
9. 更新 README 和文档
10. gofmt / build / vet / test
```

## 什么时候该新增平台，什么时候该改现有平台

| 情况 | 做法 |
|---|---|
| 新学校、新公司、新域名，但接口和现有平台完全不同 | 新增平台 |
| 现有平台换了域名/登录页，但业务接口没变 | 改现有适配器的 URL/登录逻辑 |
| 现有平台新增了一个任务点类型 | 在现有适配器的 `Tree`/`Study` 里补映射 |
| 现有平台接口字段改名 | 先改 `internal/api`，再改 adapter 映射 |
| 只是业务层想换刷课节奏 | 不要改 core，改调用方的循环 |

## 先记住三个概念

### Adapter

`internal/driver/<平台>` 里的代码。它实现 `core.Client`，把平台数据映射成统一模型。

### Legacy

`internal/api` 和 `internal/aggregation` 里的旧代码。它们仍然是平台行为的“唯一真源”，adapter 尽量复用它们。

### Capability

平台能力的位图。它告诉调用方“这个平台支持什么”，而不是“当前账号有什么数据”。

## 开始之前

建议先读一遍：

- [V2 总览](/yatori-go-core/docs)
- [Client API](/yatori-go-core/v2/client-api)
- [能力与错误](/yatori-go-core/v2/capabilities)

然后从 [架构与分层](/yatori-go-core/dev/architecture) 开始。
