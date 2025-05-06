---
title: Yatori题库对接接口文档
lang: cn
navbar: true
---

# 一、关于Yatori-console外部题库接口说明
Yaotori-console外部题库对接接口主要设计原理是通过Yatori主动访问对应`config.yml`配置文件中`apiQueSetting`下的`url`链接来进行获取你的题库，并且采用POST请求，json请求体。原理也就这么简单。


# 二、如何对接

首先你可以创建一个http服务端供yatori调用，这里我以`go语言`、`java语言`、`python语言`为例。

首先，先看一下Yaotir会发送给你服务端请求的详细信息：
```yml
 # 对应config的配置信息
  apiQueSetting:
    url: "http://localhost:8083"
```

> 请求方式：`POST`

> 请求URL：`http://localhost:8083`（这个链接是例子，记的在config配置文件里面换成你写的服务器端的url：`http://ip:port`）

> 请求体格式：`json`

> 请求体内容样板：
```json
{
  "hash": "",
  "type": "单选题",
  "content": "以下谁是秦代的皇帝？",
  "answer": [],
  "json": ""
}
```
> 以下是对应参数说明：

|参数名称|参数类型|说明|
|--|--|--|
|hash|string|题目的hash值，每个题独一无二|
|type|string|题目类型，有单选、多选、判断、简答|
|content|string|题目问题内容|
|answer|List\<string\>|空，这个一般给的是空的|
|json|string|题目原json数据|

而你需要返回的答案格式也为json数据，以下为样板：
```json
{
  "type": "单选",
  "answers": [
    "秦始皇"
  ]
}
```
以下是对应参数说明：
|参数名称|参数类型|说明|
|--|--|--|
|type|string|题目类型，有单选、多选、判断、简答|
|answers|List\<string\>|这里面填的就是答案内容了，不过注意！！如果选择题或者判断题，那么回答的内容应该是答案的文字，而不是ABC这些东西！！！|


对应服务端代码：

Go:
```go
package main


import (
	"net/http"

	"github.com/gin-gonic/gin"
)
// 这里使用了Gin框架
// Localhost8083Post - 题目请求
func Localhost8083Post(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"hash":    "",
		"type":    "单选题",
		"content": "以下谁是秦代的皇帝？",
		"answer":  []string{},
		"json":    "",
	})
}
```

Java：
```java
//这里使用SpringBoot框架
@Controller
public class HomeController {

    @RequestMapping("/")
    public String index() {
        return "
            {
                \"type\": \"单选\",
                \"answers\": [
                    \"秦始皇\"
                ]
            }
        ";
    }


}
```

Python:
```python
import connexion
import six

from openapi_server import util


def localhost8083_post(body=None):  # noqa: E501
    """题目请求
    这里使用了Flask框架
    """
    return '''
    {
      "type": "单选",
      "answers": [
        "秦始皇"
      ]
    }
    '''

```