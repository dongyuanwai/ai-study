import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = dirname(projectDirectory);
const definitions = [
  { id: 'easy', label: '简单', expectedCount: 151, file: 'AI大模型面试题库-简单题.md' },
  { id: 'medium', label: '中等', expectedCount: 164, file: 'AI大模型面试题库-中等题.md' },
  { id: 'hard', label: '困难', expectedCount: 55, file: 'AI大模型面试题库-困难题.md' },
];
const sectionNames = new Map([
  ['核心回答', 'core'],
  ['面试口述版', 'oral'],
  ['易错点', 'pitfalls'],
]);

function cleanLabel(value) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[\u200B\uFEFF]/g, '').trim();
}

/** Read the numbered question tables, not the category-index table. */
export function parseQuestions(markdown, difficulty) {
  const categories = [];
  const questions = [];
  let category = null;
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = line.match(/^##\s+(\d+)\.\s+(.+?)（(\d+)\s*题）\s*$/);
    if (heading) {
      category = {
        id: `${difficulty}-${Number(heading[1])}`,
        difficulty,
        name: cleanLabel(heading[2]),
        number: Number(heading[1]),
        count: Number(heading[3]),
      };
      categories.push(category);
      continue;
    }
    if (!category || !line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
    if (!/^\d+$/.test(cells[0] ?? '')) continue;
    assert.ok(cells.length >= 4, `题目表格列缺失：${line}`);
    const number = Number(cells[0]);
    questions.push({
      id: `${difficulty}-${number}`,
      number,
      title: cleanLabel(cells[1]),
      difficulty,
      category: category.id,
      tags: cleanLabel(cells[3]).split(/[、,，]/).map(tag => tag.trim()).filter(tag => tag && !/^[—–-]+$/.test(tag)),
      answer: null,
    });
  }
  assert.ok(categories.length, `没有读取到 ${difficulty} 的分类`);
  for (const item of categories) {
    assert.equal(questions.filter(question => question.category === item.id).length, item.count, `${item.name} 题数与标题不一致`);
  }
  questions.forEach((question, index) => assert.equal(question.number, index + 1, `${difficulty} 题号不连续`));
  return { categories, questions };
}

function trimSection(lines) {
  const result = [...lines];
  while (result.length && (!result.at(-1).trim() || /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(result.at(-1)))) result.pop();
  while (result.length && !result[0].trim()) result.shift();
  return result.join('\n');
}

/** Keep Markdown unchanged inside each answer, including fenced code and tables. */
export function parseAnswers(markdown) {
  const answers = new Map();
  let current = null;
  let section = null;
  let fence = null;
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  for (const line of lines) {
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
    const questionHeading = line.match(/^###\s+(\d+)\.\s+(.+?)\s*$/);
    if (questionHeading) {
      const number = Number(questionHeading[1]);
      assert.ok(!answers.has(number), `答案题号重复：${number}`);
      current = { title: cleanLabel(questionHeading[2]), sections: { core: [], oral: [], pitfalls: [] } };
      answers.set(number, current);
      section = null;
      continue;
    }
    const answerHeading = line.match(/^####\s+(.+?)\s*$/);
    if (answerHeading) {
      section = current ? sectionNames.get(answerHeading[1]) ?? null : null;
      continue;
    }
    // The review summaries and reference lists belong to the category, never to its last question.
    if (/^#{1,3}\s/.test(line)) {
      current = null;
      section = null;
      continue;
    }
    if (current && section) current.sections[section].push(line);
  }
  assert.equal(fence, null, '答案 Markdown 存在未闭合的代码块');
  return new Map([...answers].map(([number, entry]) => [number, {
    title: entry.title,
    answer: Object.fromEntries(Object.entries(entry.sections).map(([key, value]) => [key, trimSection(value)])),
  }]));
}

export function buildData(directory = sourceDirectory) {
  const data = { updatedAt: '2026-10-10', difficulties: [], categories: [], questions: [] };
  const answerFiles = {
    easy: { file: 'AI大模型面试题库-简单题-答案.md', count: 151 },
    medium: { file: 'AI大模型面试题库-中等题-答案.md', count: 164 },
    hard: { file: 'AI大模型面试题库-困难题-答案.md', count: 55 },
  };
  for (const definition of definitions) {
    const parsed = parseQuestions(readFileSync(join(directory, definition.file), 'utf8'), definition.id);
    assert.equal(parsed.questions.length, definition.expectedCount, `${definition.label}题目数量不正确`);
    if (answerFiles[definition.id]) {
      const { file, count } = answerFiles[definition.id];
      const answers = parseAnswers(readFileSync(join(directory, file), 'utf8'));
      assert.equal(answers.size, count, `${definition.label}题答案数量应为 ${count}`);
      for (const question of parsed.questions) {
        const entry = answers.get(question.number);
        assert.ok(entry, `${definition.label}题 ${question.number} 缺少答案`);
        assert.equal(entry.title, question.title, `${definition.label}题 ${question.number} 的题目与答案标题不一致`);
        for (const key of ['core', 'oral', 'pitfalls']) assert.ok(entry.answer[key].trim(), `${definition.label}题 ${question.number} 缺少 ${key}`);
        question.answer = entry.answer;
      }
    }
    data.difficulties.push({
      id: definition.id,
      label: definition.label,
      count: parsed.questions.length,
      answeredCount: parsed.questions.filter(question => question.answer).length,
    });
    data.categories.push(...parsed.categories);
    data.questions.push(...parsed.questions);
  }
  return data;
}

export function serializeData(data) {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export function renderHtml(template, styles, script, data) {
  assert.ok(/<script\b[^>]*\bid=["']question-data["'][^>]*\btype=["']application\/json["'][^>]*>\s*__APP_DATA__\s*<\/script>/i.test(template), '模板必须包含 question-data application/json 脚本');
  for (const token of ['__APP_STYLE__', '__APP_DATA__', '__APP_SCRIPT__']) {
    assert.equal(template.split(token).length - 1, 1, `模板占位符 ${token} 必须且只能出现一次`);
  }
  let html = template;
  for (const [token, replacement] of [
    ['__APP_STYLE__', styles],
    ['__APP_DATA__', serializeData(data)],
    ['__APP_SCRIPT__', script.replace(/<\/script/gi, '<\\/script')],
  ]) {
    html = html.replace(token, () => replacement);
  }
  assert.ok(!/__APP_(STYLE|DATA|SCRIPT)__/.test(html), '生成网页仍有未替换的占位符');
  return html;
}

/** Apply wording changes only to the distributable HTML; keep the source question and answer documents intact. */
export function removeInterviewWord(html) {
  return html
    .replaceAll('面试官', '考官')
    .replaceAll('面试时', '作答时')
    .replaceAll('面试中', '作答中')
    .replaceAll('面试前', '作答前')
    .replaceAll('面试涉及', '回答涉及')
    .replaceAll('面试可以', '回答时可以')
    .replaceAll('面试', '');
}

function linesForPatch(contents, prefix) {
  return contents.replace(/\n$/, '').split('\n').map(line => `${prefix}${line}`).join('\n');
}

export function createPatch(contents, filePath = join(projectDirectory, 'index.html')) {
  const patchPath = relative(process.cwd(), filePath).replaceAll('\\', '/');
  if (existsSync(filePath)) {
    const previous = readFileSync(filePath, 'utf8');
    if (previous === contents) return '';
    return `*** Begin Patch\n*** Update File: ${patchPath}\n@@\n${linesForPatch(previous, '-')}\n${linesForPatch(contents, '+')}\n*** End Patch\n`;
  }
  return `*** Begin Patch\n*** Add File: ${patchPath}\n${linesForPatch(contents, '+')}\n*** End Patch\n`;
}

export function getStats(data) {
  return {
    questions: data.questions.length,
    answered: data.questions.filter(question => question.answer).length,
    categories: data.categories.length,
    difficulties: data.difficulties,
  };
}

export function parseChunkArguments(offset, length) {
  assert.ok(/^\d+$/.test(offset ?? '') && Number.isSafeInteger(Number(offset)), '分块 OFFSET 必须是安全的非负整数');
  assert.ok(/^\d+$/.test(length ?? '') && Number.isSafeInteger(Number(length)) && Number(length) > 0, '分块 LENGTH 必须是安全的正整数');
  assert.ok(Number.isSafeInteger(Number(offset) + Number(length)), '分块 OFFSET + LENGTH 超出安全整数范围');
  return { offset: Number(offset), length: Number(length) };
}

/** Code-point boundaries prevent emoji surrogate pairs from being corrupted across chunks. */
export function patchCharacters(patch) {
  return Array.from(patch);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const argumentsList = process.argv.slice(2);
    const isChunk = argumentsList[0] === '--patch-chunk';
    assert.ok(argumentsList.length === 0 || (argumentsList.length === 1 && ['--check', '--patch-size'].includes(argumentsList[0])) || (isChunk && argumentsList.length === 3), '用法：build.mjs [--check | --patch-size | --patch-chunk OFFSET LENGTH]');
    const chunk = isChunk ? parseChunkArguments(argumentsList[1], argumentsList[2]) : null;
    const data = buildData();
    const html = renderHtml(
      readFileSync(join(projectDirectory, 'index.template.html'), 'utf8'),
      readFileSync(join(projectDirectory, 'styles.css'), 'utf8'),
      readFileSync(join(projectDirectory, 'app.js'), 'utf8'),
      data,
    );
    const revisedHtml = removeInterviewWord(html);
    assert.ok(!revisedHtml.includes('面试'), '生成网页仍包含需要删除的文字');
    const finalHtml = revisedHtml.endsWith('\n') ? revisedHtml : `${revisedHtml}\n`;
    if (argumentsList[0] === '--check') {
      process.stdout.write(`${JSON.stringify({
        ...getStats(data),
        bundleBytes: Buffer.byteLength(finalHtml, 'utf8'),
        bundleCharacters: Array.from(finalHtml).length,
        placeholdersValidated: true,
      }, null, 2)}\n`);
    } else {
      // Emit an apply_patch-compatible patch; callers apply it instead of writing files directly.
      const patch = createPatch(finalHtml);
      if (argumentsList[0] === '--patch-size') {
        process.stdout.write(`${patchCharacters(patch).length}\n`);
      } else if (chunk) {
        process.stdout.write(patchCharacters(patch).slice(chunk.offset, chunk.offset + chunk.length).join(''));
      } else {
        process.stdout.write(patch);
      }
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
