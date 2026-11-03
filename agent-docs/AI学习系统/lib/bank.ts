import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { updates } from "./updates";
import { web3Questions } from "./web3-questions";
import type { Answer, Difficulty, Question, Topic } from "./types";

const definitions = [
  { id: "easy", label: "简单", expected: 151 },
  { id: "medium", label: "中等", expected: 164 },
  { id: "hard", label: "困难", expected: 55 },
] as const;

const topicDefinitions = [
  ["基础概念", "模型能力、Token、训练与推理", "violet"],
  ["Prompt 与上下文", "提示设计、上下文工程与压缩", "blue"],
  ["RAG 检索增强", "建库、召回、重排与效果评估", "teal"],
  ["Agent 原理", "规划、记忆、工具与多智能体", "orange"],
  ["MCP 与 A2A", "工具协议与 Agent 互操作", "pink"],
  ["开发框架", "LangChain、Spring AI 与工程集成", "indigo"],
  ["微调与对齐", "SFT、LoRA、偏好优化与训练", "green"],
  ["Transformer 与 NLP", "注意力、序列模型和词表示", "cyan"],
  ["生产工程与安全", "架构、评估、性能与安全", "amber"],
  ["JS/TS 与 Solidity", "JavaScript、TypeScript、智能合约与 Web3 前端", "blue"],
] as const;

const topicByCategory: Record<string, number> = {
  "medium-1": 9, "medium-2": 2, "medium-3": 3, "medium-4": 4,
  "medium-5": 6, "medium-6": 7, "medium-7": 8, "medium-8": 8,
  "hard-1": 7, "hard-2": 4, "hard-3": 3, "hard-4": 8, "hard-5": 9,
};

const topicOverrides: Record<string, number> = {
  "medium-1": 1, "medium-6": 1,
  "medium-70": 5, "medium-71": 5, "medium-77": 5, "medium-94": 5,
  "hard-12": 6, "hard-22": 6, "hard-23": 6, "hard-24": 6,
  "hard-25": 6, "hard-27": 6, "hard-33": 2, "hard-34": 2,
  "hard-35": 2, "hard-38": 9, "hard-40": 9, "hard-54": 3,
};

function topicId(questionId: string, categoryId: string): string {
  const number = topicOverrides[questionId] ?? topicByCategory[categoryId] ?? Number(categoryId.slice(5));
  if (!Number.isInteger(number) || number < 1 || number > topicDefinitions.length) throw new Error(`未知专题：${questionId}`);
  return `topic-${number}`;
}

function cleanLabel(value: string): string {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[\u200B\uFEFF]/g, "").trim();
}

// Default layout, local and on Vercel: this app's cwd is `agent-docs/AI学习系统`
// (the Vercel launcher chdirs there) and the six bank files are its parent.
// Leave AI_BANK_DIR unset. A relative value such as `agent-docs` is resolved
// from that cwd and misses the files; on Vercel the only useful override is
// the absolute path `/var/task/agent-docs`.
function sourceRoot(): string {
  return process.env.AI_BANK_DIR ? resolve(process.env.AI_BANK_DIR) : resolve(process.cwd(), "..");
}

function parseQuestions(markdown: string, difficulty: Difficulty): Question[] {
  const questions: Question[] = [];
  let categoryId = "";
  let expectedInCategory = 0;
  let observedInCategory = 0;
  const checkCategory = () => {
    if (categoryId && observedInCategory !== expectedInCategory) {
      throw new Error(`${categoryId} 题数不符：${observedInCategory}/${expectedInCategory}`);
    }
  };
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = line.match(/^##\s+(\d+)\.\s+(.+?)（(\d+)\s*题）\s*$/);
    if (heading) {
      checkCategory();
      categoryId = `${difficulty}-${Number(heading[1])}`;
      expectedInCategory = Number(heading[3]);
      observedInCategory = 0;
      continue;
    }
    if (!categoryId || !line.trim().startsWith("|")) continue;
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
    if (!/^\d+$/.test(cells[0] ?? "")) continue;
    const number = Number(cells[0]);
    const id = `${difficulty}-${number}`;
    questions.push({
      id,
      number,
      title: cleanLabel(cells[1] ?? ""),
      difficulty,
      topicId: topicId(id, categoryId),
      originalCategory: categoryId,
      tags: cleanLabel(cells[3] ?? "").split(/[、,，]/).map(tag => tag.trim()).filter(Boolean),
      answer: { core: "", oral: "", pitfalls: "" },
    });
    observedInCategory++;
  }
  checkCategory();
  questions.forEach((question, index) => {
    if (question.number !== index + 1 || !question.title) throw new Error(`${difficulty} 题号或题干异常：${question.id}`);
  });
  return questions;
}

