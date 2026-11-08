import summaries from "@/data/question-index.json";
import type { Lang } from "./site";

export const topics = [
  { id: "llm", zh: "大模型基础与核心概念", en: "LLM foundations", description: "从 Token、参数到训练与推理，建立大模型知识框架。" },
  { id: "prompt", zh: "Prompt 与上下文工程", en: "Prompt & context engineering", description: "提示词结构、任务分解与长上下文管理。" },
  { id: "rag", zh: "RAG 检索增强生成", en: "Retrieval-augmented generation", description: "文档分块、向量检索与检索效果优化。" },
  { id: "agent", zh: "AI Agent 原理与设计", en: "AI agents", description: "从执行循环到工具调用，理解智能体如何完成任务。" },
  { id: "protocol", zh: "MCP、A2A 与多智能体协议", en: "MCP, A2A & protocols", description: "标准化工具连接与多智能体协作。" },
  { id: "framework", zh: "Agent 框架与应用开发", en: "Agent frameworks", description: "LangChain、LangGraph、Spring AI 与 OpenClaw。" },
  { id: "finetune", zh: "微调、对齐与模型优化", en: "Fine-tuning & alignment", description: "PEFT、LoRA、SFT、蒸馏、量化与训练优化。" },
  { id: "transformer", zh: "Transformer 与 NLP 基础", en: "Transformers & NLP", description: "注意力机制、模型架构、词表示与多模态基础。" },
  { id: "engineering", zh: "生产工程、评估与安全", en: "Evaluation & production", description: "模型评测、系统稳定性与安全边界。" },
] as const;
export type TopicId = (typeof topics)[number]["id"];
export type Difficulty = "简单" | "中等" | "困难";
export type TopicFilter = TopicId | "all";
export type DifficultyFilter = Difficulty | "all";
export interface QuestionSummary { id: string; number: number; title: string; level: Difficulty; category: TopicId; tags: string; sourceTopic: string }
export interface Question extends QuestionSummary { core: string; oral: string; pitfalls: string; source?: { url: string; title: string; date: string; checkedAt: string } }
export const questionIndex = summaries as QuestionSummary[];
export const text = (lang: Lang, zh: string, en: string) => lang === "zh" ? zh : en;
export const topicName = (id: TopicFilter, lang: Lang = "zh") => id === "all" ? text(lang, "全部知识", "All topics") : topics.find(topic => topic.id === id)?.[lang] || id;
export const topicCount = (id: TopicFilter) => id === "all" ? questionIndex.length : questionIndex.filter(question => question.category === id).length;
export const isTopic = (value: string | null): value is TopicId => topics.some(topic => topic.id === value);
export const difficultyName = (level: DifficultyFilter, lang: Lang) => lang === "zh" ? level === "all" ? "混合难度" : level : ({ all: "Mixed", 简单: "Easy", 中等: "Medium", 困难: "Hard" }[level]);
export function filterQuestions<T extends QuestionSummary>(items: T[], topic: TopicFilter = "all", level: DifficultyFilter = "all", query = ""): T[] {
  const term = query.trim().toLocaleLowerCase();
  return items.filter(item => (topic === "all" || item.category === topic) && (level === "all" || item.level === level) && (!term || `${item.title} ${item.tags}`.toLocaleLowerCase().includes(term)));
}
export function sampleQuestions<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, count));
}
