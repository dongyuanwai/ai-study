import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = relative => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), "utf8"));
const supplement = read("../../agent-docs/ai-concepts-supplement.json");
const questions = read("../src/data/questions.json");
const timeline = read("../src/data/ai-timeline.json");

test("补充知识完整导入，原始来源及三段式答案不会在导入时丢失", () => {
  assert.deepEqual(questions.filter(item => item.id.startsWith("concept-")), supplement);
  for (const item of supplement) {
    assert.ok(item.core && item.oral && item.pitfalls);
    assert.equal(new URL(item.source.url).protocol, "https:");
    assert.ok(item.source.title && item.source.checkedAt);
    assert.ok(Date.parse(item.source.date) <= Date.parse(item.source.checkedAt));
  }
});
test("时间轴顺序、事件类型和题目关联有效", () => {
  const ids = new Set(questions.map(item => item.id));
  assert.equal(new Set(timeline.map(item => item.id)).size, timeline.length);
  assert.deepEqual(timeline.map(item => item.date), timeline.map(item => item.date).sort());
  for (const item of timeline) {
    assert.match(item.date, /^\d{4}-\d{2}(-\d{2})?$/);
    assert.ok(["paper", "release", "article"].includes(item.kind), item.id);
    assert.ok(["models", "tuning", "knowledge", "agents"].includes(item.category), item.id);
    assert.ok(item.title.zh && item.title.en && item.description.zh && item.description.en);
    assert.equal(new URL(item.source.url).protocol, "https:");
    for (const id of item.questionIds) assert.ok(ids.has(id), `${item.id} 引用了不存在的 ${id}`);
  }
  for (const question of supplement) assert.ok(timeline.some(item => item.questionIds.includes(question.id)), `${question.id} 未关联时间轴`);
});
