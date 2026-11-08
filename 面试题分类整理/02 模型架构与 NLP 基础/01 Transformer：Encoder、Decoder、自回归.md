# Transformer：Encoder、Decoder、自回归

[总目录](../README.md) · [02 模型架构与 NLP 基础](README.md)

共 7 题；简单 2 / 中等 5 / 困难 0。

## 题目目录

- [easy-134 · 使用 Transformer 解决了 RNN 面临的一些什么问题？](#easy-134)（简单）
- [easy-137 · Transformer 和 LLM 有哪些区别](#easy-137)（简单）
- [medium-124 · 讲一下你对 Transformer 的 Encoder 模块的理解。](#medium-124)（中等）
- [medium-132 · Transformer 中如何实现序列到序列的映射？](#medium-132)（中等）
- [medium-141 · 聊一聊 Transformer 的架构和基本原理。](#medium-141)（中等）
- [medium-142 · 什么是自回归属性（autoregressive property）？](#medium-142)（中等）
- [medium-147 · Transformer 中，Decoder 阶段的多头自注意力和 Encoder 阶段的多头自注意力是相同的吗？](#medium-147)（中等）

---

<a id="easy-134"></a>

## easy-134 · 使用 Transformer 解决了 RNN 面临的一些什么问题？

- 难度：简单
- 原始分类：8. Transformer 与 NLP 基础（7 题）
- 资料类型：原始面试题
- 标签：Transformer、RNN

### 核心回答

RNN 按序列位置逐步更新隐藏状态，后一个位置依赖前一个位置，训练难以在时间维度充分并行。距离很远的信息还要经过多次状态传递，普通 RNN 容易出现梯度消失或爆炸，长距离关系较难学习。

Transformer 使用自注意力，让一个位置直接聚合其他位置的信息，并通过矩阵运算提高训练并行度。这是 [Attention Is All You Need](https://arxiv.org/abs/1706.03762) 的核心架构变化。

例如，分析一段很长的描述时，末尾代词可以直接关注前面相关实体，减少仅靠逐步状态传递的负担。但注意力是否正确仍需通过训练获得，不能理解成所有位置都能完美互相理解。典型稠密自注意力对长度具有平方级的注意力计算开销，长序列仍然昂贵；稀疏或其他变体可能采用不同复杂度。

训练时已知目标序列，因果遮罩允许并行计算各位置的损失；自回归生成时，下一个 Token 依赖刚生成的内容，仍通常逐步解码。两种阶段需要区分。

### 口述练习

Transformer 主要改善了 RNN 的序列并行训练和长距离信息交互问题。自注意力让远处位置直接联系，训练更适合矩阵计算。但长序列注意力仍有成本，自回归生成也仍存在逐 Token 的依赖。

### 易错点

- “训练可并行”不等于自回归输出可以一次全部生成。
- 平方复杂度描述典型稠密注意力，不能套用到所有变体和实现。

---

<a id="easy-137"></a>

## easy-137 · Transformer 和 LLM 有哪些区别

- 难度：简单
- 原始分类：8. Transformer 与 NLP 基础（7 题）
- 资料类型：原始面试题
- 标签：Transformer、LLM

### 核心回答

Transformer 是一种神经网络架构，LLM 是大规模语言模型这一模型类别。一个描述网络如何计算，另一个描述模型的规模、训练对象和能力定位，两者不是同一层级的概念。

Transformer 可以采用编码器、解码器或编码器—解码器结构，用于文本、图像、语音和多模态任务。LLM 通常通过大规模语言数据预训练，再做指令微调与对齐；目前许多生成式 LLM 基于 Transformer 解码器，但语言模型并不被概念上限定为这一种架构。

例如，一个小型 Transformer 文本分类器并不因为使用了注意力就自动成为通用 LLM；大型生成式模型则还需要训练数据、语言建模目标、Token 化、规模和后训练共同形成能力。实际应用中，模型调用还依赖推理服务、上下文管理和工具集成，这些也不是 Transformer 架构本身提供的。

因此面试时应分别讨论“架构选择”和“模型能力”：前者关注注意力、位置编码及计算成本，后者关注训练、任务表现、幻觉和部署要求。

### 口述练习

Transformer 是网络架构，LLM 是大规模语言模型类别。很多 LLM 使用 Transformer，但 Transformer 也能做视觉、语音或小规模任务。模型能力来自架构、规模、数据和训练的共同作用。

### 易错点

- 使用 Transformer 不等于一定是 LLM，更不等于具备 Agent 能力。
- LLM 没有一个适用于所有场景的硬性参数量分界。

---

<a id="medium-124"></a>

## medium-124 · 讲一下你对 Transformer 的 Encoder 模块的理解。

- 难度：中等
- 原始分类：7. Transformer、注意力与多模态（24 题）
- 资料类型：原始面试题
- 标签：Transformer、Encoder

### 核心回答

Encoder 把输入 Token 嵌入并加入位置信息，经过多层双向自注意力和逐位置前馈网络，每个子层带残差与归一化，输出融合上下文的表示。双向注意力让每个位置可依赖其他可见位置；可用 padding mask 忽略填充。原始 Encoder-Decoder Transformer 的 Decoder 通过交叉注意力读取 Encoder 输出，而 BERT 类模型可直接用 Encoder 做理解任务。

### 口述练习

Encoder 通过多层双向自注意力和前馈网络，把每个 Token 变成上下文化表示。

### 易错点

Encoder 不直接负责逐 Token 自回归生成。

---

<a id="medium-132"></a>

## medium-132 · Transformer 中如何实现序列到序列的映射？

- 难度：中等
- 原始分类：7. Transformer、注意力与多模态（24 题）
- 资料类型：原始面试题
- 标签：Transformer、编解码器

### 核心回答

在原始 Encoder-Decoder 架构中，Encoder 将输入序列变成上下文化表示；Decoder 用因果自注意力读取已生成前缀，用交叉注意力读取 Encoder 输出，预测下一个 Token，重复直到结束符。训练通常用目标序列右移后的 Teacher Forcing 并行计算位置损失；推理必须按 Token 自回归生成。现代纯 Decoder LLM 可把输入和输出拼成同一序列完成类似任务。

### 口述练习

Encoder 编码输入，Decoder 边看已有输出边通过交叉注意力读取输入，逐步生成目标序列。

### 易错点

训练并行计算目标位置，不代表推理能一次得到全部未来 Token。

---

<a id="medium-141"></a>

## medium-141 · 聊一聊 Transformer 的架构和基本原理。

- 难度：中等
- 原始分类：7. Transformer、注意力与多模态（24 题）
- 资料类型：原始面试题
- 标签：Transformer

### 核心回答

原始 Transformer 由 Encoder 和 Decoder 堆叠而成，核心子层是缩放点积多头注意力和逐位置前馈网络，辅以位置编码、残差连接与归一化。注意力计算可写为 `softmax(QKᵀ/√d_k)V`。Encoder 使用双向自注意力，Decoder 用因果自注意力和对 Encoder 的交叉注意力。现代模型可只保留 Encoder（理解）、Decoder（生成）或完整编解码结构。

### 口述练习

Transformer 用注意力替代循环来建模序列，靠位置编码保留顺序，并用残差/归一化稳定深层训练。

### 易错点

Transformer 不是只有“注意力”；前馈网络、Mask 和位置处理同样关键。

---

<a id="medium-142"></a>

## medium-142 · 什么是自回归属性（autoregressive property）？

- 难度：中等
- 原始分类：7. Transformer、注意力与多模态（24 题）
- 资料类型：原始面试题
- 标签：Transformer、自回归属性

### 核心回答

自回归指当前输出依赖此前已知或已生成的内容，语言模型通常分解为 `P(x₁,…,xₙ)=∏ₜP(xₜ|x₍<t₎)`。训练时可用因果 Mask 同时计算各位置的预测损失；推理时必须按顺序生成下一个 Token，并把它追加到上下文。KV Cache 能避免重复计算已有前缀，但不能让未来 Token 在未生成前被读取。

### 口述练习

自回归模型按“前文预测下一个 Token”的条件概率链生成文本。

### 易错点

Teacher Forcing 下训练可并行，不表示推理非自回归。

---

<a id="medium-147"></a>

## medium-147 · Transformer 中，Decoder 阶段的多头自注意力和 Encoder 阶段的多头自注意力是相同的吗？

- 难度：中等
- 原始分类：7. Transformer、注意力与多模态（24 题）
- 资料类型：原始面试题
- 标签：Transformer、Encoder、Decoder、多头自注意力机制

### 核心回答

核心 Q/K/V 多头计算形式相似，但可见性不同：Encoder 自注意力通常双向看完整输入（除 padding），Decoder 自注意力用因果 Mask 防止看到未来目标 Token。原始 Encoder-Decoder 的 Decoder 还多一层交叉注意力，Q 来自 Decoder，K/V 来自 Encoder。参数也分别学习，不能视为同一层共享。

### 口述练习

计算形式类似，但 Decoder 自注意力有因果遮蔽，并且原始架构还会读取 Encoder 的交叉注意力。

### 易错点

不要把 Decoder 的自注意力和交叉注意力混为一谈。
