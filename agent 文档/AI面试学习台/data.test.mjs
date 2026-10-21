import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildData, createPatch, getStats, parseAnswers, parseChunkArguments, parseQuestions, patchCharacters, removeInterviewWord, renderHtml, serializeData } from './build.mjs';

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = dirname(projectDirectory);
const data = buildData();

test('all 370 questions and 22 categories are present with distinct ids', () => {
  assert.equal(data.questions.length, 370);
  assert.equal(data.categories.length, 22);
  assert.equal(new Set(data.questions.map(question => question.id)).size, 370);
  assert.equal(new Set(data.categories.map(category => category.id)).size, 22);
  assert.deepEqual(data.difficulties.map(({ id, count, answeredCount }) => ({ id, count, answeredCount })), [
    { id: 'easy', count: 151, answeredCount: 151 },
    { id: 'medium', count: 164, answeredCount: 164 },
    { id: 'hard', count: 55, answeredCount: 55 },
  ]);
  assert.equal(getStats(data).answered, 370);
});

test('every title, number, tag and category matches the source documents', () => {
  for (const [difficulty, file] of [
    ['easy', 'AI大模型面试题库-简单题.md'],
    ['medium', 'AI大模型面试题库-中等题.md'],
    ['hard', 'AI大模型面试题库-困难题.md'],
  ]) {
    const markdown = readFileSync(join(sourceDirectory, file), 'utf8');
    const independentRows = [...markdown.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)];
    const questions = data.questions.filter(question => question.difficulty === difficulty);
    assert.equal(questions.length, independentRows.length);
    questions.forEach((question, index) => {
      assert.equal(question.number, Number(independentRows[index][1]));
      assert.equal(question.title, independentRows[index][2].trim());
      assert.ok(data.categories.some(category => category.id === question.category && category.difficulty === difficulty));
      assert.ok(Array.isArray(question.tags));
      assert.ok(!question.title.includes('VIP'));
      assert.ok(!question.title.includes('https://'));
    });
    const reparsed = parseQuestions(markdown, difficulty);
    assert.deepEqual(reparsed.questions.map(({ title, tags, category }) => ({ title, tags, category })), questions.map(({ title, tags, category }) => ({ title, tags, category })));
  }
});

