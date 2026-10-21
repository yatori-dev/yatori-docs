# 数据模型

V2 用一套平台无关的模型描述所有平台的数据。你只需要认识这些类型，就可以操作所有平台。

::: tip 最重要的两个字段
`Raw`：平台原始对象，进程内使用，**不能 JSON 序列化**。  
`Extra`：平台 ID 的字符串映射，**可以序列化**，适合存数据库或跨进程传递。
:::

## Course 课程

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

| 字段 | 说明 |
|---|---|
| `ID` | 平台内课程 ID，作为 `Tree` / `Study` 的入口 |
| `Name` | 课程名称 |
| `Teacher` | 教师，可能为空 |
| `Cover` | 封面 URL，可能为空 |
| `Progress` | 0–100 的进度 |
| `Status` | `not_started` / `active` / `finished` |
| `Extra` | 平台需要的二级 ID，例如 `cpi`、`key`、`courseId`、`circleId` |
| `Raw` | 平台原始对象 |

常见 `Extra`：

| 平台 | 关键字段 |
|---|---|
| XUEXITONG | `cpi`、`key`、`classId`、`courseDataId`、`contentId` |
| YINGHUA | `mode`、`startDate`、`endDate` |
| ICVE | `courseInfoId`、`id`、`courseId` |
| CQIE | `studentCourseId`、`coursewareId`、`version` |
| ENAAE | `circleId`、`courseId`、`syllabusId` |
| QSXT | `semesterId`、`classId`、`schoolId`、`courseId` |
| TTCDW | `projectId`、`orgId`、`itemId`、`segmentId`、`courseId` |
| WELEARN | `cid`、`uid`、`classId` |
| 其他 | 见各平台适配器 |

## CourseStatus

```go
const (
	CourseStatusUnknown    CourseStatus = ""
	CourseStatusNotStarted CourseStatus = "not_started"
	CourseStatusActive     CourseStatus = "active"
	CourseStatusFinished   CourseStatus = "finished"
)
```

## Node 节点

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

| 字段 | 说明 |
|---|---|
| `ID` | 节点 ID，`Study` 用它定位 |
| `ParentID` | 父节点 ID |
| `CourseID` | 所属课程 |
| `Name` | 节点名称 |
| `Kind` | 节点类型 |
| `Duration` | 总时长，未知时为 0 |
| `Progress` | 0–100 |
| `Completed` | 平台标记的完成状态 |
| `Children` | 子节点；为空表示叶子节点 |
| `Extra` | 平台 ID，例如 `knowledgeId`、`cardIndex`、`objectId` |
| `Raw` | 平台原始节点对象 |

### NodeKind

```go
const (
	NodeChapter  NodeKind = "chapter"
	NodeVideo    NodeKind = "video"
	NodeAudio    NodeKind = "audio"
	NodeDocument NodeKind = "document"
	NodeLive     NodeKind = "live"
	NodeBBS      NodeKind = "bbs"
	NodeLink     NodeKind = "link"
	NodeWork     NodeKind = "work"
	NodeExam     NodeKind = "exam"
	NodeUnknown  NodeKind = "unknown"
)
```

注意：并不是所有平台都能精确识别所有类型。识别不了的平台会返回 `NodeUnknown`，但 `Study` 仍可能可用。

### 遍历节点

```go
// 深度优先遍历，返回 false 可以提前停止
node.Walk(func(current yatori.Node) bool {
	fmt.Println(current.ID, current.Name)
	return true
})

// 只取叶子节点
leaves := yatori.Flatten(nodes)
```

## Work 作业

```go
type Work struct {
	ID            string
	CourseID      string
	Name          string
	Status        string
	Deadline      time.Time
	QuestionCount int
	Extra         map[string]string
	Raw           any
}
```

`Status` 是平台原始状态字符串，可能是 `待做`、`未交`、`pending`、`finished` 等。不同平台不统一，业务层需要按平台判断。

## Exam 考试

