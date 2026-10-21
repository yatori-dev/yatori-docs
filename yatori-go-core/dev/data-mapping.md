# 数据映射规范

适配器的核心工作只有一件事：**把平台数据映射成 V2 统一模型**。映射质量直接决定调用方体验。

## 1. Course 映射

```go
type Course struct {
	ID       string
	Name     string
	Teacher  string
	Cover    string
	Progress float64
	Status   CourseStatus
	Extra    map[string]string
	Raw      any
}
```

### 1.1 ID

要求：

- 稳定：同一门课每次拉取 ID 一致；
- 唯一：不同课程不能冲突；
- 不透明：调用方不会解析 ID 内部格式。

推荐：

```go
ID: item.CourseID
```

如果平台课程 ID 只在“项目/课堂”内唯一，需要组合：

```go
ID: fmt.Sprintf("%s:%s:%s", projectID, classroomID, courseID)
```

例如 TTCDW：

```go
id := fmt.Sprintf("%s:%s:%s:%s", project.CourseProjectId, classRoom.SegmentId, classRoom.ItemId, course.CourseId)
```

### 1.2 Extra

`Extra` 必须包含 `Tree` 需要的全部平台 ID。常见字段：

| 字段 | 用途 |
|---|---|
| `courseId` | 平台课程 ID |
| `classId` | 班级/课堂 ID |
| `cpi` | 学习通课程位置参数 |
| `key` | 学习通 classId |
| `courseInfoId` | 职教云课程信息 ID |
| `semesterId` | 青书学期 ID |
| `schoolId` | 学校 ID |
| `studentCourseId` | CQIE 学生课程 ID |
| `circleId` | ENAAE 项目 ID |
| `projectId` | TTCDW 项目 ID |
| `itemId` | TTCDW 课堂项 ID |
| `segmentId` | TTCDW 分段 ID |

写法：

```go
Extra: map[string]string{
	"courseId":     item.CourseID,
	"classId":      item.ClassID,
	"courseInfoId": item.CourseInfoID,
},
```

### 1.3 Raw

```go
Raw: item
```

或指针：

```go
Raw: &item
```

要求：

- `Tree` / `Study` 能通过类型断言取回；
- 同一种平台类型保持一致（要么都值，要么都指针）；
- 不要混用。

### 1.4 Progress

统一 0–100：

```go
Progress: item.Progress // 平台本身就是 0-100
```

如果平台是 0–1：

```go
Progress: item.Progress * 100
```

如果平台是字符串：

```go
progress, _ := strconv.ParseFloat(item.Progress, 64)
```

### 1.5 Status

```go
func mapCourseStatus(raw string) core.CourseStatus {
	switch raw {
	case "0":
		return core.CourseStatusNotStarted
	case "1":
		return core.CourseStatusActive
	case "3":
		return core.CourseStatusFinished
	default:
		return core.CourseStatusUnknown
	}
}
```

不要把平台原始状态直接塞进 `CourseStatus`，除非它已经是统一值。

---

## 2. Node 映射

```go
type Node struct {
	ID        string
	ParentID  string
	CourseID  string
	Name      string
	Kind      NodeKind
	Duration  time.Duration
	Progress  float64
	Completed bool
	Children  []Node
	Extra     map[string]string
	Raw       any
}
```

### 2.1 ID 规则

推荐格式：

```text
<kind>:<platform-id>:<sub-id>
```

例如：

```go
ID: fmt.Sprintf("video:%d:%d:%s", item.KnowledgeID, item.CardIndex, item.ObjectID)
```

要求：

- 同一课程内唯一；
- 不同课程之间也尽量唯一；
- 不包含会变化的时间戳/随机数；
- 不要用切片索引作为唯一 ID（顺序可能变）。

### 2.2 Kind 映射