function trimSection(lines: string[]): string {
  const result = [...lines];
  while (result.length && (!result.at(-1)?.trim() || /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(result.at(-1)!))) result.pop();
  while (result.length && !result[0].trim()) result.shift();
  return result.join("\n");
}

function parseAnswers(markdown: string): Map<number, { title: string; answer: Answer }> {
  const entries = new Map<number, { title: string; sections: Record<keyof Answer, string[]> }>();
  let current: { title: string; sections: Record<keyof Answer, string[]> } | null = null;
  let section: keyof Answer | null = null;
  let fence: { character: string; length: number } | null = null;
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (current && section) current.sections[section].push(line);
      if (fenceMatch && fenceMatch[1][0] === fence.character && fenceMatch[1].length >= fence.length && !fenceMatch[2].trim()) fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = { character: fenceMatch[1][0], length: fenceMatch[1].length };
      if (current && section) current.sections[section].push(line);
      continue;
    }
    const heading = line.match(/^###\s+(\d+)\.\s+(.+?)\s*$/);
    if (heading) {
      const number = Number(heading[1]);
      if (entries.has(number)) throw new Error(`答案题号重复：${number}`);
      current = { title: cleanLabel(heading[2]), sections: { core: [], oral: [], pitfalls: [] } };
      entries.set(number, current);
      section = null;
      continue;
    }
    const answerHeading = line.match(/^####\s+(.+?)\s*$/);
    if (answerHeading) {
      section = ({ "核心回答": "core", "面试口述版": "oral", "易错点": "pitfalls" } as Record<string, keyof Answer>)[answerHeading[1]] ?? null;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      current = null;
      section = null;
      continue;
    }
    if (current && section) current.sections[section].push(line);
  }
  if (fence) throw new Error("答案 Markdown 有未闭合代码块");
  return new Map([...entries].map(([number, entry]) => [number, {
    title: entry.title,
    answer: {
      core: trimSection(entry.sections.core),
      oral: trimSection(entry.sections.oral),
      pitfalls: trimSection(entry.sections.pitfalls),
    },
  }]));
}

function loadBaseQuestions(): Question[] {
  const root = sourceRoot();
  const all: Question[] = [];
  for (const definition of definitions) {
    const questionText = readFileSync(resolve(root, `AI大模型面试题库-${definition.label}题.md`), "utf8");
    const answerText = readFileSync(resolve(root, `AI大模型面试题库-${definition.label}题-答案.md`), "utf8");
    const questions = parseQuestions(questionText, definition.id);
    const answers = parseAnswers(answerText);
    if (questions.length !== definition.expected || answers.size !== definition.expected) {
      throw new Error(`${definition.label}题数量不符：题目 ${questions.length}、答案 ${answers.size}`);
    }
    for (const question of questions) {
      const entry = answers.get(question.number);
      if (!entry || entry.title !== question.title || !entry.answer.core || !entry.answer.oral || !entry.answer.pitfalls) {
        throw new Error(`${question.id} 题目与答案无法匹配`);
      }
      question.answer = entry.answer;
    }
    all.push(...questions);
  }
  return all;
}

let cachedQuestions: Question[] | null = null;
export function getQuestions(): Question[] {
  cachedQuestions ??= [...loadBaseQuestions(), ...web3Questions, ...updates];
  return cachedQuestions;
}

export function getQuestion(id: string): Question | undefined {
  return getQuestions().find(question => question.id === id);
}

export function getTopics(): Topic[] {
  const questions = getQuestions();
  return topicDefinitions.map(([name, description, accent], index) => ({
    id: `topic-${index + 1}`,
    name,
    description,
    accent,
    count: questions.filter(question => question.topicId === `topic-${index + 1}`).length,
  }));
}

export function getTopic(id: string): Topic | undefined {
  return getTopics().find(topic => topic.id === id);
}

export function getBankCounts() {
  const questions = getQuestions();
  return {
    base: questions.filter(question => question.difficulty !== "latest").length,
    latest: updates.length,
    total: questions.length,
  };
}
