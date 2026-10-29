# Yatori-go-core V3 总览

Yatori-go-core 是 yatori 系列的 Go 核心库。V3 把多个在线学习平台的登录、课程、章节、学习、作业、考试和签到能力收敛到**同一套公开接口**，第三方项目只需要导入根包 `yatori`，就可以通过同一组方法操作不同平台。

> V3 是仓库内部的重构版本，Go module 路径仍然是 `github.com/yatori-dev/yatori-go-core`，没有 `/v3` 后缀。

::: tip 一句话理解 V3
一个入口 `yatori.New(...)`，一个接口 `yatori.Client`，一套模型 `Course / Node / Work / Exam`；平台不支持的操作返回 `yatori.ErrUnsupported`。
:::

## V3 的核心变化

| 变化 | V3 的做法 |
|---|---|
| 公开入口 | 根包 `yatori`，例如 `yatori.New(...)` |
| 平台差异 | 统一 `Client` 接口 + `Capabilities()` 能力位 |
| 数据模型 | `Course / Node / Work / Exam / Session` 统一模型 |
| 错误处理 | `ErrUnsupported`、`ErrNotLoggedIn`、`ErrInvalidArgument` 等哨兵错误 |
| 旧实现 | `api/*`、`aggregation/*` 已下沉到 `internal/`，不再对外暴露 |
| 全局状态 | 新 SDK 不依赖 `global.Config`、`common.InitConfig` 或 `utils.YatoriCoreInit` |
| 动态调用 | `client.Call(ctx, action, params)` 支持配置驱动 |
| 多平台 | 15 个平台适配器全部注册在根包中 |

## 架构

```text
github.com/yatori-dev/yatori-go-core
├─ yatori.go / types.go / errors.go      # 唯一公开入口（package yatori）
├─ core/                                 # 接口、模型、错误、能力位、动态分发
│  ├─ client.go                          # Client 接口
│  ├─ model.go / request.go              # Course、Node、Work、Exam、StudyRequest...
│  ├─ capability.go                      # Capability 能力位
│  ├─ errors.go                          # ErrUnsupported 等
│  ├─ dispatch.go                        # Call 动态分发
│  └─ registry.go                        # 平台注册表
├─ internal/driver/                      # 各平台适配器（外部不可导入）
│  ├─ xuexitong/ yinghua/ icve/ ...
│  └─ driverutil/                        # 适配器共享工具
├─ internal/api/                         # 底层协议实现（原 api/）
├─ internal/aggregation/                 # 平台业务动作（原 aggregation/）
├─ que-core/                             # AI 题库与标准题目模型
├─ utils/ models/ config/ global/        # 兼容保留
├─ cmd/hello/                            # 原根目录 main.go
└─ examples/                             # 示例与回归测试
```

调用链：

```text
你的代码
  └─ yatori.New / yatori.Client
       └─ core 统一模型与接口
            └─ internal/driver/<平台> 适配器
                 └─ internal/aggregation + internal/api 旧实现
```

## 最小示例

```go
package main

import (
	"context"
	"fmt"

	"github.com/yatori-dev/yatori-go-core"
)

func main() {
	client, err := yatori.New(yatori.Config{
		Platform: yatori.XueXiTong,
		Account: yatori.Account{
			Username: "ACCOUNT",
			Password: "PASSWORD",
		},
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()

	ctx := context.Background()
	if err := client.Login(ctx); err != nil {
		panic(err)
	}

	courses, err := client.Courses(ctx)
	if err != nil {
		panic(err)
	}
	for _, course := range courses {
		fmt.Println(course.ID, course.Name, course.Progress)
	}
}
```

## 文档导航

