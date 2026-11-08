import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const interviews = JSON.parse(fs.readFileSync(new URL("../src/data/company-interviews.json", import.meta.url), "utf8"));
test("公司真题仅保留字节一面，完整包含 35+10+2 题及连续编号", () => {
  assert.equal(interviews.length, 1);
  const interview = interviews[0];
  assert.equal(interview.company, "字节跳动");
  assert.equal(interview.questions.length, 47);
  assert.deepEqual(interview.questions.map(question => question.number), Array.from({ length: 47 }, (_, i) => i + 1));
  assert.equal(new Set(interview.questions.map(question => question.id)).size, 47);
  const counts = {};
  for (const question of interview.questions) {
    assert.ok(question.title && question.topic);
    counts[question.group] = (counts[question.group] || 0) + 1;
  }
  assert.deepEqual(counts, { "项目追问": 35, "后端 / 服务化": 10, "手撕算法": 2 });
});
test("47 题均有独立参考答案，来源信息不恢复", () => {
  for (const interview of interviews) {
    assert.ok(!("source" in interview));
    assert.ok(!("isMock" in interview));
    assert.ok(interview.answerNote.includes("非面试者原答"));
    assert.equal(new Set(interview.questions.map(question => question.answer)).size, interview.questions.length);
    for (const question of interview.questions) {
      for (const field of ["answer", "oral", "pitfalls"]) {
        assert.ok(typeof question[field] === "string" && question[field].trim(), `${question.id} 缺少 ${field}`);
        assert.ok(!question[field].includes("待补充"));
      }
      assert.ok(!("sourceQuestionId" in question));
    }
  }
});
