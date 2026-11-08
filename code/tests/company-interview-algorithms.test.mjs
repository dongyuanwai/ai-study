import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const questions = JSON.parse(fs.readFileSync(new URL("../src/data/company-interviews.json", import.meta.url), "utf8"))[0].questions;
function implementation(number, exports) {
  const answer = questions.find(question => question.number === number).answer;
  assert.ok(!answer.includes("```python"), "算法题应使用 JavaScript");
  const code = /```javascript\n([\s\S]*?)```/.exec(answer)?.[1];
  assert.ok(code, `第 ${number} 题缺少 JavaScript 代码`);
  return vm.runInNewContext(`${code}\n({ ${exports} })`, {}, { timeout: 1000 });
}

test("页面中的链表算法返回正确节点，覆盖空链表、越界、非法 k，且不修改链表", () => {
  const { ListNode, kthFromEnd } = implementation(46, "ListNode, kthFromEnd");
  assert.equal(kthFromEnd(null, 1), null);
  for (let length = 1; length <= 30; length++) {
    const nodes = Array.from({ length }, (_, i) => new ListNode(i % 4));
    nodes.forEach((node, i) => { node.next = nodes[i + 1] || null; });
    const nextBefore = nodes.map(node => node.next);
    for (let k = 1; k <= length; k++) assert.equal(kthFromEnd(nodes[0], k), nodes[length - k]);
    for (const k of [0, -1, 1.5, NaN, Infinity, "1", length + 1]) assert.equal(kthFromEnd(nodes[0], k), null);
    assert.deepEqual(nodes.map(node => node.next), nextBefore);
  }
});

test("页面中的合并算法原地处理空数组、负数、重复值及 300 组确定性样例", () => {
  const { mergeSorted } = implementation(47, "mergeSorted");
  let seed = 47;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  const cases = [[[], []], [[], [1]], [[1], []], [[1, 2, 3], [2, 5, 6]], [[0, 0], [0]], [[-5, -1], [-3, 2]]];
  for (let i = 0; i < 300; i++) {
    const sorted = () => Array.from({ length: random() % 21 }, () => random() % 21 - 10).sort((a, b) => a - b);
    cases.push([sorted(), sorted()]);
  }
  for (const [left, right] of cases) {
    const nums1 = [...left, ...Array(right.length).fill(0)];
    const nums2 = [...right];
    assert.equal(mergeSorted(nums1, left.length, nums2, right.length), undefined);
    assert.deepEqual(nums1, [...left, ...right].sort((a, b) => a - b));
    assert.deepEqual(nums2, right);
  }
});