| 文档 | 内容 |
|---|---|
| [快速开始](/yatori-go-core/v3/getting-started) | 安装、环境、第一个可运行程序、Options 配置 |
| [Client API](/yatori-go-core/v3/client-api) | `Client` 每个方法的签名、参数、返回值和示例 |
| [数据模型](/yatori-go-core/v3/models) | `Course`、`Node`、`Work`、`Exam`、`Session` 等字段说明 |
| [能力与错误](/yatori-go-core/v3/capabilities) | `Capabilities()`、`ErrUnsupported`、平台能力矩阵 |
| [会话与持久化](/yatori-go-core/v3/session) | Cookie/Token、会话保存与恢复、重登 |
| [AI 与题库](/yatori-go-core/v3/ai-and-question-bank) | `AIConfig`、`QuestionBankConfig`、`AnswerSource` |
| [平台说明](/yatori-go-core/v3/platforms) | 15 个平台的账号参数、能力和注意事项 |
| [动态调用](/yatori-go-core/v3/dynamic-call) | `Call(action, params)` 的 Action 与参数表 |
| [完整示例](/yatori-go-core/v3/examples) | 登录 → 课程 → 章节 → 学习 → 作业 → 考试 |
| [V2 迁移 V3](/yatori-go-core/v3/migration-v2-to-v3) | 旧 `api`/`aggregation` 代码如何迁移 |
| [常见问题](/yatori-go-core/v3/faq) | 登录、验证码、代理、AI、资源目录、并发等 |

## 开发手册

如果你是 core 的贡献者，或者想新增/维护平台适配器，请阅读开发手册：

- [开发手册总览](/yatori-go-core/dev/)
- [架构与分层](/yatori-go-core/dev/architecture)
- [新增平台完整教程](/yatori-go-core/dev/new-platform)
- [Adapter API 规范](/yatori-go-core/dev/adapter-api)
- [数据映射规范](/yatori-go-core/dev/data-mapping)
- [错误与能力位](/yatori-go-core/dev/errors-and-capabilities)
- [测试与验收](/yatori-go-core/dev/testing)
- [代码风格与 PR](/yatori-go-core/dev/style-and-pr)
- [开发常见坑](/yatori-go-core/dev/faq)

## 支持平台

| 平台常量 | 平台 | 主要能力 |
|---|---|---|
| `yatori.XueXiTong` | 超星学习通 | 登录、Cookie、课程、章节、学习、作业、考试 |
| `yatori.YingHua` | 英华学堂 | 登录、课程、节点、学习、作业、考试 |
| `yatori.ICVE` | 智慧职教 / 职教云 | 登录、Cookie、课程、节点、学习 |
| `yatori.CQIE` | 重庆工程学院 | 登录、Token、课程、视频、学习 |
| `yatori.ENAAE` | 中国教育干部网络学院 | 登录、Cookie、项目/课程、视频、学习、考试列表 |
| `yatori.WeLearn` | WeLearn 随行课堂 | 登录、Cookie、课程、章节、学习 |
| `yatori.QSXT` | 青书学堂 | 登录、Token、课程、节点、学习、作业 |
| `yatori.TTCDW` | TTCDW | 登录、Cookie、项目/课堂/课程、视频、学习 |
| `yatori.Ketangx` | 课堂行 | 登录、课程、节点、学习 |
| `yatori.HaiQiKeJi` | 海旗科技（ZXCPKS） | 登录、课程、节点、学习、作业、考试 |
| `yatori.WeiBan` | 安全微伴 | 登录 |
| `yatori.CELA` | CELA | 登录 |
| `yatori.MOOC` | 中国大学 MOOC | 登录 |
| `yatori.ZhiHuiShu` | 智慧树 | 扫码登录 |
| `yatori.GongXue` | 工学云 | 签到 |

::: warning 平台能力并不完全相同
统一接口不代表每个平台都支持所有方法。调用前请先看 [能力与错误](/yatori-go-core/v3/capabilities)，或使用 `yatori.Supports(client, yatori.CapWorks)` 判断。
:::

## 下一步

- 第一次使用：从 [快速开始](/yatori-go-core/v3/getting-started) 开始。
- 已经用过旧版：直接看 [V2 迁移 V3](/yatori-go-core/v3/migration-v2-to-v3)。
- 要做配置驱动或 Web 后端：看 [动态调用](/yatori-go-core/v3/dynamic-call)。
- 要查某个平台怎么填账号：看 [平台说明](/yatori-go-core/v3/platforms)。
