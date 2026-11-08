import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const questions = JSON.parse(fs.readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"));
const index = JSON.parse(fs.readFileSync(new URL("../src/data/question-index.json", import.meta.url), "utf8"));

test("三份源题库完整保留，题目 ID 不重复", () => {
  const original = questions.filter(question => /^(easy|medium|hard)-/.test(question.id));
  assert.equal(original.length, 370);
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
  assert.deepEqual(Object.fromEntries(["简单", "中等", "困难"].map(level => [level, original.filter(question => question.level === level).length])), { 简单: 151, 中等: 164, 困难: 55 });
});
test("每道题都能找到核心回答、口述版与易错点", () => {
  const topics = new Set(["llm", "prompt", "rag", "agent", "protocol", "framework", "finetune", "transformer", "engineering"]);
  for (const question of questions) {
    assert.ok(question.title.trim() && topics.has(question.category), question.id);
    assert.ok(question.core.trim() && question.oral.trim() && question.pitfalls.trim(), question.id);
    assert.ok(question.sourceTopic && question.number > 0, question.id);
  }
});
test("轻量索引与完整答案一一对应，不把正文混入目录索引", () => {
  assert.deepEqual(index.map(question => question.id), questions.map(question => question.id));
  for (const question of index) assert.ok(!("core" in question) && !("oral" in question) && !("pitfalls" in question));
});
