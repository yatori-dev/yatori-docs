# Yatori-go-core


## 🎯 目前支持平台：

| 平台             | 描述                         | 状态        |
|----------------|----------------------------| ----------- |
| 英华学堂           | 支持暴力模式（会被检测到）              | 已完成 ✅    |
| 仓辉实训           | 支持暴力模式（套壳英华版本会被检测到）        | 已完成 ✅    |
| 创能实训           | 支持暴力模式（会被检测到）              | 已完成 ✅    |
| 社会公益课          | 支持暴力模式（会被检测到）              | 已完成 ✅    |
| 重庆工业学院CQIE     | 支持暴力模式（支持秒刷）               | 已完成 ✅    |
| 学习公社（ENAEA）    | 支持暴力模式（倍速刷）                | 已完成 ✅    |
| 大学生网络党校（ENAEA） | 支持暴力模式（倍速刷）                | 已完成 ✅    |
| 中小学网络党校（ENAEA） | 支持暴力模式（倍速刷）                | 已完成 ✅    |
| 学习通            | 支持绕过人脸认证，支持暴力模式（暴力模式大概率打回） | 已完成 ✅    |
| 海旗科技（HQKJ）    | 支持秒刷，作业/考试支持 AI 答题与内置标答答题 | 已完成 ✅    |
| 码上研训           | 默认秒刷                       | 已完成 ✅    |
| MOOC           | 无                          | 开发中 🚧    |
| 智慧树            | 无                          | 开发中 🚧    |
| 学习公社（TTCDW）    | 无                          | 开发中 🚧    |
| 工学云打卡        | （Core已完成待整合）                   | 已完成 ✅ |

::: tip
其中`已完成 ✅`指标已最基础的支持视频学习为基准，`开发中 🚧`代表正在开发中...
注:以上为core核心开发进度
:::

## 关于core

core是专门给开发使用的，所有核心代码都在这里面，详细代码如何调用可参考examples内的test例子，有问题可加群讨论。

## 海旗科技（HQKJ）自动答题接口

海旗的作业/考试答题逻辑已收敛到 core，console 只负责把配置转换成入参：

```go
// AI答题：优先使用平台随题返回的内置标答，缺失时才调用AI
hqkj.HqkjAutoAnswerAction(cache, course, nodeList, setting)

// 内置标答答题：只使用平台随题返回的标答，不调用AI
hqkj.HqkjAutoFillBuiltinAnswerAction(cache, course, nodeList, setting)
```

`HqkjAnswerSetting` 主要字段：

| 字段 | 说明 |
| --- | --- |
| AccountType / Account | 日志展示用的平台名与账号 |
| AutoExam | 0=不答题，1=AI答题（仅 `HqkjAutoAnswerAction` 使用；内置标答接口忽略） |
| ExamAutoSubmit | 0=只提交答案不交卷，1=自动交卷 |
| AiSetting | AI 配置（内置标答接口忽略） |

`HqkjAutoFillBuiltinAnswerAction` 返回 `[]HqkjQuizAnswerResult`，包含 `total / submitted / skipped / failed / finished` 统计，便于外部对接直接序列化使用。
