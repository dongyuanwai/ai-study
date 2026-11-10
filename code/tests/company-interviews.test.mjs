import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const interviews = JSON.parse(fs.readFileSync(new URL("../src/data/company-interviews.json", import.meta.url), "utf8"));
const bytedance = interviews.find(item => item.id === "bytedance-agent-first");
const pdd = interviews.find(item => item.id === "pdd-agent-backend-five-rounds");
test("公司真题包含字节一面与拼多多 5 轮面经，题号连续且 ID 唯一", () => {
  assert.equal(interviews.length, 2);
  assert.equal(bytedance.company, "字节跳动");
  assert.equal(bytedance.questions.length, 47);
  assert.deepEqual(bytedance.questions.map(question => question.number), Array.from({ length: 47 }, (_, i) => i + 1));
  assert.equal(new Set(bytedance.questions.map(question => question.id)).size, 47);
  const counts = {};
  for (const question of bytedance.questions) {
    assert.ok(question.title && question.topic);
    counts[question.group] = (counts[question.group] || 0) + 1;
  }
  assert.deepEqual(counts, { "项目追问": 35, "后端 / 服务化": 10, "手撕算法": 2 });
  assert.equal(pdd.company, "拼多多");
  assert.equal(pdd.questions.length, 45);
  assert.deepEqual(pdd.questions.map(question => question.number), Array.from({ length: 45 }, (_, i) => i + 1));
  assert.equal(new Set(pdd.questions.map(question => question.id)).size, 45);
  assert.equal(pdd.questions.filter(question => question.title.startsWith("追问：")).length, 20);
  assert.deepEqual(Object.fromEntries([...new Set(pdd.questions.map(question => question.group))].map(group => [group, pdd.questions.filter(question => question.group === group).length])), {
    "一面：项目深挖 + Agent 基础": 14,
    "二面：工程化 + 架构深挖": 16,
    "三面：系统设计 + 业务落地 + 交叉面": 7,
    "四面：部门面 / 交叉面": 4,
    "HR 面：薪资、稳定性、动机": 4,
  });
});
test("字节 47 题均有独立参考答案，来源信息不恢复", () => {
  for (const interview of interviews) {
    assert.ok(!("source" in interview));
    assert.ok(!("isMock" in interview));
    assert.ok(!("sourceQuestionId" in interview));
  }
  assert.ok(bytedance.answerNote.includes("非面试者原答"));
  assert.equal(new Set(bytedance.questions.map(question => question.answer)).size, bytedance.questions.length);
  for (const question of bytedance.questions) {
    for (const field of ["answer", "oral", "pitfalls"]) {
      assert.ok(typeof question[field] === "string" && question[field].trim(), `${question.id} 缺少 ${field}`);
      assert.ok(!question[field].includes("待补充"));
    }
    assert.ok(!("sourceQuestionId" in question));
  }
});
test("拼多多题目仅录入题干，未提供答案为 null", () => {
  assert.ok(!("answerNote" in pdd));
  for (const question of pdd.questions) {
    for (const field of ["title", "group", "topic"]) assert.ok(question[field]?.trim(), `${question.id} 缺少 ${field}`);
    for (const field of ["answer", "oral", "pitfalls"]) assert.equal(question[field], null, `${question.id} 的 ${field} 应为 null`);
    assert.ok(!("sourceQuestionId" in question));
  }
});
