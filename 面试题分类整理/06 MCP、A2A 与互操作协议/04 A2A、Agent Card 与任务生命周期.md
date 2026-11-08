# A2A、Agent Card 与任务生命周期

[总目录](../README.md) · [06 MCP、A2A 与互操作协议](README.md)

共 6 题；简单 4 / 中等 2 / 困难 0。

## 题目目录

- [easy-82 · A2A 协议的工作原理是怎样的？](#easy-82)（简单）
- [easy-83 · A2A 协议的工作流程是怎样的？](#easy-83)（简单）
- [easy-84 · A2A 协议中的 Agent Card 是什么？它在多 Agent 发现和协作中起什么作用？](#easy-84)（简单）
- [easy-88 · 什么是 ACP 协议？它有哪两个不同的含义？](#easy-88)（简单）
- [medium-70 · A2A 协议有哪五大设计原则？](#medium-70)（中等）
- [medium-77 · 什么是 A2A 协议，它的核心架构及主要组件有哪些？](#medium-77)（中等）

---

<a id="easy-82"></a>

## easy-82 · A2A 协议的工作原理是怎样的？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题
- 标签：大模型、AI、A2A、技术栈

### 核心回答

A2A 是 Agent2Agent 协议，用于独立 Agent 之间的发现、通信和任务协作。调用方了解对方提供的能力后，发送任务相关消息，并接收状态和交付结果，无需知道对方内部使用哪个模型或框架。[A2A 官方概述](https://a2a-protocol.org/latest/topics/what-is-a2a/)

核心对象包括 Agent Card、Message、Task 和 Artifact：卡片描述能力与接口，消息承载交互，任务记录执行状态，产物承载结果。执行较长时可以按双方支持的能力使用流式更新或通知。

例如主 Agent 请求数据分析 Agent 生成销售报告，后者可以独立读取数据和计算，期间报告进度，完成后返回报告产物。任务可能需要补充输入或失败，调用方应据此推进流程，而不是把一次网络成功当作任务完成。

协议负责互操作，真正的任务分配、预算、信任和业务验收仍由应用实现。对方声称有某项能力，也需要通过来源认证和结果评测确认可信程度。

### 口述练习

A2A 让独立 Agent 通过统一的能力描述、消息、任务状态和产物进行协作。调用方无需了解对方内部模型，只需遵循接口并跟踪任务生命周期。协议统一通信，任务调度和结果验收仍由系统负责。

### 易错点

- 对外开放 A2A 不要求公开 Agent 内部提示词和推理过程。
- 接口调用成功不等于业务任务已成功完成。

---

<a id="easy-83"></a>

## easy-83 · A2A 协议的工作流程是怎样的？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题
- 标签：大模型、AI、A2A

### 核心回答

A2A 的典型流程可以分为六步：

1. **发现**：取得 Agent Card，确认能力、接口、协议版本和输入输出类型。
2. **认证**：获取或配置所需凭据，确认任务允许交给该 Agent。
3. **发送消息**：描述目标、输入材料、约束和期望结果。
4. **处理响应**：简单协商可返回消息，正式工作可建立带 ID 的任务。
5. **跟踪任务**：处理工作中、需要输入、完成、失败或取消等状态，并按支持能力订阅更新。
6. **接收与验收**：读取产物，校验来源、格式与业务结果，再决定下一步。

任务进入完成、取消、拒绝或失败等终态后，新的修改需求应启动关联的新任务，而不是随意重启旧任务。[A2A 任务生命周期](https://a2a-protocol.org/latest/topics/life-of-a-task/)

工程中还要处理重试、去重、取消传播和超时。例如网络断开后，应查询已有任务，避免把同一次报告请求重复提交并产生多份结果。

### 口述练习

先发现 Agent 并认证，再发送任务消息，获得消息或任务响应，随后跟踪状态、补充输入，最后接收产物并验收。长任务要处理流式更新、重试和取消，完成后的修订按协议创建关联的新任务。

### 易错点

- 不是每一条 A2A 消息都必须创建长任务。
- 重试是否重复执行业务，需要应用的去重和幂等设计。

---

<a id="easy-84"></a>

## easy-84 · A2A 协议中的 Agent Card 是什么？它在多 Agent 发现和协作中起什么作用？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题
- 标签：AI、大模型、Agent

### 核心回答

Agent Card 是 Agent 对外提供的结构化能力说明，可理解为一张机器可读的服务名片。它描述身份、技能、输入输出形式、支持的接口与协议、流式能力和认证要求，帮助调用方选择合适的 Agent 并正确接入。[A2A Agent Card 与发现机制](https://a2a-protocol.org/latest/topics/agent-discovery/)

例如报告 Agent 的卡片可以说明支持销售分析、接受表格数据、输出报告文件、需要企业身份认证。主 Agent 据此判断任务是否匹配，随后通过被支持的接口调用。

卡片可以通过约定位置、注册目录或私有配置发现。它只描述服务声明，不是运行结果，也不是包含密钥的配置文件。敏感能力信息可以要求认证后获取，凭据应独立管理。

工程上还应校验卡片来源、协议兼容和访问边界，并管理缓存更新。Agent 更新接口后，长期使用旧卡片会造成调用失败；服务声明与真实能力也需要持续评测。

### 口述练习

Agent Card 是描述 Agent 身份、能力、接口和认证要求的服务名片。它帮助多 Agent 系统发现合适的协作者并准备请求。卡片声明不是能力或权限保证，仍需验证来源、版本和实际结果，也不能在里面放长期秘密。

### 易错点

- 卡片中的 skills 是能力描述，不必等同于某平台的技能文件。
- 找到某个 Agent 不代表有权调用它。

---

<a id="easy-88"></a>

## easy-88 · 什么是 ACP 协议？它有哪两个不同的含义？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题

### 核心回答

ACP 在 Agent 领域常见的两个含义属于不同项目，必须说明全称和来源：

1. **Agent Client Protocol**：标准化编辑器或 IDE 与编程 Agent 的交互，例如会话、进度、文件操作和权限请求。本地实现常用 JSON-RPC over stdio；远程支持应按具体版本核对。[Agent Client Protocol 官方介绍](https://agentclientprotocol.com/get-started/introduction)
2. **Agent Communication Protocol**：BeeAI 相关的 Agent、应用与人之间通信协议，描述消息、运行、发现和长任务协作。该项目官方仓库已宣布并入 A2A，仓库处于归档状态，新集成应关注迁移路径。[Agent Communication Protocol 官方仓库](https://github.com/i-am-bee/acp)

前者主要关注“编辑器怎样与编码 Agent 协作”，后者历史上主要关注“Agent 之间怎样通信”。两者不是同一协议的客户端和服务端，也不能共享缩写就认为兼容。

面试时先询问语境或主动列出两个全称，再结合项目版本说明。这里的“两种”是本题常见语境，并不排除其他领域也使用 ACP 缩写。

### 口述练习

ACP 要先看全称。Agent Client Protocol 面向编辑器和编程 Agent，Agent Communication Protocol 则曾面向 Agent 通信，BeeAI 相关项目已并入 A2A。它们来自不同项目，接口和用途不同，不能仅凭缩写判断兼容性。

### 易错点

- 不应把归档项目描述成仍独立持续演进的最新标准。
- 协议名、SDK 版本和产品是否支持，需要分别确认。

---

### 本分类速记

1. MCP 接入工具与上下文，A2A 协调独立 Agent 的任务。
2. Host 管应用，Client 管协议通信，Server 提供业务能力。
3. stdio 与 Streamable HTTP 是传输方式，同步异步是编程模型。
4. MCP 生命周期需要讲版本：旧握手与新每请求元数据不能混用。
5. Function Calling 表达调用意图，真正的业务执行由运行时负责。
6. Skills 沉淀任务流程，可以配合 MCP 使用。
7. A2A 需管理发现、认证、消息、任务状态和产物验收。
8. Agent Card 是声明，不是授权或真实能力的保证。
9. 多 Agent 要明确状态、契约、预算、取消和最终决定权。
10. ACP 要说全称，并关注 Agent Communication Protocol 的 A2A 迁移。

### 第 5 类参考资料（核对日期：2026-10-09）

- [MCP 官方架构](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [MCP 基础规范](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本与兼容](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP stdio 传输](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP 传输](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 安全实践](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)
- [Spring AI MCP 文档](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html)
- [Agent Skills 开放格式](https://agentskills.io/home)
- [A2A 官方文档](https://a2a-protocol.org/latest/topics/what-is-a2a/)
- [A2A 任务生命周期](https://a2a-protocol.org/latest/topics/life-of-a-task/)
- [A2A Agent 发现](https://a2a-protocol.org/latest/topics/agent-discovery/)
- [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction)
- [Agent Communication Protocol 及迁移说明](https://github.com/i-am-bee/acp)

---

<a id="medium-70"></a>

## medium-70 · A2A 协议有哪五大设计原则？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：大模型、AI、A2A、系统架构

### 核心回答

按 A2A 官方文档，五项原则是：简单性（复用 HTTP 等现有标准）、企业就绪（认证、授权、审计等）、异步性（支持长任务、流式与回调）、模态无关（文本、文件和结构化数据）、不透明执行（协作方无需暴露内部工具和实现）。它们使不同厂商 Agent 能在保留自治与安全边界的前提下协作。

### 口述练习

五项是简单、企业就绪、异步、模态无关和内部实现不透明。

### 易错点

“不透明”不等于没有可观测性；任务状态和产物仍可对外暴露。

---

<a id="medium-77"></a>

## medium-77 · 什么是 A2A 协议，它的核心架构及主要组件有哪些？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：大模型、AI、A2A、系统架构

### 核心回答

A2A 是独立 Agent 之间互操作的协议。客户端 Agent 根据 Agent Card 发现服务端 Agent 的能力、端点和认证要求，发送 Message；服务端可直接回复或创建有生命周期的 Task，使用状态更新、流式事件/推送和 Artifact 返回结果。Part 承载文本、文件或结构化数据。协议不要求公开被调用 Agent 的内部模型或工具。

### 口述练习

A2A 的核心是 Agent Card 发现、Message 交互、Task 追踪和 Artifact 交付。

### 易错点

Agent Card 是能力声明，不等于自动授权；仍要做认证与权限控制。
