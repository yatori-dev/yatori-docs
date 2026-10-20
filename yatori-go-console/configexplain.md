# 配置文件说明
## 🚀 配置文件填写说明
::: tip
注意，配置文件为config.yaml文件，此文件必须要与yatori-go-console在相同目录下才可让程序正常读取到
:::
```markdown
setting:
  basicSetting:
    completionTone: 1 #是否开启完成提示音，0为关闭，1为开启
    colorLog: 1 #是否开启彩色日志，0为关闭，1为开启，如果控制台乱码可以尝试改为0关闭
    logOutFileSw: 1 #是否开启日志文件输出，0为关闭，1为开启
    logLevel: "INFO" #日志类型，一般INFO即可
    logModel: 0 #日志输出模式，0为以视频提交学时为单位进行日志输出，1为以课程信息为单位进行输出
  aiSetting:
    aiType: "TONGYI" #智普：CHATGLM、星火：XINGHUO、通义千问：TONGYI、豆包：DOUBAO、其他模型：OTHER
    aiUrl: "" #默认不填，除非你用的不是上面所指明的AI模型，比如ChatGPT
    model: "" #AI模型，不填则使用yatori默认选择的模型，如果你用的豆包则必填并且填的是接入点ID非模型名称，比如ep-2024xxxxx
    API_KEY: "" #AI平台对应的apikey
users:
  - accountType: "YINGHUA" #平台类型，英华学堂：YINGHUA、仓辉：CANGHUI、学习公社：ENAEA、学习通：XUEXITONG、重庆工业学院：CQIE、智慧职教：ICVE、随行课堂：WELEARN、青书学堂：QSXT、码上研训：KETANGX、海旗科技：HQKJ
    url: "url" #对应平台的url链接，英华学堂、海旗科技必填；学习公社和CQIE可以不用填且可以直接把这一行去掉
    account: "账号" #账号
    password: "密码" #密码
    isProxy: 0 #是否开启该账号IP代理，0为关闭，1为开启（开启后需在同目录创建ip.txt，一行一个代理地址）
    coursesCustom:
      videoModel: 1 #刷视频模式，0代表不刷，1代表普通模式，2代表暴力模式
      autoExam: 0 #自动答题模式：0=不答题，1=AI答题，2=外置题库答题（海旗为内置标答答题），3=学习通内置AI
      examAutoSubmit: 1 #是否考完试自动提交试卷，0代表不自动提交，1代表自动提交
      includeCourses: []  #include和exclude填一个即可，include代表只有这里面的课程才刷，填课程名称，比如["xxxx","xxxx"]，学习公社填必修课程或者选修课程等
      excludeCourses: []  #include和exclude填一个即可，exclude代表除了这里面的课程其他都刷，填课程名称，比如["xxxx","xxxx"]，学习公社填必修课程或者选修课程等
```





## 🚀 添加多个账号模板例子

```markdown
setting:
  basicSetting:
    completionTone: 1
    colorLog: 1
    logOutFileSw: 1
    logLevel: "INFO"
    logModel: 0
  aiSetting:
    aiType: "TONGYI"
    aiUrl: ""
    model: ""
    API_KEY: ""
users:
  - accountType: "YINGHUA" # 英华学堂 or 套壳仓辉
    url: "https://mooc.xxx.com"
    account: "123456"
    password: "114514"
    coursesCustom:
      videoModel: 1 # 开启视频学习
      autoExam: 0 # 关闭AI答题
      examAutoSubmit: 1 # 自动提交试卷
      includeCourses: []
      excludeCourses: []
  - accountType: "CQIE" # 重庆工程学院CQIE
    account: "1888282231" # CQIE和学习公社可以不用url
    password: "114514"
    coursesCustom:
      videoModel: 1 # 开启视频学习
      autoExam: 0
      examAutoSubmit: 1 # 自动提交试卷
      includeCourses: []
      excludeCourses: []
```

## 🚀 海旗科技（HQKJ）自动答题配置

海旗科技在视频秒刷的基础上，支持作业和考试的自动答题，`autoExam` 取值如下：

| autoExam | 模式 | 说明 |
| --- | --- | --- |
| 0 | 不答题 | 只刷视频 |
| 1 | AI 答题 | 优先使用平台随题返回的内置标答，缺失时才调用 AI 补答 |
| 2 | 内置标答答题 | 只使用平台随题返回的内置标答自动填写，完全不调用 AI |

::: tip
- 海旗账号必须填写 `url`，值为学校平台域名（如 `https://xxx.haiqikeji.com`）。
- 作业和考试会在视频学习结束后一并处理，无需额外开关；已完成的会自动跳过。
- `examAutoSubmit: 1` 为答完自动交卷，`0` 为只提交答案不交卷。
- `autoExam: 2` 不依赖 `aiSetting`，无需配置 AI 和 `API_KEY`；没有标答的题目会自动跳过。
:::

```yaml
users:
  - accountType: "HQKJ"
    url: "https://xxx.haiqikeji.com"
    account: "账号"
    password: "密码"
    coursesCustom:
      videoModel: 2 # 海旗秒刷模式
      autoExam: 1 # 1=AI答题；2=仅内置标答答题（不调用AI）
      examAutoSubmit: 1 # 1=答完自动交卷，0=只提交不交卷
      includeCourses: []
      excludeCourses: []
```
