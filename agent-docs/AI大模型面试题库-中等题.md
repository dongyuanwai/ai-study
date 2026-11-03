# AI 大模型面试题库（中等题）

> 来源：[面试鸭“最全 AI 大模型面试题库”](https://www.mianshiya.com/bank/1906189461556076546?difficulty=3)  
> 题目总数：164 题  
> 整理方式：按知识主题和学习顺序编排；不删除、不合并题目  
> 说明：本文档仅整理公开展示的题目信息，不包含站内付费答案。

## 分类索引

| 分类 | 题数 | 内容范围 |
| --- | ---: | --- |
| 大模型基础、工程与场景设计 | 6 | 覆盖模型能力、系统性能、并发容量、前端体验和 AI 辅助开发场景。 |
| Prompt 与上下文工程 | 21 | 覆盖 Prompt 设计、Few-shot、CoT、采样参数、任务分解、上下文窗口、压缩与推理引导。 |
| RAG、检索与向量数据库 | 42 | 覆盖 RAG 架构、文档处理、Embedding、向量索引、混合检索、查询改写、召回优化与评估。 |
| Agent、协议与 OpenClaw | 28 | 覆盖 Agent 工作流、记忆、工具调用、A2A/MCP、多 Agent、Skills，以及 OpenClaw 的上下文、权限、插件和 Gateway 设计。 |
| LangChain、Spring AI 与框架开发 | 19 | 覆盖 LangChain 核心架构、Chain/Agent、Memory、Tool、LCEL、路由、回调、流式输出和 Spring AI 能力。 |
| 微调与训练优化 | 7 | 覆盖 PEFT、全量微调、预训练模型选择、优化器、训练策略与效果评估。 |
| Transformer、注意力与多模态 | 24 | 覆盖 Transformer 架构、Encoder/Decoder、注意力、多头机制、归一化、训练瓶颈、ViT/ViLT 和模型结构。 |
| NLP、序列模型与词表示 | 17 | 覆盖 LSTM/GRU、BERT、Word Embedding、Word2Vec、文本分类和多语种处理。 |

## 1. 大模型基础、工程与场景设计（6 题）

覆盖模型能力、系统性能、并发容量、前端体验和 AI 辅助开发场景。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 1 | 什么是大模型的涌现能力？列举三种典型表现并解释其可能成因 | 中等 | 大模型 | 11329 |
| 2 | 假设要开发一个智能工单分类系统，请拆解AI可参与的环节并说明技术选型思路 | 中等 | 大模型 | 11343 |
| 3 | 当大模型API响应延迟超过1秒时，前端可以采取哪些优化策略保证用户体验？ | 中等 | 大模型 | 11351 |
| 4 | 现场实操：给定一个包含数据Schema的API文档，请使用AI工具在15分钟内生成符合RESTful规范的CRUD接口代码，并解释关键实现逻辑 | 中等 | 大模型 | 11345 |
| 5 | 如何保证 AI 应用的性能和稳定性？ | 中等 | 后端、编程导航 | 11795 |
| 6 | 如果一个GPU集群的LLM处理能力为1000tokenss，那1000个用户同时并发访问，响应给每个用户的性能只有1 tokens吗？怎么分析性能瓶颈 | 中等 | 后端、场景题、大模型 | - |

## 2. Prompt 与上下文工程（21 题）

覆盖 Prompt 设计、Few-shot、CoT、采样参数、任务分解、上下文窗口、压缩与推理引导。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 7 | 要让AI生成一个带表单验证的Vue3组件，请写出包含以下要素的Prompt | 中等 | 大模型 | 11340 |
| 8 | 假设需要让大模型生成一个React表单组件代码，请设计一个包含上下文约束的Prompt（需包含数据验证、错误提示等要求） | 中等 | 大模型 | 11341 |
| 9 | 当需要处理超长大模型上下文窗口限制时，有哪些可行的工程解决方案？ | 中等 | 大模型 | 11344 |
| 10 | 当大模型上下文窗口扩展到100万token时，哪些现有业务场景可能发生质变？ | 中等 | 大模型 | 11354 |
| 11 | 有哪些设计和优化 Prompt 的技巧？请举例说明 | 中等 | 通用、编程导航 | 11802 |
| 12 | 提示词优化考虑哪些维度？你们提示词模板有哪些字段？ | 中等 | AI、大模型 | 11856 |
| 13 | 如何设计提示词来减少 AI 的幻觉问题？ | 中等 | Prompt、幻觉问题 | - |
| 14 | 什么是 Few-shot Learning？Zero-shot、One-shot、Few-shot 有什么区别？ | 中等 | Prompt、Few-shot Learning | - |
| 15 | 如何优化过长的提示词？提示词压缩有哪些技巧？ | 中等 | Prompt、提示词压缩 | - |
| 16 | 如何使用提示词实现任务分解？ | 中等 | Prompt、任务分解 | - |
| 17 | temperature 和 top_p 参数有什么作用？如何选择合适的值？ | 中等 | Prompt、模型参数 | - |
| 18 | 什么是提示词模板？如何设计可复用的提示词模板？ | 中等 | Prompt、提示词模板 | - |
| 19 | 什么是 CoT 思维链？它的工作原理是什么？ | 中等 | Prompt、CoT 思维链 | - |
| 20 | 零样本 CoT 和少样本 CoT 有什么区别？各自适合什么场景？ | 中等 | Prompt、CoT 类型 | - |
| 21 | 什么是提示词链接？如何实现？ | 中等 | Prompt、提示词链接 | - |
| 22 | 什么是负面提示词？在什么场景下使用？ | 中等 | Prompt、负面提示词 | - |
| 23 | 什么是自洽性？如何应用？ | 中等 | Prompt、自洽性 | - |
| 24 | 如何让 AI 进行自我反思和迭代优化？ | 中等 | Prompt、自我反思 | - |
| 25 | 如何让 AI 一步步思考来提升推理能力？ | 中等 | Prompt、推理引导 | - |
| 26 | 如何选择和设计 Few-shot 示例以提升效果？ | 中等 | Prompt、Few-shot 示例设计 | - |
| 27 | 如何为不同领域设计专用提示词？比如编程、创作、数据分析 | 中等 | Prompt、领域专用提示词 | - |

## 3. RAG、检索与向量数据库（42 题）

覆盖 RAG 架构、文档处理、Embedding、向量索引、混合检索、查询改写、召回优化与评估。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 28 | 什么是 RAG 中的 Rerank？具体需要怎么做？ | 中等 | AI、大模型、RAG | 11456 |
| 29 | 什么混合检索？在基于大模型的应用开发中，混合检索主要解决什么问题？ | 中等 | AI、大模型、RAG | 11464 |
| 30 | 在 RAG 应用中为了优化检索精度，其中的数据清洗和预处理怎么做？ | 中等 | AI、大模型、RAG | 11471 |
| 31 | 什么查询扩展？为什么在 RAG 应用中需要查询扩展？ | 中等 | AI、大模型、RAG | 11480 |
| 32 | 如何进行 RAG 调优后的效果评估？请给出真实应用场景中采用的效果评估标准与方法 | 中等 | AI、大模型、RAG | 11529 |
| 33 | 在 RAG 中，你如何选择 Embedding Model 嵌入模型，需要考虑哪些因素？ | 中等 | AI、大模型、RAG | 11550 |
| 34 | 在 RAG 中，索引流程中的文档解析你们怎么做的？ | 中等 | AI、大模型、RAG | 11551 |
| 35 | 在 RAG 应用的过程中，关于提示工程的设计有什么心得和技巧吗？ | 中等 | AI、大模型、RAG、提示工程 | 11605 |
| 36 | 什么是 Advanced RAG？ | 中等 | AI、大模型、RAG | 11607 |
| 37 | 什么是 Modular RAG？ | 中等 | AI、大模型、RAG | 11608 |
| 38 | 什么是向量数据库？在基于大模型的应用开发中，向量数据库主要解决什么问题？ | 中等 | 大模型、编程导航 | 11327 |
| 39 | 你都了解哪些向量数据库？如何选型？ | 中等 | AI、大模型 | 11554 |
| 40 | 向量数据库原理是什么？ 请简述下它的原理 | 中等 | AI、大模型、RAG、向量数据库 | 11567 |
| 41 | 向量数据库中的 HNSW、LSH、PQ 分别是什么意思？ | 中等 | AI、大模型、RAG、向量数据库 | 11568 |
| 42 | 向量数据库中的 ANN 是什么？为什么需要用它？ | 中等 | AI、大模型、RAG、向量数据库 | 11570 |
| 43 | 向量数据库中，常见的向量搜索方法：余弦相似度、欧几里得距离和曼哈顿距离分别是什么？有什么区别？ | 中等 | AI、大模型、RAG、向量数据库 | 11595 |
| 44 | 向量数据库的工作流程有哪些？请简述下 | 中等 | AI、大模型、RAG、向量数据库 | 11571 |
| 45 | 请描述使用LangChain构建一个文档问答系统的关键技术组件及实现步骤 | 中等 | 大模型 | 11342 |
| 46 | 使用LangChain时，如何实现多路召回结果的动态权重分配？ | 中等 | 大模型 | 11352 |
| 47 | 当发现RAG系统召回结果与用户query意图不匹配时，有哪些可能的改进方向？ | 中等 | 大模型 | 11355 |
| 48 | 使用LangChain实现RAG系统时，如何处理PDF文档中的表格数据召回问题？ | 中等 | 大模型 | 11356 |
| 49 | 什么是查询重写？它有什么作用？如何基于 Spring AI 实现查询重写？ | 中等 | 后端、编程导航 | 11773 |
| 50 | 什么是上下文查询增强？它有什么作用？如何基于 Spring AI 实现上下文查询增强来处理无关问题？ | 中等 | 后端、编程导航 | 11775 |
| 51 | 什么是 Spring AI 提出的模块化 RAG 架构？预检索、检索和后检索阶段各自负责什么？ | 中等 | 后端、编程导航 | 11776 |
| 52 | RAG 的文档处理流程是怎样的？ | 中等 | 后端、编程导航 | 11766 |
| 53 | 你有多个知识库，做 RAG 的时候，怎么保证查询效率和准确性兼容，并尽可能减少幻觉？ | 中等 | AI、大模型、RAG | 11857 |
| 54 | RAG 系统如何标注信息来源和提供引用？ | 中等 | RAG、引用标注 | - |
| 55 | LangChain 支持哪些向量数据库？如何选择？ | 中等 | LangChain、向量数据库 | - |
| 56 | RAG 中如何设计 Prompt 来有效利用检索到的文档？ | 中等 | RAG、Prompt 设计 | - |
| 57 | 如何为 RAG 系统选择合适的 Embedding 模型？ | 中等 | RAG、Embedding 模型选择 | - |
| 58 | RAG 系统如何利用元数据过滤提升检索精度？ | 中等 | RAG、元数据过滤 | - |
| 59 | 如何为 RAG 项目选择向量数据库？Milvus、Pinecone、Chroma 怎么选？ | 中等 | RAG、向量数据库选型 | - |
| 60 | 如何构建和使用向量索引？HNSW 和 IVF 有什么区别？ | 中等 | RAG、向量索引 | - |
| 61 | LangChain 中的 TextSplitter 文档切分策略有哪些？ | 中等 | LangChain、文档切分 | - |
| 62 | LangChain 中的 Retriever 检索器有哪些类型？各有什么特点？ | 中等 | LangChain、Retriever 检索器 | - |
| 63 | 什么是 RAG？在 LangChain 中如何实现 RAG 应用？ | 中等 | LangChain、RAG 检索增强 | - |
| 64 | 如何处理 RAG 检索不到相关文档的情况？ | 中等 | RAG、检索失败处理 | - |
| 65 | RAG 中如何实现向量数据库的增量更新？ | 中等 | RAG、增量更新 | - |
| 66 | RAG 系统如何处理 PDF、Word、Markdown 等不同格式文档？ | 中等 | RAG、文档处理 | - |
| 67 | RAG 检索时相似度阈值如何设置？设置不当有什么影响？ | 中等 | RAG、相似度阈值 | - |
| 68 | RAG 中文档切割的 chunk_size 和 overlap 应该如何设置？ | 中等 | RAG、文档切割参数 | - |
| 69 | 什么是 RAG 混合检索？如何实现向量检索和关键词检索结合？ | 中等 | RAG、混合检索 | - |

## 4. Agent、协议与 OpenClaw（28 题）

覆盖 Agent 工作流、记忆、工具调用、A2A/MCP、多 Agent、Skills，以及 OpenClaw 的上下文、权限、插件和 Gateway 设计。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 70 | A2A 协议有哪五大设计原则？ | 中等 | 大模型、AI、A2A、系统架构 | 11663 |
| 71 | A2A 协议 与 MCP 协议的关系是怎样的？ | 中等 | 大模型、AI、A2A、MCP | 11667 |
| 72 | Computer Use 是什么？说说它的原理 | 中等 | AI、大模型 | 11636 |
| 73 | 在大模型应用中，通常如何实现长短期记忆机制？ | 中等 | AI、大模型 | 11639 |
| 74 | Copilot 模式和 Agent 模式的区别是什么？ | 中等 | AI、大模型 | 11640 |
| 75 | Agent智能体的工作过程是怎样的？ | 中等 | 大模型、AI、Agent | 11650 |
| 76 | LLM Agent 如何进行动态 API 调用？ | 中等 | 大模型、AI、Agent | 11652 |
| 77 | 什么是 A2A 协议，它的核心架构及主要组件有哪些？ | 中等 | 大模型、AI、A2A、系统架构 | 11662 |
| 78 | Agent 死循环问题有遇到过吗？如何解决？ | 中等 | 后端、AI、大模型、场景题 | - |
| 79 | 如何实现 AI 多轮对话功能？如何解决对话记忆持久化问题？ | 中等 | 后端、编程导航 | 11761 |
| 80 | （OpenClaw前置知识）解释「短期记忆」和「长期记忆」在 Agent 系统中的区别，分别适合怎么存储和检索？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 81 | OpenClaw 的核心组件有哪些？请描述它们之间的关系 | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 82 | LLM 的 Context Window 有上限，长对话时如何保证 Agent 仍然能正常工作？OpenClaw 是怎么做的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 83 | Agent 调用工具可能返回超大结果（比如代码搜索返回 50KB），这会带来什么问题？你会怎么处理？OpenClaw 是怎么做的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 84 | 当对话历史实在太长、裁剪也不够用时，还有什么办法？什么是 Compaction？OpenClaw 的 Compaction 策略是怎样的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 85 | OpenClaw 把 Context 管理抽象成了可插拔的 Context Engine，为什么要做这层抽象？这个设计能支持哪些不同的策略？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 86 | 如何设计和管理 AI Agent 的 Skills 体系？在实际项目中有哪些挑战？ | 中等 | AI、大模型、Agent、Skills | - |
| 87 | 同一个系统里可能有多个 Agent，不同渠道用户群组的消息需要路由到不同的 Agent。你会怎么设计这个路由？OpenClaw 的路由匹配优先级是怎样的？ | 中等 | AI、OpenClaw、大模型应用开发、Agent开发、AI应用开发 | - |
| 88 | 同一个用户在 Telegram 私聊和 Discord 群组里和 Agent 对话，应该共享会话还是隔离？OpenClaw 是怎么设计会话隔离粒度的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 89 | 同一个工具（比如「执行命令」）在不同场景下应该有不同的权限。你会怎么设计工具的权限控制？OpenClaw 的工具策略管道是怎么分层的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 90 | 不同的 LLM Provider 对 Tool Schema 的支持不完全一致，你会怎么处理这种差异？OpenClaw 是怎么做 Schema 适配的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发 | - |
| 91 | Agent 系统中 Hook中间件模式有什么用？能举几个典型场景吗？OpenClaw 的 Hook 系统是怎么设计的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 92 | 什么场景下需要多 Agent 协作而不是单个 Agent 解决？OpenClaw 是怎么支持子 Agent（Subagent）的？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 93 | 父 Agent spawn 子 Agent 时，有哪些边界问题需要考虑？OpenClaw 做了哪些限制和保护？ | 中等 | AI、大模型应用开发、AI应用开发、Agent开发 | - |
| 94 | 多 Agent 之间如何通信和协调？OpenClaw 的 Gateway 在其中扮演什么角色？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 95 | OpenClaw 采用插件架构，第三方可以注册新渠道、工具、Hook。设计一个插件系统需要考虑哪些关键问题？OpenClaw 的插件 API 长什么样？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 96 | OpenClaw 的 Gateway 对 Agent 请求做了幂等性处理。为什么 Agent 系统特别需要幂等性？工具已经产生副作用时怎么办？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |
| 97 | 如果让你基于 OpenClaw 的设计理念从零搭建一个 Agent 框架，你会先做哪三个模块？为什么？ | 中等 | AI、OpenClaw、大模型应用开发、AI应用开发、Agent开发 | - |

## 5. LangChain、Spring AI 与框架开发（19 题）

覆盖 LangChain 核心架构、Chain/Agent、Memory、Tool、LCEL、路由、回调、流式输出和 Spring AI 能力。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 98 | LangChain 的核心组件有哪些？ | 中等 | 大模型、AI、Agent、LangChain | 11656 |
| 99 | LangChain核心架构是什么样的 | 中等 | 大模型、AI、Agent、LangChain | 11657 |
| 100 | 解释LangChain框架中的Chain和Agent概念，并举例说明各自的应用场景 | 中等 | 大模型 | 11328 |
| 101 | 什么是工具调用 Tool Calling？如何利用 Spring AI 实现工具调用？ | 中等 | 后端、编程导航 | 11777 |
| 102 | 什么是结构化输出？Spring AI 是怎么实现结构化输出的？ | 中等 | 后端、编程导航 | 11763 |
| 103 | 什么是 Re-Reading？如何基于 Spring AI 实现 Re-Reading Advisor？ | 中等 | 后端、编程导航 | 11764 |
| 104 | 如何在 LangChain 中自定义 Tool 工具？ | 中等 | LangChain、Tool 工具 | - |
| 105 | LangChain 的 Memory 组件有什么作用？常见的 Memory 类型有哪些？ | 中等 | LangChain、Memory 记忆机制 | - |
| 106 | LangChain 中如何处理多模态数据？ | 中等 | LangChain、多模态 | - |
| 107 | 如何在 LangChain 中实现函数调用 Function Calling？ | 中等 | LangChain、Function Calling | - |
| 108 | LangChain 和 LlamaIndex 有什么区别？各自适合什么场景？ | 中等 | LangChain、LlamaIndex、框架对比 | - |
| 109 | 什么是 LangChain 中的 Agent？它和 Chain 有什么区别？ | 中等 | LangChain、Agent 智能体 | - |
| 110 | LangChain 中如何实现对话历史的管理和持久化？ | 中等 | LangChain、对话历史管理 | - |
| 111 | LangChain 中的 Callback 回调机制是什么？有什么用？ | 中等 | LangChain、Callback 回调 | - |
| 112 | 如何处理 LangChain 应用中的错误和异常？ | 中等 | LangChain、异常处理 | - |
| 113 | LangChain 中的 LCEL 表达式语言是什么？有什么优势？ | 中等 | LangChain、LCEL | - |
| 114 | LangChain 中如何实现条件分支和动态路由？ | 中等 | LangChain、条件路由 | - |
| 115 | LangChain 的未来发展趋势如何？有哪些值得关注的方向？ | 中等 | LangChain、技术趋势 | - |
| 116 | 在 LangChain 中如何实现流式输出？ | 中等 | LangChain、流式输出 | - |

## 6. 微调与训练优化（7 题）

覆盖 PEFT、全量微调、预训练模型选择、优化器、训练策略与效果评估。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 117 | PEFT 是什么？为什么需要 PEFT？ | 中等 | 大模型、AI、微调、PEFT | 11584 |
| 118 | 参数高效微调（PEFT）的核心思路是什么？列举 3 种典型方法 | 中等 | 大模型、AI、微调、PEFT | 11585 |
| 119 | PEFT 和全量微调的区别？ | 中等 | 大模型、AI、微调、PEFT | 11586 |
| 120 | 在进行 Fine-Tuning 时，如何选择适合的预训练模型？ | 中等 | 大模型、AI、微调、预训练模型 | 11587 |
| 121 | 微调中常用的优化器有哪些？ | 中等 | 大模型、AI、微调、优化器 | 11588 |
| 122 | 如何判断微调效果是否达到预期？ | 中等 | 大模型、AI、微调、评估指标 | 11589 |
| 123 | 介绍几种常见的微调策略的优缺点 | 中等 | 大模型、AI、微调、训练策略 | 11590 |

## 7. Transformer、注意力与多模态（24 题）

覆盖 Transformer 架构、Encoder/Decoder、注意力、多头机制、归一化、训练瓶颈、ViT/ViLT 和模型结构。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 124 | 讲一下你对 Transformer 的 Encoder 模块的理解。 | 中等 | Transformer、Encoder | 5189 |
| 125 | K 和 Q 可以使用同一个值通过对自身进行点乘得到吗？ | 中等 | Transformer | 5184 |
| 126 | 在进行多头注意力的时候需要对每个 head 进行降维吗？ | 中等 | Transformer、多头注意力机制 | 5188 |
| 127 | Transformer 中的"残差连接"可以缓解梯度消失问题吗？ | 中等 | Transformer、残差连接、梯度消失 | 5196 |
| 128 | Transformer 中的注意力遮蔽（Attention Masking）的工作原理是什么？ | 中等 | Transformer、注意力遮蔽 | 5193 |
| 129 | 了解 ViT（Vision Transformer） 吗？ | 中等 | Vision Transformer | 5202 |
| 130 | ViLT 模型是如何将 Transformer 应用于图像识别任务的 | 中等 | ViLT、图像识别 | 5204 |
| 131 | 为什么 Transformer 采用多头注意力机制？ | 中等 | Transformer、自注意力机制、多头注意力机制 | 5186 |
| 132 | Transformer 中如何实现序列到序列的映射？ | 中等 | Transformer、编解码器 | 5195 |
| 133 | Transformer 中，如何处理大型数据集？ | 中等 | Transformer | 5197 |
| 134 | chatGLM 和 GPT 在结构上有什么区别？ | 中等 | Transformer、语言模型 | 5205 |
| 135 | 了解 LLaMA 中的旋转位置编码吗？ | 中等 | 自然语言处理（NLP）、大语言模型、旋转位置编码 | 5128 |
| 136 | 了解 Transformer 模型训练中的梯度裁剪（Gradient Clipping）吗？ | 中等 | Transformer、梯度裁剪 | 5191 |
| 137 | 在不考虑计算量的情况下，head 能否无限增多？ | 中等 | Transformer、多头注意力机制 | 5187 |
| 138 | Transformer 为什么采用 Layer Normalization 而不是 Batch Normalization | 中等 | Transformer、normalization | 5192 |
| 139 | 什么是注意力机制？它是如何改善 NLP 模型性能的？ | 中等 | 自然语言处理（NLP）、注意力机制 | 5113 |
| 140 | 简述 LLaMA（Large Language Model Meta AI）的基本原理。 | 中等 | 自然语言处理（NLP）、大语言模型 | 5126 |
| 141 | 聊一聊 Transformer 的架构和基本原理。 | 中等 | Transformer | 5178 |
| 142 | 什么是自回归属性（autoregressive property）？ | 中等 | Transformer、自回归属性 | 5194 |
| 143 | Transformer 模型的性能瓶颈在哪？ | 中等 | Transformer | 5199 |
| 144 | Transformer 模型训练完成后，如何评估其性能和效果？ | 中等 | Transformer | 5198 |
| 145 | Transformer 的哪个部分最占用显存？ | 中等 | Transformer | 5180 |
| 146 | Transformer 在计算 attention 的时候使用的是点乘还是加法？请说明理由。 | 中等 | Transformer | 5182 |
| 147 | Transformer 中，Decoder 阶段的多头自注意力和 Encoder 阶段的多头自注意力是相同的吗？ | 中等 | Transformer、Encoder、Decoder、多头自注意力机制 | 5190 |

## 8. NLP、序列模型与词表示（17 题）

覆盖 LSTM/GRU、BERT、Word Embedding、Word2Vec、文本分类和多语种处理。

| 序号 | 题目 | 难度 | 标签 | 站内编号 |
| ---: | --- | :---: | --- | ---: |
| 148 | 请解释 LSTM 和 GRU 网络在处理序列数据中的应用。 | 中等 | 自然语言处理（NLP）、LSTM、GRU | 5112 |
| 149 | 简述 Word Embedding 可以怎样运用于文本分类任务？ | 中等 | 自然语言处理（NLP）、文本分类、Word Embedding | 5125 |
| 150 | LSTM 和 GRU 有什么区别？ | 中等 | 自然语言处理（NLP）、LSTM、GRU | 5111 |
| 151 | 解释一个 LSTM 单元（LSTM cell）的基本组成，以及它们各自的作用。 | 中等 | 自然语言处理（NLP）、LSTM | 5109 |
| 152 | LSTM 中，隐藏状态（hidden state）和单元状态（cell state）有什么区别？ | 中等 | 自然语言处理（NLP）、LSTM | 5110 |
| 153 | 在文本分类任务中，如何处理样本（类别）不平衡的问题？ | 中等 | 自然语言处理（NLP）、文本分类 | 5123 |
| 154 | CBOW 和 Skip-gram 分别更适合哪些应用场景？ | 中等 | 自然语言处理（NLP）、CBOW、Skip-gram | 5103 |
| 155 | Word2Vec 如何获取词向量？如何评估该训练得到的词向量的好坏？ | 中等 | 自然语言处理（NLP）、词嵌入、Word2Vec、词向量 | 5100 |
| 156 | 在文本分类任务中，如何处理高维和稀疏数据？ | 中等 | 自然语言处理（NLP）、文本分类 | 5122 |
| 157 | Word2Vec 到 BERT 有怎样的改进？ | 中等 | 自然语言处理（NLP）、BERT、Word2Vec | 5116 |
| 158 | 请描述 BERT 模型的架构和应用场景。 | 中等 | 自然语言处理（NLP）、BERT | 5114 |
| 159 | BERT 怎样进行 mask 相比 CBOW 有什么区别？ | 中等 | 自然语言处理（NLP）、BERT、CBOW | 5117 |
| 160 | 与循环神经网络（RNN）相比，LSTM 是如何解决梯度消失问题的？ | 中等 | 自然语言处理（NLP）、LSTM、RNN、梯度消失 | 5108 |
| 161 | BERT 是如何处理自然语言文本中不常见词或者罕见词的？ | 中等 | 自然语言处理（NLP）、BERT | 5115 |
| 162 | 现有文本分类算法在处理多语种文本数据时可能遭遇哪些挑战？ | 中等 | 自然语言处理（NLP）、文本分类 | 5124 |
| 163 | 说一说负采样技术在 Word2Vec 中的运用。 | 中等 | 自然语言处理（NLP）、词嵌入、Word2Vec、负采样 | 5102 |
| 164 | 什么是词嵌入（Word Embedding）？有哪些常见的词嵌入方法？ | 中等 | 自然语言处理（NLP）、词嵌入、Word2Vec | 5097 |
