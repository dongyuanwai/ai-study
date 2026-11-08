# Advanced RAG、Modular RAG、Agentic RAG

[总目录](../README.md) · [04 RAG 与知识检索](README.md)

共 3 题；简单 0 / 中等 3 / 困难 0。

## 题目目录

- [medium-36 · 什么是 Advanced RAG？](#medium-36)（中等）
- [medium-37 · 什么是 Modular RAG？](#medium-37)（中等）
- [concept-agentic-rag · Agentic RAG 如何处理一次检索无法回答的多跳问题？](#concept-agentic-rag)（中等）

---

<a id="medium-36"></a>

## medium-36 · 什么是 Advanced RAG？

- 难度：中等
- 原始分类：3. RAG、检索与向量数据库（42 题）
- 资料类型：原始面试题
- 标签：AI、大模型、RAG

### 核心回答

Advanced RAG 是在基础“切块→检索→生成”上加优化阶段的统称，不是单一标准架构。常见做法：检索前查询改写/路由，检索中混合召回与元数据过滤，检索后重排/去重/压缩，生成后引用校验与反馈。应先定位瓶颈，再添加必要模块，避免层数增加却没有净收益。

### 口述练习

Advanced RAG 就是围绕检索前、中、后优化基础 RAG，例如查询改写、混合检索、重排和引用校验。

### 易错点

不是所有项目都需要所有高级模块。

---

<a id="medium-37"></a>

## medium-37 · 什么是 Modular RAG？

- 难度：中等
- 原始分类：3. RAG、检索与向量数据库（42 题）
- 资料类型：原始面试题
- 标签：AI、大模型、RAG

### 核心回答

Modular RAG 把系统拆成可替换模块，如查询变换、路由、检索器、结果融合、后处理、上下文拼装与生成器，通过配置或工作流组合。它方便针对不同知识库选择不同链路，也便于单模块评测和替换。代价是接口、状态与观测更复杂，需要统一文档对象、错误语义和追踪 ID。

### 口述练习

模块化 RAG 的重点是可组合、可替换和可观测，便于按场景定制检索链路。

### 易错点

把所有逻辑塞进一个大 Prompt，不算模块化。

---

<a id="concept-agentic-rag"></a>

## concept-agentic-rag · Agentic RAG 如何处理一次检索无法回答的多跳问题？

- 难度：中等
- 原始分类：新概念研读
- 资料类型：补充研读
- 标签：Agentic RAG、查询规划、跨库检索、证据充分性
- 来源：[Unlocking dependable responses with Gemini Enterprise Agent Platform’s Agentic RAG](https://research.google/blog/unlocking-dependable-responses-with-gemini-enterprise-agent-platforms-agentic-rag/)
- 来源日期：2026-06-05；核对日期：2026-11-08

### 核心回答

先分解问题并确定检索路径，再改写查询、从不同来源收集材料；若证据不足，继续检索。比如先找项目使用的设备编号，再用编号查询设备规格。

关键是检查上下文是否足以支撑回答，而不是检索一次就直接生成结论。

### 口述练习

把检索变成可规划、可补查的过程，先确认信息够不够，再组织答案。

### 易错点

- 多智能体数量并不直接代表回答质量。
- 多轮检索仍有延迟、成本及错误累积问题。
- 2026 年节点是具体方案介绍，不是术语起点。
