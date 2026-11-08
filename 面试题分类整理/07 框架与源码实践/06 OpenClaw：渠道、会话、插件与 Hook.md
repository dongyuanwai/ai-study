# OpenClaw：渠道、会话、插件与 Hook

[总目录](../README.md) · [07 框架与源码实践](README.md)

共 8 题；简单 1 / 中等 7 / 困难 0。

## 题目目录

- [easy-110 · 如果一个 Agent 系统要同时接入 Telegram、飞书、钉钉等渠道，你会怎么设计抽象层？OpenClaw 的 Channel Plugin 接口是怎么设计的？](#easy-110)（简单）
- [medium-87 · 同一个系统里可能有多个 Agent，不同渠道用户群组的消息需要路由到不同的 Agent。你会怎么设计这个路由？OpenClaw 的路由匹配优先级是怎样的？](#medium-87)（中等）
- [medium-88 · 同一个用户在 Telegram 私聊和 Discord 群组里和 Agent 对话，应该共享会话还是隔离？OpenClaw 是怎么设计会话隔离粒度的？](#medium-88)（中等）
- [medium-89 · 同一个工具（比如「执行命令」）在不同场景下应该有不同的权限。你会怎么设计工具的权限控制？OpenClaw 的工具策略管道是怎么分层的？](#medium-89)（中等）
- [medium-91 · Agent 系统中 Hook中间件模式有什么用？能举几个典型场景吗？OpenClaw 的 Hook 系统是怎么设计的？](#medium-91)（中等）
- [medium-92 · 什么场景下需要多 Agent 协作而不是单个 Agent 解决？OpenClaw 是怎么支持子 Agent（Subagent）的？](#medium-92)（中等）
- [medium-93 · 父 Agent spawn 子 Agent 时，有哪些边界问题需要考虑？OpenClaw 做了哪些限制和保护？](#medium-93)（中等）
- [medium-95 · OpenClaw 采用插件架构，第三方可以注册新渠道、工具、Hook。设计一个插件系统需要考虑哪些关键问题？OpenClaw 的插件 API 长什么样？](#medium-95)（中等）

---

<a id="easy-110"></a>

## easy-110 · 如果一个 Agent 系统要同时接入 Telegram、飞书、钉钉等渠道，你会怎么设计抽象层？OpenClaw 的 Channel Plugin 接口是怎么设计的？

- 难度：简单
- 原始分类：6. Agent 框架与应用开发（22 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

我会用渠道适配器把平台事件转换成统一消息，保留渠道、账号、用户、会话、线程、消息 ID 和媒体引用。公共层负责鉴权、路由、去重及 Agent 调用；适配器负责平台验证、收发、格式、限流和重试。不同渠道的富文本和线程能力通过能力声明处理，不强求完全一致。

OpenClaw 当前源码中的 `ChannelPlugin` 是一组分职责的适配器契约；`id`、`meta`、`capabilities` 来自其基础类型，`config` 负责账号解析，其他适配器按需提供。[ChannelPlugin 源码](https://github.com/openclaw/openclaw/blob/main/src/channels/plugins/types.plugin.ts)、[基础类型源码](https://github.com/openclaw/openclaw/blob/main/src/channels/plugins/setup-wizard-types.ts)

| 字段 | 主要职责 |
| --- | --- |
| `config` | 列出和解析账号，如 `listAccountIds`、`resolveAccount` |
| `gateway` | 渠道账号运行和连接生命周期 |
| `outbound` | 将回复投递到平台 |
| `messaging`、`threading` | 消息目标和回复线程语义 |
| `security`、`pairing` | 渠道访问策略与配对流程 |

当前官方还提供 `createChannelPluginBase` 和 `createChatChannelPlugin` 帮助组装这些适配器；账号读取属于 `config`，配置写入则属于 `setup`。[渠道插件开发文档](https://docs.openclaw.ai/plugins/sdk-channel-plugins)

### 口述练习

我会统一消息和会话身份，把平台协议与 Agent 核心分开，再通过能力声明处理渠道差异。OpenClaw 使用分职责的 ChannelPlugin：config 管账号，gateway 管连接，outbound 管发送，并配合线程和安全适配器。

### 易错点

- 这是版本相关接口，需核对项目所装 SDK，不能把示意表当完整类型定义。
- 多渠道会话合并必须有身份绑定依据，不能只按同名用户匹配。
- 不能默认所有渠道已内置支持；未知渠道应实现或核验插件。

---

### 本类速记

| 概念 | 一句话记忆 |
| --- | --- |
| LangChain | 连接模型、数据与工具，提供常见 Agent 抽象 |
| model | 统一调用适配，底层模型决定实际能力 |
| Chain / Runnable | 组合确定的处理步骤，注意输入输出契约 |
| Prompt 模板 | 分离固定指令和动态变量，便于复用与评测 |
| DocumentLoader | 把数据源变成正文加元数据，解析质量要验证 |
| OutputParser | 解析和结构校验，事实正确性仍需验证 |
| 多轮上下文 | 保存记录、选择本轮输入、检索长期记忆 |
| LangGraph | 显式状态与路由，恢复时外部副作用仍需幂等 |
| Spring AI | Spring 工程习惯下的模型、RAG、工具集成 |
| ADK | Agent 开发、运行、会话、编排及评测工具集 |
| Manus | 任务执行产品，未公开内部细节不推测 |
| OpenClaw | Gateway 连接消息渠道与 Agent 运行系统 |
| Channel Plugin | 平台收发适配与公共运行逻辑分离 |

### 第 6 类参考资料（核对日期：2026-10-09）

资料核对日期：2026-10-09。LangChain、LangGraph、Spring AI、Google ADK 和 OpenClaw 均先通过 Context7 CLI 解析库并查询文档，再对关键产品能力和接口核对官方文档或源码。以下为主要原始资料；产品和框架版本可能继续变化。

- [LangChain 官方概览](https://docs.langchain.com/oss/python/langchain/overview)、[Models](https://docs.langchain.com/oss/python/langchain/models)、[Agents](https://docs.langchain.com/oss/python/langchain/agents)。
- [LangChain v1 迁移](https://docs.langchain.com/oss/python/migrate/langchain-v1)、[短期记忆](https://docs.langchain.com/oss/python/langchain/short-term-memory)、[上下文工程](https://docs.langchain.com/oss/python/langchain/context-engineering)。
- [LangChain 文档加载器](https://docs.langchain.com/oss/python/integrations/document_loaders)、[OutputParser API](https://reference.langchain.com/python/langchain-core/output_parsers)、[结构化输出](https://docs.langchain.com/oss/python/langchain/structured-output)。
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)、[Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api)、[中断与恢复](https://docs.langchain.com/oss/python/langgraph/interrupts)。
- [Spring AI 概览](https://docs.spring.io/spring-ai/reference/)、[ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html)、[Advisors](https://docs.spring.io/spring-ai/reference/api/advisors.html)。
- [Google ADK 文档](https://adk.dev/)、[ADK Python 官方仓库](https://github.com/google/adk-python)。
- [Manus 官方介绍](https://manus.im/docs/introduction/welcome)、[产品页面](https://manus.im/)。
- [OpenClaw Gateway 架构](https://docs.openclaw.ai/concepts/architecture)、[Agent Loop](https://docs.openclaw.ai/concepts/agent-loop)、[渠道插件文档](https://docs.openclaw.ai/plugins/sdk-channel-plugins)、[ChannelPlugin 类型源码](https://github.com/openclaw/openclaw/blob/main/src/channels/plugins/types.plugin.ts)。

---

<a id="medium-87"></a>

## medium-87 · 同一个系统里可能有多个 Agent，不同渠道用户群组的消息需要路由到不同的 Agent。你会怎么设计这个路由？OpenClaw 的路由匹配优先级是怎样的？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、Agent开发、AI应用开发

### 核心回答

路由规则应基于已验证的渠道、账号、会话/群组和角色，明确冲突优先级与兜底，路由结果记录在会话中。OpenClaw 官方路由顺序大致是：精确 peer、父 peer、peer 通配、Discord guild+roles、guild、Slack team、账号、渠道通配，最后是可用的 owner/单 Agent 兜底；同级按配置顺序。Binding 只选择 Agent，不替代渠道准入或权限控制。

### 口述练习

遵循“越具体越优先”：具体会话优于群/团队，再优于账号和渠道兜底；OpenClaw 的 binding 负责选 Agent。

### 易错点

多 Agent 且无匹配规则时，不应随便选第一个 Agent。

---

<a id="medium-88"></a>

## medium-88 · 同一个用户在 Telegram 私聊和 Discord 群组里和 Agent 对话，应该共享会话还是隔离？OpenClaw 是怎么设计会话隔离粒度的？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

默认应隔离，避免私聊信息泄露到群组；若业务确需共享偏好，应通过受权限控制的长期记忆选择性共享，而非共享整段对话。OpenClaw 的 `sessionKey` 是隔离单位：群组/频道按渠道与 peer ID 分开；私聊可通过 `session.dmScope` 配成主会话、按用户、按渠道+用户或按账号+渠道+用户等粒度。路由 binding 还能覆盖会话范围。跨渠道共享必须审查身份映射和隐私。

### 口述练习

私聊与群聊默认分会话；OpenClaw 用 session key 和 dmScope 控制粒度，共享应是选择性的记忆共享。

### 易错点

同一显示名不等于同一人，跨平台身份不能自动合并。

---

<a id="medium-89"></a>

## medium-89 · 同一个工具（比如「执行命令」）在不同场景下应该有不同的权限。你会怎么设计工具的权限控制？OpenClaw 的工具策略管道是怎么分层的？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

设计上先区分工具可见、工具可调用、参数/目标资源可访问及执行环境四层。OpenClaw 工具策略按 profile、Provider profile、全局 allow/deny、Provider 策略、Agent 策略、Agent+Provider 策略、沙箱和子 Agent 限制逐层过滤；`deny` 优先，后层不能重新授予前层已拒绝工具。沙箱决定运行边界，elevated 是单独受控能力。对 `exec` 还要约束命令、文件系统和审批，光隐藏 `write` 工具并不能让 shell 只读。

### 口述练习

OpenClaw 逐层收紧工具列表，拒绝优先；真正的执行安全还需沙箱、资源权限和审批。

### 易错点

允许任意 `exec` 后再禁用文件写入工具，并不等于禁止写文件。

---

<a id="medium-91"></a>

## medium-91 · Agent 系统中 Hook中间件模式有什么用？能举几个典型场景吗？OpenClaw 的 Hook 系统是怎么设计的？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

Hook 把扩展逻辑挂到生命周期事件上，可用于鉴权、日志、输入预处理、工具结果过滤、审计和完成通知。OpenClaw 插件 SDK 可注册事件 Hook，也提供 Gateway 路由、工具结果中间件等扩展点。设计时区分观察型与可修改型 Hook，定义顺序、超时、失败策略和重入/幂等；敏感 Hook 不能让插件绕过既有权限。

### 口述练习

Hook 使安全、审计和扩展功能从主流程解耦；OpenClaw 通过插件注册事件与相关中间件。

### 易错点

不要让可失败的非核心日志 Hook 阻塞主请求，也不能默认所有 Hook 都有修改权限。

---

<a id="medium-92"></a>

## medium-92 · 什么场景下需要多 Agent 协作而不是单个 Agent 解决？OpenClaw 是怎么支持子 Agent（Subagent）的？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

当任务能拆成独立研究、代码、审查等子任务，或需要不同工具/权限/模型配置时，多 Agent 有价值；简单任务用单 Agent 通常更便宜。OpenClaw 的 `sessions_spawn` 可启动独立子会话，子 Agent 执行后向请求者汇报；支持并发与层级限制，子会话默认与父会话分离，并可施加沙箱/工具限制。父 Agent 仍负责整合和验证结果。

### 口述练习

多 Agent 适合可并行、可隔离的子任务；OpenClaw 通过独立子会话调度并回报结果。

### 易错点

子 Agent 不会自动继承父会话全部上下文和权限。

---

<a id="medium-93"></a>

## medium-93 · 父 Agent spawn 子 Agent 时，有哪些边界问题需要考虑？OpenClaw 做了哪些限制和保护？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、大模型应用开发、AI应用开发、Agent开发

### 核心回答

要明确子任务范围、可见数据、工具权限、预算、最长运行时间、递归深度、并发数、取消传播与结果可信度。OpenClaw 为子任务使用独立会话，并提供最大深度、每父会话子任务数和并发限制；可限制子 Agent 的工具和跨会话访问，取消父任务时处理后代。父 Agent 应核验子结果，不直接执行子返回的指令。

### 口述练习

核心边界是上下文、权限、成本和生命周期；OpenClaw 用独立会话与深度/并发/工具限制降低失控风险。

### 易错点

子 Agent 输出是数据，不应自动提升为父 Agent 的系统指令。

---

<a id="medium-95"></a>

## medium-95 · OpenClaw 采用插件架构，第三方可以注册新渠道、工具、Hook。设计一个插件系统需要考虑哪些关键问题？OpenClaw 的插件 API 长什么样？

- 难度：中等
- 原始分类：4. Agent、协议与 OpenClaw（28 题）
- 资料类型：原始面试题
- 标签：AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发

### 核心回答

插件系统要定义稳定注册接口、生命周期、版本兼容、权限和隔离、错误处理、配置与密钥管理。OpenClaw 的插件注册入口可通过 `api.registerHook(...)`、`api.registerGatewayMethod(...)`、工具/渠道等对应注册接口扩展能力；不同类型插件有不同 SDK 表面，不能把所有能力假定为同一个函数。上线前应审查来源、限制工具权限并测试插件故障是否影响主流程。

### 口述练习

插件 API 的核心是显式注册能力，工程关键是版本、权限、隔离、审计和失败边界。

### 易错点

安装第三方插件相当于引入代码与权限风险，不是只添加一段 Prompt。
