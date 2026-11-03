# 按专题分组的面试题 JSON

这组文件把同目录上一级的三份难度题库（简单 / 中等 / 困难，共 **370** 题）按专题重新分组，而不是按难度。入口是 `index.json`：`grouping` 为按专题（topic），`totalQuestions` 为 370，`topics` 列出 9 个文件及各自题数。

题目 `id` 仍保留原难度前缀：`easy-`、`medium-`、`hard-`（分别对应简单、中等、困难）。

| 文件 | topicId | 专题 | 题数 |
| --- | --- | --- | --- |
| `01-jichu-gainian.json` | `topic-1` | 基础概念 | 15 |
| `02-prompt-yujing.json` | `topic-2` | Prompt 与上下文 | 39 |
| `03-rag.json` | `topic-3` | RAG 检索增强 | 67 |
| `04-agent-yuanli.json` | `topic-4` | Agent 原理 | 59 |
| `05-mcp-a2a.json` | `topic-5` | MCP 与 A2A | 23 |
| `06-kaifa-kuangjia.json` | `topic-6` | 开发框架 | 47 |
| `07-weitiao.json` | `topic-7` | 微调与对齐 | 41 |
| `08-transformer-nlp.json` | `topic-8` | Transformer 与 NLP | 59 |
| `09-shengchan-anquan.json` | `topic-9` | 生产工程与安全 | 20 |

## 专题文件结构

每个专题文件是一个对象：

- `topicId`：专题 id，例如 `topic-1`
- `name`：专题名称
- `description`：一句话说明
- `count`：`questions` 的长度
- `questions`：题目数组

每道题：

- `id`：稳定标识，前缀为 `easy-` / `medium-` / `hard-`
- `index`：该题在原难度题库中的序号
- `title`：题干
- `difficulty`：`easy`、`medium` 或 `hard`
- `tags`：标签字符串数组
- `originalCategory`：原难度题库中的分类 id
- `originalCategoryName`：原分类名称
- `answer.core`：核心回答
- `answer.oral`：口述版
- `answer.pitfalls`：易错点

`index.json` 另含 `schemaVersion`、`sourceRepo` 和 `grouping`。学习台与学习系统仍从 Markdown 题库读取；这里只提供按专题整理好的 JSON。