```go
func mapNodeKind(raw string) core.NodeKind {
	switch strings.ToLower(raw) {
	case "video", "mp4":
		return core.NodeVideo
	case "audio", "mp3":
		return core.NodeAudio
	case "document", "pdf", "doc", "docx", "ppt", "pptx":
		return core.NodeDocument
	case "live":
		return core.NodeLive
	case "bbs", "discussion":
		return core.NodeBBS
	case "link", "hyperlink":
		return core.NodeLink
	case "work", "homework":
		return core.NodeWork
	case "exam", "quiz":
		return core.NodeExam
	case "chapter":
		return core.NodeChapter
	default:
		return core.NodeUnknown
	}
}
```

识别不了用 `NodeUnknown`，不要随便猜成 `NodeVideo`，否则调用方会按视频逻辑处理。

### 2.3 Duration

统一 `time.Duration`：

- 平台是秒：`driverutil.Seconds(n)`
- 平台是毫秒：`time.Duration(n) * time.Millisecond`
- 平台是 `"12:34"`：先解析成秒，再 `driverutil.Seconds`

```go
Duration: driverutil.Seconds(item.DurationSeconds)
```

### 2.4 Progress

统一 0–100：

```go
Progress: item.Progress
```

如果平台是 0–1：

```go
Progress: item.Progress * 100
```

### 2.5 Completed

优先使用平台字段：

```go
Completed: item.IsPassed
```

没有完成字段时，用进度判断：

```go
Completed: item.Duration > 0 && item.Position >= item.Duration
```

不要凭空把 `Completed` 设为 `true`。

### 2.6 层级

有层级：

```go
chapter := core.Node{
	ID:       "chapter:" + item.ID,
	CourseID: course.ID,
	Name:     item.Name,
	Kind:     core.NodeChapter,
}
for _, point := range item.Points {
	chapter.Children = append(chapter.Children, core.Node{
		ID:       point.ID,
		ParentID: chapter.ID,
		CourseID: course.ID,
		Name:     point.Name,
		Kind:     mapNodeKind(point.Type),
		Raw:      point,
	})
}
```

没有层级：

```go
out = append(out, core.Node{...})
```

### 2.7 Extra

`Extra` 必须让 `Study` 能重建平台 DTO。常见字段：

| 字段 | 用途 |
|---|---|
| `nodeId` | 平台节点 ID |
| `knowledgeId` | 学习通章节 ID |
| `cardIndex` | 学习通卡片索引 |
| `objectId` | 学习通视频/文档对象 ID |
| `jobId` | 学习通任务点 ID |
| `chapterId` | 章节 ID |
| `unitId` | CQIE 单元 ID |
| `videoId` | 视频 ID |
| `segmentId` | TTCDW 分段 ID |
| `duration` | 总时长（秒） |

---

## 3. Work / Exam 映射

### 3.1 Work

```go
core.Work{
	ID:            item.WorkID,
	CourseID:      course.ID,
	Name:          item.Title,
	Status:        item.Status,
	Deadline:      item.EndTime,
	QuestionCount: item.QuestionCount,
	Extra: map[string]string{
		"workId":   item.WorkID,
		"courseId": item.CourseID,
		"classId":  item.ClassID,
	},
	Raw: item,
}
```

### 3.2 Exam

```go
core.Exam{
	ID:            item.ExamID,
	CourseID:      course.ID,
	Name:          item.Title,
	Status:        item.Status,
	StartAt:       item.StartTime,
	EndAt:         item.EndTime,
	Duration:      time.Duration(item.LimitMinutes) * time.Minute,
	QuestionCount: item.QuestionCount,
	Extra: map[string]string{
		"examId":   item.ExamID,
		"courseId": item.CourseID,
	},
	Raw: item,
}
```

### 3.3 Raw 的类型

`Works` 里存入 `Raw` 的对象，`DoWork` 必须能断言回来：

