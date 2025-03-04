---
title: Yaotri-go-console
lang: cn
navbar: true
---
# Yatori-go-console
Hello，欢迎来到yatori系列yatori-go-console，此项目采用GO语言开发，基于yatori-go-core核心

## 🎯 目前支持平台：

| 平台              | 描述                                   | 状态        |
| ----------------- | -------------------------------------- | ----------- |
| 英华学堂          | 支持暴力模式（会被检测到）             | 已完成 ✅    |
| 仓辉实训          | 支持暴力模式（套壳英华版本会被检测到） | 已完成 ✅    |
| 创能实训          | 支持暴力模式（会被检测到）             | 已完成 ✅    |
| 社会公益课        | 支持暴力模式（会被检测到）             | 已完成 ✅    |
| 重庆工业学院CQIE  | 支持暴力模式（支持秒刷）               | 已完成 ✅    |
| 学习公社（ENAEA） | 无                                     | 已完成 ✅    |
| 学习通            | 支持绕过人脸检测                   | 已完成 ✅    |
| 智慧树            | 无                                     | 开发中 🚧    |
| 学习公社（TTCDW） | 无                                     | 开发中 🚧    |
| 工学云打卡        | （Core已完成待整合）                   | 完成度80% 🚧 |

::: tip
其中`已完成 ✅`指标已最基础的支持视屏学习为基准，`开发中 🚧`代表正在开发中...
:::

## 🚀 下载和使用方式（给小白看的）
### 第一步从官网下载最新版本压缩包
#### 1、Home跳转主页，并点击获取可跳转至github（部分地区可能要梯子）
![](./assets/img/download_1.png)
#### 2、获取最新版本文件
![](./assets/img/download_2.png)
#### 3、下载对应平台压缩包
::: tip
注意：这里框了两个，带linux字眼的是linux系统用的，带windows字眼是windows系统用的，别搞错了
:::
![](./assets/img/download_3.png)

### 第二步解压下载好的最新版本
![](./assets/img/download_4.png)
![](./assets/img/download_5.png)
![](./assets/img/download_6.png)

### 第三步编辑配置文件
1、这里是推荐使用vscode等其他编程软件编辑，当然也可以用文本编辑器。没有文本编辑器的也可以用[网页版在线vscode](https://vscode.dev)
![](./assets/img/download_7.png)
2、将最主要的平台类型以及url链接和账号密码填写好之后保存（其他配置自行参考[配置文件填写说明](#🚀-配置文件填写说明)）
![](./assets/img/download_8.png)

### 第四步启动yatori
![](./assets/img/download_9.png)

如果出现以下大概内容说明成功启动了，之后你只需要挂着就行
![](./assets/img/download_10.png)

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
    logModel: 0 #日志输出模式，0为以视屏提交学时为单位进行日志输出，1为以课程信息为单位进行输出
    ipProxySw: 0 #是否开启IP代理，0代表关闭，1代表开启，开启后一定要子当前启动目录下创建ip.txt这个ip池文件，里面填写对应的代理IP即可，一行一个。注意，代理的IP一定要支持Https
  aiSetting:
    aiType: "TONGYI" #智普：CHATGLM、星火：XINGHUO、通义千问：TONGYI、豆包：DOUBAO、其他模型：OTHER
    aiUrl: "" #默认不填，除非你用的不是上面所指明的AI模型，比如ChatGPT
    model: "" #AI模型，不填则使用yatori默认选择的模型，如果你用的豆包则必填并且填的是接入点ID非模型名称，比如ep-2024xxxxx
    API_KEY: "" #AI平台对应的apikey
users:
  - accountType: "YINGHUA" #平台类型，英华学堂：YINGHUA、仓辉：CANGHUI、学习公社：ENAEA、学习通：XUEXITONG、重庆工业学院：CQIE
    url: "url" #对应平台的url链接,学习公社、CQIE、学习通可以不用填且可以直接把这一行去掉
    account: "账号" #账号
    password: "密码" #密码
    coursesCustom:
      videoModel: 1 #刷视屏模式，0代表不刷，1代表普通模式，2代表暴力模式
      autoExam: 0 #是否自动考试，0代表不考试，1代表考试
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
    ipProxySw: 0
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
      videoModel: 1 # 开启视屏学习
      autoExam: 0 # 关闭AI答题
      examAutoSubmit: 1 # 自动提交试卷
      includeCourses: []
      excludeCourses: []
  - accountType: "CQIE" # 重庆工程学院CQIE
    account: "1888282231" # CQIE和学习公社可以不用url
    password: "114514"
    coursesCustom:
      videoModel: 1 # 开启视屏学习
      autoExam: 0
      examAutoSubmit: 1 # 自动提交试卷
      includeCourses: []
      excludeCourses: []
```


## ❓关于Linux系统版本运行报错问题
* 若出现`error while loading shared libraries: libasound.so.2: cannot open shared object file: No such file or directory`报错
* 此报错是因为Linux未安装音频库造成的，常出现在只有控制台界面的Linux当中，所以只需要安装对应libasound库就行

Ubuntu:
```shell
sudo apt update
sudo apt install libasound2
```

CentOS:
```shell
sudo yum install alsa-lib
```

Arch Linux:
```shell
sudo pacman -S alsa-lib
```