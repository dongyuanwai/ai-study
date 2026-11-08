# LangGraph：状态、节点、条件分支与编排

[总目录](../README.md) · [07 框架与源码实践](README.md)

共 3 题；简单 3 / 中等 0 / 困难 0。

## 题目目录

- [easy-100 · 什么是 LangGraph ？](#easy-100)（简单）
- [easy-101 · LangGraph 编排的原理是什么？](#easy-101)（简单）
- [easy-102 · LangChain 和 LangGraph 有什么区别？](#easy-102)（简单）

---

<a id="easy-100"></a>

## easy-100 · 什么是 LangGraph ？

- 难度：简单
- 原始分类：6. Agent 框架与应用开发（22 题）
- 资料类型：原始面试题
- 标签：AI、大模型、LangChain、LangGraph

### 核心回答

LangGraph 是用于构建和运行有状态、长时间 Agent 或工作流的编排框架。开发者显式定义状态、节点和连接，让流程能够分支、循环、暂停和继续；它不要求每个节点都是模型，也不要求必须使用 LangChain。[LangGraph 官方概览](https://docs.langchain.com/oss/python/langgraph/overview)

例如退款流程可以包含身份校验、查询订单、规则判断、人工审批和实际退款。判断规则可由普通代码实现，解释或信息抽取由模型负责，审批节点等待人工输入。这种设计把业务控制与模型决策放到可检查的执行结构里。

状态记录当前目标、消息和中间结果；节点读取状态并返回更新；边决定接下来运行哪些节点。配置检查点后，可以保存线程状态并在失败或中断后继续。长任务也需要为持久化状态做版本兼容设计。

它适合对控制、可恢复性和人工参与有明确要求的任务，但也增加状态设计和运行维护成本。简单问答直接调用模型，通常不需要先设计复杂图。

### 口述练习

LangGraph 把 Agent 或业务流程表达成有状态的图，通过节点执行操作、边控制路线，并支持持久化与人工介入。它适合长任务和复杂分支，让哪些步骤由代码控制、哪些交给模型更加明确。

### 易错点

- 图可以有循环，不只是一个固定的 DAG。
- 检查点保存状态，不代表外部业务操作自动只执行一次。
- 不需要把所有业务函数都转换成智能体。

---

<a id="easy-101"></a>

## easy-101 · LangGraph 编排的原理是什么？

- 难度：简单
- 原始分类：6. Agent 框架与应用开发（22 题）
- 资料类型：原始面试题
- 标签：AI、大模型、LangChain、LangGraph

### 核心回答

LangGraph 以共享状态驱动图执行。节点读取当前 State，执行代码、模型或工具，再返回部分状态更新；边或条件路由决定下一批节点。多个节点更新同一字段时，需要按字段的 reducer 定义合并规则，例如消息追加，而不是任意覆盖。[LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api)

图经过 `compile` 成为可调用的运行对象。运行时按执行步推进，符合依赖的节点可以并行；配置 checkpointer 后将状态保存到相应线程，`thread_id` 用于定位这条执行历史。到达结束条件时终止，循环则必须设置次数或预算边界。

人工介入可以用 `interrupt` 暂停并保存状态，再用 `Command(resume=...)` 传回输入。恢复会从中断所在节点的开头重新运行，因此中断前的代码可能再次执行。[LangGraph 中断文档](https://docs.langchain.com/oss/python/langgraph/interrupts)

外部写操作要采用幂等键、结果记录或事务等方式防重，不能把图检查点当成业务 Exactly-once。并行写共享字段时，合并规则也必须与业务顺序要求一致。

### 口述练习

LangGraph 通过状态、节点、边和 reducer 推进流程，检查点记录每个线程的执行状态。interrupt 能暂停等待人工输入，但恢复可能重新执行所在节点，所以外部副作用必须设计幂等。循环、并行和终止都需要显式约束。

### 易错点

- 节点返回的是状态更新，不必返回整个状态。
- 列表追加 reducer 不会自动保证业务去重。
- 持久化恢复与数据库事务是两个问题。

---

<a id="easy-102"></a>

## easy-102 · LangChain 和 LangGraph 有什么区别？

- 难度：简单
- 原始分类：6. Agent 框架与应用开发（22 题）
- 资料类型：原始面试题
- 标签：AI、大模型、LangChain、LangGraph

### 核心回答

两者处于不同抽象层：LangChain 更偏向模型和工具集成及预建 Agent；LangGraph 更偏向有状态流程的底层编排和运行控制。当前 LangChain 的 Agent 建立在 LangGraph 之上，因此两者可以共同使用。[LangChain 概览](https://docs.langchain.com/oss/python/langchain/overview)、[LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)

| 对比项 | LangChain | LangGraph |
| --- | --- | --- |
| 开发入口 | 标准组件、预建 Agent | 自定义状态、节点和路由 |
| 关注重点 | 快速接入模型、数据和工具 | 控制分支、循环、恢复及人工介入 |
| 自定义程度 | 常见任务较省代码 | 需要设计更多执行细节 |

例如普通带工具的助手，可以从 `create_agent` 开始；需要“检索—审核—审批—执行”且各步骤有不同约束时，可直接设计 LangGraph 图，再在节点中使用 LangChain 的模型组件。

选型不是比较谁更强，而是需要多少控制。过早编写复杂图会增加维护成本；完全依赖通用 Agent 循环也可能无法满足严格流程。可以先做最小可用实现，再按实际需求降低抽象层。

### 口述练习

LangChain 提供高层集成和预建 Agent，LangGraph 提供更细的状态与流程控制。它们可以组合：常见助手用 LangChain 快速搭建，复杂分支、循环和恢复需求用 LangGraph 编排，节点里仍可以复用 LangChain 组件。

### 易错点

- 不能简单说 LangChain 没状态、LangGraph 才能做记忆。
- LangGraph 能编排普通函数，不仅编排 Agent。
- 图结构本身不保证生成质量。
