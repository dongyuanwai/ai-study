# MCP 服务开发与系统集成

[总目录](../README.md) · [06 MCP、A2A 与互操作协议](README.md)

共 2 题；简单 2 / 中等 0 / 困难 0。

## 题目目录

- [easy-78 · 如何将已有的应用转换成 MCP 服务？](#easy-78)（简单）
- [easy-79 · 在 Spring AI 框架中如何集成 MCP？](#easy-79)（简单）

---

<a id="easy-78"></a>

## easy-78 · 如何将已有的应用转换成 MCP 服务？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题
- 标签：大模型、AI、MCP、开发实践

### 核心回答

通常无需重写整个应用，而是在现有业务逻辑之外增加一层 MCP 适配：

1. **选择能力**：优先公开粒度清晰的查询和操作，例如查订单、创建工单。
2. **定义契约**：明确工具名称、描述、输入 Schema、输出结构和失败情况；只读资料可映射为资源。
3. **复用业务层**：服务端收到调用后，使用已有接口或服务对象，避免复制业务规则。
4. **落实执行控制**：校验身份、权限、参数、超时、限流和写操作幂等。
5. **选择传输与部署**：本地工具可采用 stdio，远程共享能力可采用 HTTP。
6. **验证与监控**：检查能力发现、参数边界、错误路径和真实任务完成效果。

例如订单系统可以公开 `get_order_status`，服务端根据调用者权限读取有限字段。不要把“任意 SQL”或“任意命令执行”当作默认业务工具，而应提供满足目标任务的受限操作。工具定义和调用消息需符合所选 MCP 修订。[MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

### 口述练习

我会给现有应用加协议适配层，先选清晰的业务能力，再定义 Schema 和错误契约，内部仍调用原有业务服务。随后补齐鉴权、幂等、限流和监控，选择本地或远程传输，并用真实 Agent 测试工具是否容易正确使用。

### 易错点

- 将 REST 接口机械改名为工具，不代表描述和粒度适合模型。
- MCP 层不能绕过现有业务系统的授权检查。

---

<a id="easy-79"></a>

## easy-79 · 在 Spring AI 框架中如何集成 MCP？

- 难度：简单
- 原始分类：5. MCP、A2A 与多智能体协议（19 题）
- 资料类型：原始面试题
- 标签：大模型、AI、MCP、Spring、Spring AI、Java

### 核心回答

Spring AI 提供 MCP 客户端和服务端 Starter，通常通过 BOM 管理依赖版本，再选择对应运行模式。[Spring AI MCP 官方说明](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html)

**客户端接入**：添加 `spring-ai-starter-mcp-client` 或 WebFlux 客户端 Starter；配置本地进程或远程服务、凭据、超时及同步/异步类型；发现工具并适配为 Spring AI 的 ToolCallback，交给模型调用链。工具结果再进入后续生成流程。

**服务端暴露**：根据应用选择 `spring-ai-starter-mcp-server`、`spring-ai-starter-mcp-server-webmvc` 或 WebFlux 版本。可在 Spring Bean 上用 `@McpTool` 暴露业务方法，用 `@McpResource` 注册资源，按版本配置扫描与返回类型。Web 服务可选择 `STREAMABLE` 或 `STATELESS` 等配置；新项目优先使用 Streamable HTTP，Spring AI 2.x 已将旧 `SSE` 传输标记弃用。[服务端配置说明](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)

两端传输和协议修订需兼容；`SYNC/ASYNC` 是各端的本地编程模式，不要求客户端和服务端同型，但同一应用内的回调与返回类型应匹配所选模式。名为 `STATELESS` 的配置不能直接当作支持最新全部协议特性的证明。HTTP Starter 不代替鉴权，业务授权和幂等仍放在服务层。

### 口述练习

Spring AI 集成 MCP 分为客户端消费工具和服务端公开能力。用 BOM 管理版本，客户端把发现的工具适配进模型调用链，服务端通过注解或注册方式复用业务方法。双方检查传输和协议兼容，各自正确配置同步异步回调，再补齐鉴权和超时。

### 易错点

- 不同 Spring AI 版本的依赖和配置可能变化，不能照搬旧教程。
- 工具注册成功仍需实际测试发现、调用和业务权限。