```go
type Exam struct {
	ID            string
	CourseID      string
	Name          string
	Status        string
	StartAt       time.Time
	EndAt         time.Time
	Duration      time.Duration
	QuestionCount int
	Extra         map[string]string
	Raw           any
}
```

## Answer 与 AnswerResult

```go
type Answer struct {
	QuestionID string
	Question   string
	Type       string
	Options    []string
	Value      []string
	Correct    bool
	Raw        any
}

type AnswerResult struct {
	TaskID    string
	Title     string
	Submitted bool
	Score     float64
	Answers   []Answer
	Message   string
	Raw       any
}
```

`Score` 不一定有值；很多平台在提交后不会立即返回分数。

## Session 会话

```go
type Session struct {
	Platform Platform
	Account  string
	UserID   string
	Cookie   string
	Token    string
	Extra    map[string]string
}
```

用于保存/恢复会话时，优先保存 `Cookie` 或 `Token`，下次用 `LoginWithCookie` 导入。

## StudyRequest 与 StudyResult

```go
type StudyRequest struct {
	Course   Course
	Node     Node
	Action   StudyAction
	Mode     StudyMode
	Position time.Duration
	Duration time.Duration
	IsDrag   bool
	Extra    map[string]any
}

type StudyResult struct {
	CourseID  string
	NodeID    string
	Kind      NodeKind
	Submitted bool
	Position  time.Duration
	Progress  float64
	Completed bool
	Message   string
	Raw       any
}
```

`StudyAction`：

```go
const (
	StudyActionStart    StudyAction = "start"
	StudyActionProgress StudyAction = "progress"
	StudyActionPause    StudyAction = "pause"
	StudyActionFinish   StudyAction = "finish"
)
```

`StudyMode`：

```go
const (
	StudyModeNormal StudyMode = "normal"
	StudyModeFast   StudyMode = "fast"
	StudyModeWeb    StudyMode = "web"
)
```

## WorkRequest 与 ExamRequest

```go
type WorkRequest struct {
	Course  Course
	Work    Work
	Source  AnswerSource
	Submit  bool
	Answers []Answer
	Extra   map[string]any
}

type ExamRequest struct {
	Course  Course
	Exam    Exam
	Source  AnswerSource
	Submit  bool
	Answers []Answer
	Extra   map[string]any
}
```

`Submit` 表示是否在最后交卷/提交。不同平台的“最后”判断由适配器处理。

## SignInRequest 与 SignInResult

```go
type SignInRequest struct {
	UserID   string
	Location string
	Remark   string
	Extra    map[string]any
}

type SignInResult struct {
	Success bool
	Message string
	Raw     any
}
```

## Raw 与 Extra 怎么选

| 场景 | 用哪个 |
|---|---|
| 同一进程内马上调用 `Tree` / `Study` | 直接传 `Course` / `Node`，适配器会优先用 `Raw` |
| 存数据库、写 JSON、跨进程 | 保存 `Extra`，重建 `Course{ID: id, Extra: extra}` |
| 需要平台原始字段 | 用 `Raw`，但不要序列化 |

示例：只保存 `Extra` 后恢复课程

```go
type SavedCourse struct {
	ID    string            `json:"id"`
	Name  string            `json:"name"`
	Extra map[string]string `json:"extra"`
}

func restore(saved SavedCourse) yatori.Course {
	return yatori.Course{
		ID:    saved.ID,
		Name:  saved.Name,
		Extra: saved.Extra,
	}
}
```

注意：如果某个平台只依赖 `Raw` 而 `Extra` 不完整，恢复后的课程可能无法调用 `Tree`。这时需要在同一次运行里重新 `Courses` 一次。

## ID 的稳定性

`Course.ID` / `Node.ID` 是适配器生成的稳定标识：

- 学习通课程 ID 使用平台 `courseId`；
- 学习通节点 ID 使用 `video:<knowledgeId>:<cardIndex>:<objectId>` 这类组合；
- TTCDW 课程 ID 使用 `project:segment:item:course` 组合，避免不同项目下同名课程冲突。

不要自己解析 ID 的内部格式，把它当成不透明字符串使用。