```go
// Works
c.works[item.WorkID] = item
out = append(out, core.Work{..., Raw: item})

// DoWork
work, ok := req.Work.Raw.(*agg.Work)
if !ok || work == nil {
	work = c.works[req.Work.ID]
}
```

建议统一使用指针，避免大结构体复制。

---

## 4. Session 映射

```go
core.Session{
	Platform: core.MyPlatform,
	Account:  c.cache.Account,
	UserID:   c.cache.UserID,
	Cookie:   driverutil.CookieHeader(c.cache.Cookies),
	Token:    c.cache.Token,
	Extra: map[string]string{
		"schoolId": c.cache.SchoolID,
	},
}
```

规则：

- `Cookie` 是请求头格式的字符串，不是 `[]*http.Cookie`；
- `Token` 是平台 token；
- `Extra` 只放字符串；
- 不要把整个 cache 放进去。

---

## 5. 多级平台映射示例

### 5.1 单层：英华

```text
Course → Node(video/document/work/exam)
```

映射：

```go
Course.ID = course.Id
Node.ID = node.Id
Node.ParentID = ""
```

### 5.2 两层：学习通

```text
Course → Chapter → Point
```

映射：

```go
Chapter.ID = "chapter:" + knowledge.ID
Point.ID = "video:" + knowledgeID + ":" + cardIndex + ":" + objectID
Point.ParentID = Chapter.ID
```

### 5.3 三层：TTCDW

```text
Project → ClassRoom → Course → Video
```

映射策略：

- `Courses` 阶段把 `Project/ClassRoom/Course` 扁平化成 `core.Course`；
- `Course.ID` 用 `project:segment:item:course` 组合；
- `Course.Extra` 保存所有层级 ID；
- `Tree` 只返回 `Course` 下的视频节点。

### 5.4 项目制：ENAAE

```text
Project(Circle) → Course → Video
```

映射策略：

- `Courses` 遍历所有项目，聚合课程；
- `Course.ID` 用 `circleId:courseId` 组合；
- `Course.Extra` 保存 `circleId`、`courseId`、`syllabusId`。

---

## 6. 反模式

### ❌ 用课程名当 ID

```go
ID: item.Name
```

同名课程会冲突，改名后 ID 变化。

### ❌ 用切片索引当 ID

```go
ID: strconv.Itoa(index)
```

章节顺序变化后，ID 指向错误节点。

### ❌ Progress 单位混用

```go
Progress: 0.5   // 调用方以为是 0.5%
Progress: 50    // 调用方以为是 50%
```

统一 0–100。

### ❌ Duration 单位混用

```go
Duration: time.Duration(item.DurationMillis) // 把毫秒当纳秒
```

使用 `time.Millisecond` 或 `driverutil.Seconds`。

### ❌ Extra 缺字段

```go
Extra: map[string]string{"name": item.Name}
```

`Tree` 需要的是平台 ID，不是名称。

### ❌ Raw 混用值和指针

```go
// Courses 存值
Raw: item
// Tree 断言指针
raw, ok := course.Raw.(*Course)
```

统一一种形式。

### ❌ 把 Raw 序列化

```go
json.Marshal(course.Raw) // 平台对象通常不可序列化或不稳定
```

持久化只保存 `Extra`。

---

## 7. 映射检查表

- [ ] `Course.ID` 稳定且唯一
- [ ] `Course.Extra` 足够 `Tree` 使用
- [ ] `Course.Progress` 0–100
- [ ] `Course.Status` 使用统一枚举
- [ ] `Node.ID` 稳定且唯一
- [ ] `Node.ParentID` 正确
- [ ] `Node.Kind` 尽量准确
- [ ] `Node.Duration` 单位正确
- [ ] `Node.Progress` 0–100
- [ ] `Node.Completed` 来自平台或时长判断
- [ ] `Node.Extra` 足够 `Study` 使用
- [ ] `Work/Exam.Raw` 可被 `DoWork/DoExam` 断言
- [ ] `Session` 只包含字符串和基本类型