test('all 151 easy answers preserve three nonempty Markdown sections', () => {
  const original = readFileSync(join(sourceDirectory, 'AI大模型面试题库-简单题-答案.md'), 'utf8');
  const headings = [...original.matchAll(/^### (\d+)\. (.+)$/gm)];
  const easy = data.questions.filter(question => question.difficulty === 'easy');
  assert.equal(headings.length, 151);
  for (const [index, question] of easy.entries()) {
    assert.equal(question.title, headings[index][2]);
    assert.deepEqual(Object.keys(question.answer), ['core', 'oral', 'pitfalls']);
    for (const text of Object.values(question.answer)) {
      assert.ok(text.trim().length > 15, `${question.id} 的答案段太短`);
      assert.ok(!text.includes('### 本分类速记'));
      assert.ok(!/^### 第 \d+ 类参考资料/m.test(text));
    }
  }
  assert.match(easy[0].answer.core, /Tokenizer/);
  assert.match(easy.at(-1).answer.core, /权限|安全/);
  assert.ok(easy.some(question => question.answer.core.includes('```json')));
  assert.ok(easy.some(question => /^\|.+\|$/m.test(question.answer.core)));
});

test('all 164 medium answers match the source and have three nonempty sections', () => {
  const original = readFileSync(join(sourceDirectory, 'AI大模型面试题库-中等题-答案.md'), 'utf8');
  const headings = [...original.matchAll(/^### (\d+)\. (.+)$/gm)];
  const medium = data.questions.filter(question => question.difficulty === 'medium');
  assert.equal(headings.length, 164);
  for (const [index, question] of medium.entries()) {
    assert.equal(question.number, Number(headings[index][1]));
    assert.equal(question.title, headings[index][2]);
    assert.deepEqual(Object.keys(question.answer), ['core', 'oral', 'pitfalls']);
    for (const text of Object.values(question.answer)) assert.ok(text.trim().length > 15, `${question.id} 的答案段太短`);
  }
});

test('all 55 hard answers match the source and have three nonempty sections', () => {
  const original = readFileSync(join(sourceDirectory, 'AI大模型面试题库-困难题-答案.md'), 'utf8');
  const headings = [...original.matchAll(/^### (\d+)\. (.+)$/gm)];
  const hard = data.questions.filter(question => question.difficulty === 'hard');
  assert.equal(headings.length, 55);
  for (const [index, question] of hard.entries()) {
    assert.equal(question.number, Number(headings[index][1]));
    assert.equal(question.title, headings[index][2]);
    assert.deepEqual(Object.keys(question.answer), ['core', 'oral', 'pitfalls']);
    for (const text of Object.values(question.answer)) assert.ok(text.trim().length > 15, `${question.id} 的答案段太短`);
  }
});

test('fenced headings and code stay in their section while references are excluded', () => {
  const markdown = [
    '## 1. 测试（1 题）',
    '### 1. 标题',
    '#### 核心回答',
    '```json',
    '{"text": "<script>"}',
    '### 99. 这仍然是代码',
    '```',
    '| 列 | 列 |',
    '| --- | --- |',
    '| A | B |',
    '#### 面试口述版',
    '口述文本',
    '#### 易错点',
    '- 易错点文本',
    '',
    '---',
    '',
    '### 本分类速记',
    '不可并入答案',
    '### 第 1 类参考资料',
    '不可并入答案',
  ].join('\n');
  const parsed = parseAnswers(markdown);
  assert.equal(parsed.size, 1);
  assert.match(parsed.get(1).answer.core, /### 99\. 这仍然是代码/);
  assert.match(parsed.get(1).answer.core, /\| A \| B \|/);
  assert.equal(parsed.get(1).answer.pitfalls, '- 易错点文本');
});

test('embedded JSON cannot break out of its script and roundtrips unchanged', () => {
  const dangerous = { text: '</script><script>alert(1)</script>&\u2028\u2029', answer: data.questions[0].answer };
  const serialized = serializeData(dangerous);
  assert.ok(!serialized.includes('<'));
  assert.ok(!serialized.includes('&'));
  assert.deepEqual(JSON.parse(serialized), dangerous);
  assert.deepEqual(JSON.parse(serializeData(data)), data);
});

test('single-file HTML replaces exactly three placeholders without remote dependencies', () => {
  const template = '<style>__APP_STYLE__</style><script id="question-data" type="application/json">__APP_DATA__</script><script>__APP_SCRIPT__</script>';
  const html = renderHtml(template, 'body{color:red}', 'console.log("offline");', data);
  assert.ok(!/__APP_(STYLE|DATA|SCRIPT)__/.test(html));
  const embedded = html.match(/<script id="question-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(embedded).questions.length, 370);
  assert.throws(() => renderHtml(template.replace('__APP_STYLE__', ''), '', '', data), /占位符/);
  assert.throws(() => renderHtml('__APP_STYLE____APP_DATA____APP_SCRIPT__', '', '', data), /question-data/);
  assert.match(createPatch('content\n', join(projectDirectory, 'test-output-do-not-create.html')), /\*\*\* Add File:/);
  const escapedScript = renderHtml(template, '', 'const example = "</script>";', data);
  assert.match(escapedScript, /const example = "<\\\/script>"/);
});

test('published HTML removes the requested word while keeping surrounding sentences readable', () => {
  const sample = '面试官面试时提问；面试中可以追问。';
  assert.equal(removeInterviewWord(sample), '考官作答时提问；作答中可以追问。');
  assert.ok(!removeInterviewWord(renderHtml(readFileSync(join(projectDirectory, 'index.template.html'), 'utf8'), readFileSync(join(projectDirectory, 'styles.css'), 'utf8'), readFileSync(join(projectDirectory, 'app.js'), 'utf8'), data)).includes('面试'));
});

test('patch slices validate integers and preserve emoji code points', () => {
  assert.deepEqual(parseChunkArguments('0', '12000'), { offset: 0, length: 12000 });
  for (const [offset, length] of [['-1', '5'], ['0', '0'], ['1.5', '2'], ['1', '-2'], ['Infinity', '2'], ['1', '9007199254740992'], ['9007199254740991', '2']]) {
    assert.throws(() => parseChunkArguments(offset, length));
  }
  const original = '题目🙂正文🧠结尾';
  const characters = patchCharacters(original);
  const chunks = [];
  for (let offset = 0; offset < characters.length; offset += 2) chunks.push(characters.slice(offset, offset + 2).join(''));
  assert.equal(chunks.join(''), original);
  assert.ok(chunks.every(chunk => !chunk.includes('\uFFFD')));
});
