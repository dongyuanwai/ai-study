const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { escapeHtml, inlineMarkdown, splitTableRow, renderMarkdown, matchingQuestions } = require('./app.js');
const dataPromise = import('./build.mjs').then(({ buildData }) => buildData());

const baseState = { difficulty: 'all', category: 'all', query: '', status: 'all', fulltext: true };
const makeIndex = data => new Map(data.questions.map(question => [question.id,
  [question.title, ...(question.tags || []), ...Object.values(question.answer || {})].join(' ').toLocaleLowerCase(),
]));
const find = (data, updates = {}, saved = {}) => matchingQuestions(data.questions, { ...baseState, ...updates }, saved, makeIndex(data));

test('HTML and inline Markdown escape literal HTML while retaining safe formatting', () => {
  assert.equal(escapeHtml('<div title="x">\'&</div>'), '&lt;div title=&quot;x&quot;&gt;&#39;&amp;&lt;/div&gt;');
  const formatted = inlineMarkdown('**重点** `A<B && C` [资料](https://example.com/?a=1&b=2)');
  assert.match(formatted, /<strong>重点<\/strong>/);
  assert.match(formatted, /<code>A&lt;B &amp;&amp; C<\/code>/);
  assert.match(formatted, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
  assert.match(formatted, /rel="noopener noreferrer"/);
  assert.doesNotMatch(inlineMarkdown('[危险](javascript:alert) <img src=x onerror=alert(1)>'), /<a|<img/);
  assert.match(inlineMarkdown('<script>alert(1)</script>'), /&lt;script&gt;/);
});

test('tables preserve inline-code pipes and escaped cell separators', () => {
  assert.deepEqual(splitTableRow('| A | `x | y` | Z |'), ['A', '`x | y`', 'Z']);
  assert.deepEqual(splitTableRow('| a\\|b | c |'), ['a\\|b', 'c']);
  const html = renderMarkdown('| 类型 | 表达式 |\n| --- | --- |\n| LCEL | `prompt | model | parser` |');
  assert.equal((html.match(/<th /g) || []).length, 2);
  assert.equal((html.match(/<td>/g) || []).length, 2);
  assert.match(html, /<code>prompt \| model \| parser<\/code>/);
});

test('fenced code, lists, quotations and ordered-list starts remain visible', () => {
  const html = renderMarkdown('```json\n{"html":"<script>&</script>","title":"### heading"}\n```\n\n- 第一项\n- 第二项\n\n3. 第三步\n4. 第四步\n\n> 引用说明');
  assert.match(html, /class="code-language">json/);
  assert.match(html, /<pre><code>\{&quot;html&quot;:&quot;&lt;script&gt;&amp;&lt;\/script&gt;/);
  assert.match(html, /### heading/);
  assert.match(html, /<ul><li>第一项<\/li><li>第二项<\/li><\/ul>/);
  assert.match(html, /<ol start="3">/);
  assert.match(html, /<blockquote><p>引用说明<\/p><\/blockquote>/);
  assert.doesNotMatch(html, /<script>/);
});

test('all real answer sections render nonempty without raw source HTML or missing tokens', async () => {
  const data = await dataPromise;
  const answered = data.questions.filter(question => question.answer);
  assert.equal(answered.length, 370);
  for (const question of answered) {
    for (const [name, markdown] of Object.entries(question.answer)) {
      const html = renderMarkdown(markdown);
      assert.ok(html.trim().length > 15, `${question.id}/${name} is empty`);
      assert.doesNotMatch(html, /(?:<script\b|<record>|<question>|<documents>|\u0000\d+\u0000)/i, `${question.id}/${name} leaks HTML or placeholder`);
      assert.doesNotMatch(html, /\bundefined\b/, `${question.id}/${name} lost an inline token`);
    }
    assert.ok(inlineMarkdown(question.title).length >= question.title.length);
  }
  const byId = new Map(data.questions.map(question => [question.id, question]));
  assert.match(renderMarkdown(byId.get('easy-3').answer.core), /<table>/);
  assert.match(renderMarkdown(byId.get('easy-10').answer.core), /<pre><code>/);
  assert.match(renderMarkdown(byId.get('easy-15').answer.core), /&lt;record&gt;/);
  assert.match(renderMarkdown(byId.get('easy-17').answer.core), /&lt;question&gt;/);
  const chatJson = answered.find(question => question.answer.core.includes('"role":"assistant"'));
  assert.ok(chatJson, 'the real chat-format JSON example must exist');
  assert.match(renderMarkdown(chatJson.answer.core), /&quot;role&quot;/);
  assert.match(renderMarkdown(byId.get('easy-151').answer.pitfalls), /取消 Agent/);
});

test('difficulty, category and answer filters preserve exact source counts', async () => {
  const data = await dataPromise;
  assert.equal(find(data).length, 370);
  for (const difficulty of data.difficulties) assert.equal(find(data, { difficulty: difficulty.id }).length, difficulty.count);
  for (const category of data.categories) {
    const result = find(data, { category: category.id });
    assert.equal(result.length, category.count);
    assert.ok(result.every(question => question.category === category.id));
  }
  assert.equal(find(data, { difficulty: 'easy', category: 'hard-1' }).length, 0);
  assert.equal(find(data, { status: 'pending' }).length, 0);
  assert.equal(find(data, { status: 'pending', difficulty: 'easy' }).length, 0);
  assert.equal(find(data, { status: 'unmastered' }).length, 370);
  assert.equal(find(data, { status: 'mastered' }).length, 0);
});

test('saved filters are isolated by difficulty', async () => {
  const data = await dataPromise;
  const saved = {
    'easy-1': { favorite: true, mastered: true },
    'easy-2': { favorite: false, mastered: true },
    'medium-1': { favorite: true, mastered: true },
    'hard-1': { favorite: false, mastered: true },
  };
  assert.deepEqual(find(data, { status: 'favorites' }, saved).map(question => question.id), ['easy-1', 'medium-1']);
  assert.deepEqual(find(data, { status: 'mastered' }, saved).map(question => question.id), ['easy-1', 'easy-2', 'medium-1', 'hard-1']);
  assert.equal(find(data, { status: 'unmastered' }, saved).length, 366);
  assert.equal(find(data, { status: 'favorites', difficulty: 'hard' }, saved).length, 0);
});

test('search supports answer fulltext, title-and-tag mode, case-insensitive AND and empty queries', async () => {
  const data = await dataPromise;
  assert.ok(find(data, { query: 'Prefill' }).some(question => question.id === 'easy-3'));
  assert.ok(!find(data, { query: 'Prefill', fulltext: false }).some(question => question.id === 'easy-3'));
  assert.deepEqual(find(data, { query: 'rAg' }).map(question => question.id), find(data, { query: 'RAG' }).map(question => question.id));
  assert.ok(find(data, { query: ' PREFILL   DECODE ' }).some(question => question.id === 'easy-3'));
  assert.equal(find(data, { query: 'Prefill 不存在的唯一关键词___' }).length, 0);
  assert.equal(find(data, { query: '  \t\n ' }).length, 370);
  assert.ok(find(data, { query: 'LangChain', fulltext: false }).length > 0);
  assert.equal(find(data, { query: 'zzz_no_matching_question_zzzz' }).length, 0);
});

function appHarness(data, options = {}) {
  const elements = new Map();
  const timers = new Map();
  const history = [];
  const storage = new Map(options.stored ? [['ai-interview-notebook:v1', options.stored]] : []);
  let timerId = 0;
  const document = {
    activeElement: null,
    documentElement: { dataset: {} },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    querySelectorAll(selector) { return selector === '[data-view]' ? views : []; },
    querySelector() { return null; },
    addEventListener() {},
    body: { classList: { add() {}, remove() {}, contains() { return false; } } },
  };
  function makeElement(id) {
    return {
      id, dataset: {}, listeners: {}, attributes: {}, innerHTML: '', textContent: '', hidden: false,
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute(name, value) { this.attributes[name] = value; },
      querySelector() { return { setAttribute() {}, focus() {} }; },
      focus() { document.activeElement = this; },
      scrollIntoView() {},
    };
  }
  const views = ['full', 'brief'].map(view => ({ ...makeElement(view), dataset: { view } }));
  const browser = {
    localStorage: {
      getItem(key) { if (options.denyStorage) throw new Error('blocked'); return storage.get(key) || null; },
      setItem(key, value) { if (options.denyStorage) throw new Error('blocked'); storage.set(key, value); },
    },
    location: { hash: options.hash || '' },
    history: { replaceState(...args) { history.push(args.at(-1)); } },
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { callback(); },
    addEventListener() {},
  };
  const context = vm.createContext({ console, module: { exports: {} } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), context);
  context.createApp(data, document, browser);
  const trigger = (id, type, event = {}) => document.getElementById(id).listeners[type](event);
  const choose = (id, attribute, value) => trigger(id, 'click', { target: { closest() { return { dataset: { [attribute]: value } }; } } });
  const flush = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); };
  return { document, elements, views, storage, history, trigger, choose, flush };
}

test('app initializes, paginates, filters and resets with a minimal DOM', async () => {
  const data = await dataPromise;
  const app = appHarness(data);
  const element = id => app.document.getElementById(id);
  assert.match(element('results-summary').textContent, /共 151 道/);
  assert.match(element('page-range').textContent, /1–20 \/ 151/);
  assert.equal((element('question-list').innerHTML.match(/<article /g) || []).length, 20);
  app.trigger('next-page', 'click');
  assert.match(element('page-range').textContent, /21–40 \/ 151/);
  app.choose('category-nav', 'category', 'easy-1');
  assert.match(element('results-summary').textContent, /共 13 道/);
  assert.match(element('page-range').textContent, /1–13 \/ 13/);
  app.trigger('search-input', 'input', { target: { value: 'Prefill' } });
  app.flush();
  assert.match(element('question-list').innerHTML, /card-easy-3/);
  app.trigger('reset-filters', 'click');
  app.choose('difficulty-tabs', 'difficulty', 'medium');
  assert.match(element('results-summary').textContent, /共 164 道 · 164 道有答案/);
  assert.equal(element('pending-banner').hidden, true);
  assert.match(element('question-list').innerHTML, /有答案/);
  assert.doesNotMatch(element('question-list').innerHTML, /data-action="mastered"[^>]+ disabled/);
  app.choose('difficulty-tabs', 'difficulty', 'hard');
  assert.match(element('results-summary').textContent, /共 55 道 · 55 道有答案/);
  assert.equal(element('pending-banner').hidden, true);
  assert.match(element('question-list').innerHTML, /有答案/);
  assert.doesNotMatch(element('question-list').innerHTML, /data-action="mastered"[^>]+ disabled/);
  app.trigger('search-input', 'input', { target: { value: 'NoSuchTokenQA___' } });
  app.flush();
  assert.equal(element('empty-state').hidden, false);
  assert.equal(element('pagination').hidden, true);
  assert.equal(element('random-question').disabled, true);
});

test('difficulty choices stay above the sidebar topics and update the topic list', async () => {
  const template = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
  assert.ok(template.indexOf('id="difficulty-tabs"') < template.indexOf('id="category-nav"'));
  assert.ok(template.indexOf('id="category-nav"') < template.indexOf('<main id="main"'));
  const app = appHarness(await dataPromise);
  const nav = () => app.document.getElementById('category-nav').innerHTML;
  assert.match(nav(), /data-category="easy-1"/);
  assert.doesNotMatch(nav(), /data-category="hard-1"/);
  app.choose('difficulty-tabs', 'difficulty', 'all');
  assert.equal((nav().match(/data-category="topic-\d+"/g) || []).length, 9);
  assert.match(nav(), /data-category="topic-3"/);
  assert.doesNotMatch(nav(), /data-category="medium-1"|data-category="hard-1"/);
  app.choose('category-nav', 'category', 'topic-3');
  assert.match(app.document.getElementById('results-title').textContent, /RAG 检索增强生成/);
  assert.match(app.document.getElementById('results-summary').textContent, /共 \d+ 道/);
  app.choose('difficulty-tabs', 'difficulty', 'hard');
  assert.match(nav(), /data-category="hard-1"/);
  assert.doesNotMatch(nav(), /data-category="easy-1"/);
  assert.match(app.document.getElementById('results-title').textContent, /全部困难题/);
  assert.equal(app.document.getElementById('category-nav').scrollTop, 0);
});

test('merged topics in all mode cover every question once', async () => {
  const data = await dataPromise;
  const counts = Array.from({ length: 9 }, (_, index) => find(data, { category: 'topic-' + (index + 1) }).length);
  assert.equal(counts.reduce((total, count) => total + count, 0), 370);
  assert.ok(counts.every(count => count > 0));
  assert.ok(find(data, { category: 'topic-3' }).some(question => question.id === 'hard-54'));
  assert.ok(find(data, { category: 'topic-5' }).some(question => question.id === 'medium-70'));
});

test('corrupted or denied storage does not prevent browsing and invalid saved ids are ignored', async () => {
  const data = await dataPromise;
  for (const options of [{ stored: '{broken' }, { denyStorage: true }]) {
    const app = appHarness(data, options);
    assert.match(app.document.getElementById('results-summary').textContent, /共 151 道/);
    assert.match(app.document.getElementById('toast').textContent, /无法读取/);
  }
  const app = appHarness(data, { stored: JSON.stringify({ schemaVersion: 1, theme: 'dark', view: 'brief', saved: {
    'easy-1': { favorite: true, mastered: true }, 'medium-1': { favorite: true, mastered: true }, 'unknown-id': { mastered: true },
  } }) });
  assert.equal(app.document.documentElement.dataset.theme, 'dark');
  assert.match(app.document.getElementById('progress-text').textContent, /2 \/ 370/);
  assert.doesNotMatch(app.document.getElementById('question-list').innerHTML, /class="answer-section core"/);
  assert.match(app.document.getElementById('question-list').innerHTML, /口述版/);
});

test('deep links select the correct difficulty, page and open question', async () => {
  const data = await dataPromise;
  const app = appHarness(data, { hash: '#easy-151' });
  assert.match(app.document.getElementById('page-number').textContent, /8 \/ 8/);
  assert.match(app.document.getElementById('question-list').innerHTML, /data-question="easy-151" open/);
  const medium = appHarness(data, { hash: '#medium-164' });
  assert.match(medium.document.getElementById('page-number').textContent, /9 \/ 9/);
  assert.match(medium.document.getElementById('question-list').innerHTML, /data-question="medium-164" open/);
  const hard = appHarness(data, { hash: '#hard-55' });
  assert.match(hard.document.getElementById('page-number').textContent, /3 \/ 3/);
  assert.match(hard.document.getElementById('question-list').innerHTML, /data-question="hard-55" open/);
});

test('favorite/mastered toggles persist and open details survive list rerenders', async () => {
  const data = await dataPromise;
  const app = appHarness(data);
  const details = { dataset: { question: 'easy-3' }, open: true, isConnected: true, matches() { return true; } };
  app.trigger('question-list', 'toggle', { target: details });
  assert.equal(app.history.at(-1), '#easy-3');
  const toggle = action => app.trigger('question-list', 'click', { target: { closest() { return { disabled: false, dataset: { id: 'easy-3', action } }; } } });
  toggle('favorite');
  toggle('mastered');
  const saved = JSON.parse(app.storage.get('ai-interview-notebook:v1'));
  assert.deepEqual(saved.saved['easy-3'], { favorite: true, mastered: true });
  assert.match(app.document.getElementById('progress-text').textContent, /1 \/ 370/);
  assert.match(app.document.getElementById('question-list').innerHTML, /data-question="easy-3" open/);
  const reloaded = appHarness(data, { stored: app.storage.get('ai-interview-notebook:v1') });
  assert.match(reloaded.document.getElementById('progress-text').textContent, /1 \/ 370/);
  assert.match(reloaded.document.getElementById('question-list').innerHTML, /class="question-card is-mastered" id="card-easy-3"/);
});

test('progress import accepts valid known records and rejects invalid format', async () => {
  const data = await dataPromise;
  const app = appHarness(data);
  const input = { files: [{ size: 100, async text() { return JSON.stringify({ schemaVersion: 1, saved: {
    'easy-3': { favorite: true, mastered: true }, 'medium-1': { favorite: true, mastered: true }, 'missing': { favorite: true },
  } }); } }], value: 'backup.json' };
  await app.trigger('progress-file', 'change', { target: input });
  const saved = JSON.parse(app.storage.get('ai-interview-notebook:v1')).saved;
  assert.deepEqual(saved['easy-3'], { favorite: true, mastered: true });
  assert.deepEqual(saved['medium-1'], { favorite: true, mastered: true });
  assert.ok(!('missing' in saved));
  assert.equal(input.value, '');
  assert.match(app.document.getElementById('toast').textContent, /进度已导入/);
  await app.trigger('progress-file', 'change', { target: { files: [{ size: 1, async text() { return 'null'; } }], value: 'bad.json' } });
  assert.match(app.document.getElementById('toast').textContent, /导入失败/);
  assert.deepEqual(JSON.parse(app.storage.get('ai-interview-notebook:v1')).saved, saved);
});
