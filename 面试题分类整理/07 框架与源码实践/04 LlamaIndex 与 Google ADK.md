# LlamaIndex 与 Google ADK

[总目录](../README.md) · [07 框架与源码实践](README.md)

共 3 题；简单 1 / 中等 1 / 困难 1。

## 题目目录

- [easy-106 · 什么是 Google ADK？](#easy-106)（简单）
- [medium-108 · LangChain 和 LlamaIndex 有什么区别？各自适合什么场景？](#medium-108)（中等）
- [hard-12 · LlamaIndex 如何与 LangChain 结合？](#hard-12)（困难）

---

<a id="easy-106"></a>

## easy-106 · 什么是 Google ADK？

- 难度：简单
- 原始分类：6. Agent 框架与应用开发（22 题）
- 资料类型：原始面试题
- 标签：AI、大模型

### 核心回答

Google ADK，即 Agent Development Kit，是 Google 提供的开源 Agent 开发框架，用于定义、运行、调试、评估和部署智能体。官方现提供多种语言实现；虽然与 Gemini 及 Google 生态集成方便，也支持通过适配器接入其他模型或本地模型。[ADK 官方文档](https://adk.dev/)

典型结构是：Agent 描述职责、模型和工具；Runner 协调运行；会话保存当前交互状态，事件记录执行过程；记忆和产物服务管理跨任务信息及生成文件。Python 官方示例可以看到 Runner、SessionService 与事件流的组合。[ADK Runner 示例](https://github.com/google/adk-python/tree/main/contributing/samples/core/runner_debug_example)

编排既可以使用模型驱动的任务委派，也可以用顺序、并行、循环等明确工作流。开发工具和评测能力有助于检查实际工具轨迹和最终结果，但上线仍需应用自行处理用户权限、失败恢复与资源限制。

适合想用统一框架管理 Agent 全生命周期的团队。选型时应检查所用语言版本的功能支持，而不是假设 Python、Java 等实现完全一致。

### 口述练习

ADK 是 Google 的开源 Agent 开发套件，覆盖 Agent、工具、会话、运行、编排和评测。它支持 Google 模型，也能接入其他模型。开发时仍要设计权限、终止和业务校验，并核对具体语言版本的能力。

### 易错点

- ADK 不是 Gemini 模型本身，也不局限于 Gemini。
- Session、长期 Memory 和 Artifact 的用途不同。
- 使用框架不意味着自动获得完整生产安全保证。

---

<a id="medium-108"></a>

## medium-108 · LangChain 和 LlamaIndex 有什么区别？各自适合什么场景？

- 难度：中等
- 原始分类：5. LangChain、Spring AI 与框架开发（19 题）
- 资料类型：原始面试题
- 标签：LangChain、LlamaIndex、框架对比

### 核心回答

LangChain 更强调模型、工具、Agent 和工作流的通用编排；LlamaIndex 以数据接入、文档索引、Retriever/Query Engine 起家，但现在也支持 Agent 和工作流。若主要难点是异构数据解析、索引与知识问答，可优先试 LlamaIndex；若主要难点是工具编排、多步骤应用集成，可优先试 LangChain。两者能力重叠，实际还要比较团队语言栈、生态、可观测性和维护成本。

### 口述练习

LlamaIndex 偏数据与检索，LangChain 偏应用与 Agent 编排；现在有重叠，按项目瓶颈选。

### 易错点

不要说 LlamaIndex 只能做 RAG，或 LangChain 不能做索引。

---

<a id="hard-12"></a>

## hard-12 · LlamaIndex 如何与 LangChain 结合？

- 难度：困难
- 原始分类：2. Agent、推理与框架（16 题）
- 资料类型：原始面试题
- 标签：大模型、AI、Agent、LangChain、LlamaIndex

### 核心回答

比较稳妥的边界是让 LlamaIndex 负责数据加载、索引、Retriever/Query Engine，让 LangChain 负责对话、工具与 Agent 编排。可把 LlamaIndex 的查询能力封装为 LangChain Tool（输入问题，输出答案及来源），或把检索结果转换为 LangChain Document，统一元数据字段；官方示例也有将索引封装为 LangChain 工具的做法。集成时明确谁负责 Embedding、谁维护会话和引用，避免双重检索、两次生成或重复计费；用端到端追踪和同一评测集测延迟与答案质量。

### 口述练习

把 LlamaIndex 当知识检索/索引层，LangChain 当工作流/Agent 层，通过 Tool 或 Document 适配器连接。

### 易错点

两个框架都有 Agent/RAG 能力，不能随意叠加；先选清楚职责与版本兼容性。
