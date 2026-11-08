# Agent Harness 与跨会话任务管理

[总目录](../README.md) · [09 生产工程、评估与安全](README.md)

共 1 题；简单 0 / 中等 1 / 困难 0。

## 题目目录

- [concept-agent-harness · 长时间运行的 Agent 为什么需要 Harness，而不只是上下文压缩？](#concept-agent-harness)（中等）

---

<a id="concept-agent-harness"></a>

## concept-agent-harness · 长时间运行的 Agent 为什么需要 Harness，而不只是上下文压缩？

- 难度：中等
- 原始分类：新概念研读
- 资料类型：补充研读
- 标签：Agent Harness、环境初始化、进度交接、增量验证
- 来源：[Effective harnesses for long-running agents](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents)
- 来源日期：2025-11-26；核对日期：2026-11-08

### 核心回答

上下文压缩只能缓解窗口限制，不能独自保证任务跨会话继续推进。案例将首次环境准备与后续增量实现分开，每轮留下清晰的进度材料，供下一轮恢复状态。

工程上要明确当前任务、完成标准和可核验的产物，让接手过程有据可查。

### 口述练习

压缩解决记不下的问题，Harness 还要解决从哪里接着做、怎样知道做对了，以及如何交接。

### 易错点

- 不应把循环调用模型等同于可靠的长期任务系统。
- 进度记录必须和实际产物一致。
- 这是工程案例，不是所有任务的唯一架构。
