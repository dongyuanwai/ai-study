import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const source = fileURLToPath(new URL("../../agent-docs/", import.meta.url));
const output = fileURLToPath(new URL("../src/data/", import.meta.url));
// 主类映射来自原文分类；保留 sourceTopic 和题目编号，不自动合并近似题。
const mappings = {
  简单: { 1: "llm", 2: "prompt", 3: "rag", 4: "agent", 5: "protocol", 6: "framework", 7: "finetune", 8: "transformer", 9: "engineering" },
  中等: { 1: "llm", 2: "prompt", 3: "rag", 4: "agent", 5: "framework", 6: "finetune", 7: "transformer", 8: "transformer" },
  困难: { 1: "finetune", 2: "agent", 3: "rag", 4: "transformer", 5: "engineering" },
};
const keys = { 简单: "easy", 中等: "medium", 困难: "hard" };
const records = [];
for (const level of Object.keys(mappings)) {
  const questionText = await fs.readFile(path.join(source, `AI大模型面试题库-${level}题.md`), "utf8");
  const answerText = await fs.readFile(path.join(source, `AI大模型面试题库-${level}题-答案.md`), "utf8");
  const sections = answerText.split(/^### (\d+)\. .+\r?\n/gm), answers = new Map();
  for (let index = 1; index < sections.length; index += 2) {
    const content = sections[index + 1].split(/^## /m)[0];
    const fields = content.split(/^#### (.+)\r?$/gm), answer = {};
    for (let field = 1; field < fields.length; field += 2) answer[fields[field].trim()] = fields[field + 1].trim().replace(/\n---\s*$/, "").trim();
    answers.set(Number(sections[index]), answer);
  }
  let sourceTopic = "", levelCount = 0;
  for (const line of questionText.split("\n")) {
    if (/^## \d+\./.test(line)) sourceTopic = line.slice(3).trim();
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.replace(/^\||\|\s*$/g, "").split("|").map(value => value.trim());
    const number = Number(cells[0]), category = mappings[level][Number(sourceTopic.match(/^\d+/)?.[0])], answer = answers.get(number);
    assert.ok(category && answer, `${level} ${number} 缺少分类或答案`);
    assert.ok(answer["核心回答"] && answer["面试口述版"] && answer["易错点"], `${level} ${number} 的答案结构不完整`);
    records.push({ id: `${keys[level]}-${number}`, number, title: cells[1], level, category, sourceTopic, tags: cells[3] || "", core: answer["核心回答"], oral: answer["面试口述版"], pitfalls: answer["易错点"] });
    levelCount++;
  }
  assert.equal(levelCount, Number(questionText.match(/题目总数：\s*(\d+)/)?.[1]), `${level}题目数量与文档声明不一致`);
}
const supplement = JSON.parse(await fs.readFile(path.join(source, "ai-concepts-supplement.json"), "utf8"));
assert.ok(Array.isArray(supplement), "补充知识必须为数组");
const topicIds = new Set(Object.values(mappings).flatMap(mapping => Object.values(mapping)));
for (const question of supplement) {
  assert.match(question.id, /^concept-[a-z0-9-]+$/, "补充知识需要稳定的 concept- ID");
  assert.ok(topicIds.has(question.category) && Object.hasOwn(keys, question.level), `${question.id} 分类或难度无效`);
  assert.ok(Number.isInteger(question.number) && question.number > 0, `${question.id} 编号无效`);
  for (const key of ["title", "sourceTopic", "tags", "core", "oral", "pitfalls"]) assert.ok(typeof question[key] === "string" && question[key].trim(), `${question.id} 缺少 ${key}`);
  assert.ok(question.source?.title && new URL(question.source.url).protocol === "https:", `${question.id} 缺少来源`);
  for (const key of ["date", "checkedAt"]) assert.ok(/^\d{4}-\d{2}(-\d{2})?$/.test(question.source[key]) && Number.isFinite(Date.parse(question.source[key])), `${question.id} 日期无效`);
  records.push(question);
}
assert.equal(new Set(records.map(question => question.id)).size, records.length, "题目 ID 重复");
await fs.mkdir(output, { recursive: true });
const summaries = records.map(({ core, oral, pitfalls, ...summary }) => summary);
await fs.writeFile(path.join(output, "questions.json"), JSON.stringify(records, null, 2) + "\n");
await fs.writeFile(path.join(output, "question-index.json"), JSON.stringify(summaries, null, 2) + "\n");
console.log(`已导入 ${records.length} 条题目及三段式参考答案；包含原始 Markdown 题库和带来源的补充知识，未读取旧应用代码。`);
