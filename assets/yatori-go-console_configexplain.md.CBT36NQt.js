import{_ as i,c as a,a1 as n,o as l}from"./chunks/framework.EpXtiTQS.js";const c=JSON.parse('{"title":"配置文件说明","description":"","frontmatter":{},"headers":[],"relativePath":"yatori-go-console/configexplain.md","filePath":"yatori-go-console/configexplain.md"}'),t={name:"yatori-go-console/configexplain.md"};function p(e,s,E,h,k,o){return l(),a("div",null,s[0]||(s[0]=[n(`<h1 id="配置文件说明" tabindex="-1">配置文件说明 <a class="header-anchor" href="#配置文件说明" aria-label="Permalink to &quot;配置文件说明&quot;">​</a></h1><h2 id="🚀-配置文件填写说明" tabindex="-1">🚀 配置文件填写说明 <a class="header-anchor" href="#🚀-配置文件填写说明" aria-label="Permalink to &quot;🚀 配置文件填写说明&quot;">​</a></h2><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>注意，配置文件为config.yaml文件，此文件必须要与yatori-go-console在相同目录下才可让程序正常读取到</p></div><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">setting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  basicSetting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    completionTone: 1 #是否开启完成提示音，0为关闭，1为开启</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    colorLog: 1 #是否开启彩色日志，0为关闭，1为开启，如果控制台乱码可以尝试改为0关闭</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logOutFileSw: 1 #是否开启日志文件输出，0为关闭，1为开启</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logLevel: &quot;INFO&quot; #日志类型，一般INFO即可</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logModel: 0 #日志输出模式，0为以视屏提交学时为单位进行日志输出，1为以课程信息为单位进行输出</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    ipProxySw: 0 #是否开启IP代理，0代表关闭，1代表开启，开启后一定要子当前启动目录下创建ip.txt这个ip池文件，里面填写对应的代理IP即可，一行一个。注意，代理的IP一定要支持Https</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  aiSetting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    aiType: &quot;TONGYI&quot; #智普：CHATGLM、星火：XINGHUO、通义千问：TONGYI、豆包：DOUBAO、其他模型：OTHER</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    aiUrl: &quot;&quot; #默认不填，除非你用的不是上面所指明的AI模型，比如ChatGPT</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    model: &quot;&quot; #AI模型，不填则使用yatori默认选择的模型，如果你用的豆包则必填并且填的是接入点ID非模型名称，比如ep-2024xxxxx</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    API_KEY: &quot;&quot; #AI平台对应的apikey</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">users:</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  -</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> accountType: &quot;YINGHUA&quot; #平台类型，英华学堂：YINGHUA、仓辉：CANGHUI、学习公社：ENAEA、学习通：XUEXIT、重庆工业学院：CQIE</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    url: &quot;url&quot; #对应平台的url链接,学习公社和CQIE可以不用填且可以直接把这一行去掉</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    account: &quot;账号&quot; #账号</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    password: &quot;密码&quot; #密码</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    coursesCustom:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      videoModel: 1 #刷视屏模式，0代表不刷，1代表普通模式，2代表暴力模式</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      autoExam: 0 #是否自动考试，0代表不考试，1代表考试</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      examAutoSubmit: 1 #是否考完试自动提交试卷，0代表不自动提交，1代表自动提交</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      includeCourses: []  #include和exclude填一个即可，include代表只有这里面的课程才刷，填课程名称，比如[</span><span style="--shiki-light:#032F62;--shiki-light-text-decoration:underline;--shiki-dark:#DBEDFF;--shiki-dark-text-decoration:underline;">&quot;xxxx&quot;,&quot;xxxx&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]，学习公社填必修课程或者选修课程等</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      excludeCourses: []  #include和exclude填一个即可，exclude代表除了这里面的课程其他都刷，填课程名称，比如[</span><span style="--shiki-light:#032F62;--shiki-light-text-decoration:underline;--shiki-dark:#DBEDFF;--shiki-dark-text-decoration:underline;">&quot;xxxx&quot;,&quot;xxxx&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]，学习公社填必修课程或者选修课程等</span></span></code></pre></div><h2 id="🚀-添加多个账号模板例子" tabindex="-1">🚀 添加多个账号模板例子 <a class="header-anchor" href="#🚀-添加多个账号模板例子" aria-label="Permalink to &quot;🚀 添加多个账号模板例子&quot;">​</a></h2><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">setting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  basicSetting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    completionTone: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    colorLog: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logOutFileSw: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logLevel: &quot;INFO&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    logModel: 0</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    ipProxySw: 0</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  aiSetting:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    aiType: &quot;TONGYI&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    aiUrl: &quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    model: &quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    API_KEY: &quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">users:</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  -</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> accountType: &quot;YINGHUA&quot; # 英华学堂 or 套壳仓辉</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    url: &quot;https://mooc.xxx.com&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    account: &quot;123456&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    password: &quot;114514&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    coursesCustom:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      videoModel: 1 # 开启视屏学习</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      autoExam: 0 # 关闭AI答题</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      examAutoSubmit: 1 # 自动提交试卷</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      includeCourses: []</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      excludeCourses: []</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  -</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> accountType: &quot;CQIE&quot; # 重庆工程学院CQIE</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    account: &quot;1888282231&quot; # CQIE和学习公社可以不用url</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    password: &quot;114514&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    coursesCustom:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      videoModel: 1 # 开启视屏学习</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      autoExam: 0</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      examAutoSubmit: 1 # 自动提交试卷</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      includeCourses: []</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      excludeCourses: []</span></span></code></pre></div>`,6)]))}const d=i(t,[["render",p]]);export{c as __pageData,d as default};
