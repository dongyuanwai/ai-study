'use strict';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function inlineMarkdown(value) {
  const tokens = [];
  const reserve = html => '\u0000' + (tokens.push(html) - 1) + '\u0000';
  let text = String(value).replace(/`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)/g, (match, code, label, url) => {
    if (code !== undefined) return reserve('<code>' + escapeHtml(code) + '</code>');
    if (!/^(https?:\/\/|#[a-z0-9_-]+$)/i.test(url)) return label;
    return reserve('<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + '</a>');
  });
  text = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

function splitTableRow(line) {
  const cells = []; let current = ''; let code = false; let escaped = false;
  for (const char of line.trim().replace(/^\|/, '').replace(/\|$/, '')) {
    if (char === '`' && !escaped) code = !code;
    if (char === '|' && !code && !escaped) { cells.push(current.trim()); current = ''; }
    else current += char;
    escaped = char === '\\' && !escaped;
  }
  cells.push(current.trim()); return cells;
}

function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r/g, '').trim().split('\n');
  const output = []; let i = 0;
  const divider = line => line && splitTableRow(line).every(cell => /^:?-{3,}:?$/.test(cell));
  const blockStart = index => /^\s*(```|[-*+]\s|\d+\.\s|>|#{1,6}\s|---\s*$)/.test(lines[index] || '') || (lines[index]?.includes('|') && divider(lines[index + 1]));
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim(); const code = []; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      output.push((language ? '<div class="code-language">' + escapeHtml(language) + '</div>' : '') + '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>'); continue;
    }
    if (line.includes('|') && divider(lines[i + 1])) {
      const header = splitTableRow(line); const rows = []; i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(splitTableRow(lines[i++]));
      output.push('<div class="table-scroll"><table><thead><tr>' + header.map(cell => '<th scope="col">' + inlineMarkdown(cell) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + header.map((_, index) => '<td>' + inlineMarkdown(row[index] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>'); continue;
    }
    const list = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
    if (list) {
      const ordered = /^\d/.test(list[1]); const tag = ordered ? 'ol' : 'ul'; const items = [];
      const start = ordered ? Number.parseInt(list[1], 10) : 1;
      while (i < lines.length) {
        const item = lines[i].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        let content = item[2]; i++;
        while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !blockStart(i)) content += ' ' + lines[i++].trim();
        items.push('<li>' + inlineMarkdown(content) + '</li>');
      }
      output.push('<' + tag + (ordered && start !== 1 ? ' start="' + start + '"' : '') + '>' + items.join('') + '</' + tag + '>'); continue;
    }
    if (/^>/.test(line)) {
      const quote = []; while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      output.push('<blockquote>' + renderMarkdown(quote.join('\n')) + '</blockquote>'); continue;
    }
    if (/^#{1,6}\s/.test(line)) { output.push('<h4>' + inlineMarkdown(line.replace(/^#{1,6}\s+/, '')) + '</h4>'); i++; continue; }
    if (/^---\s*$/.test(line)) { output.push('<hr>'); i++; continue; }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !blockStart(i)) paragraph.push(lines[i++]);
    output.push('<p>' + inlineMarkdown(paragraph.join(' ')) + '</p>');
  }
  return output.join('\n');
}

const topicByCategory = {
  'medium-1':9, 'medium-2':2, 'medium-3':3, 'medium-4':4,
  'medium-5':6, 'medium-6':7, 'medium-7':8, 'medium-8':8,
  'hard-1':7, 'hard-2':4, 'hard-3':3, 'hard-4':8, 'hard-5':9,
};
const topicOverrides = {
  'medium-1':1, 'medium-6':1,
  'medium-70':5, 'medium-71':5, 'medium-77':5, 'medium-94':5,
  'hard-12':6, 'hard-22':6, 'hard-23':6, 'hard-24':6, 'hard-25':6, 'hard-27':6,
  'hard-33':2, 'hard-34':2, 'hard-35':2, 'hard-38':9, 'hard-40':9, 'hard-54':3,
};
const topicForQuestion = question => 'topic-' + (topicOverrides[question.id] || topicByCategory[question.category] || Number(question.category.slice(5)));

function matchingQuestions(questions, state, saved, searchIndex) {
  const terms = state.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return questions.filter(question => {
    const progress = saved[question.id] || {};
    if (state.difficulty !== 'all' && question.difficulty !== state.difficulty) return false;
    if (state.category !== 'all' && (state.category.startsWith('topic-') ? topicForQuestion(question) !== state.category : question.category !== state.category)) return false;
    if (state.status === 'favorites' && !progress.favorite) return false;
    if (state.status === 'mastered' && (!question.answer || !progress.mastered)) return false;
    if (state.status === 'unmastered' && (!question.answer || progress.mastered)) return false;
    if (state.status === 'pending' && question.answer) return false;
    const haystack = state.fulltext ? searchIndex.get(question.id) : [question.title, ...(question.tags || [])].join(' ').toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

function createApp(data, document, browser) {
  const STORAGE_KEY = 'ai-interview-notebook:v1'; const PAGE_SIZE = 20;
  const $ = id => document.getElementById(id);
  const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const questionsById = new Map(data.questions.map(question => [question.id, question]));
  const categoriesById = new Map(data.categories.map(category => [category.id, category]));
  const topics = data.categories.filter(category => category.difficulty === 'easy').map(category => ({
    id:'topic-' + category.number,
    number:category.number,
    name:category.name,
    count:data.questions.filter(question => topicForQuestion(question) === 'topic-' + category.number).length,
  }));
  const topicsById = new Map(topics.map(topic => [topic.id, topic]));
  const searchIndex = new Map(data.questions.map(question => [question.id, [question.title, ...(question.tags || []), ...Object.values(question.answer || {})].join(' ').toLocaleLowerCase()]));
  const rendered = new Map(); let toastTimer; let searchTimer; let storageWarning = false;
  let saved = {}; let preferences = {theme:'light', view:'full'};
  const validSaved = input => {
    const result = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
    for (const [id, value] of Object.entries(input)) if (questionsById.has(id) && value && typeof value === 'object') result[id] = {favorite:value.favorite === true, mastered:questionsById.get(id).answer !== null && value.mastered === true};
    return result;
  };
  try {
    const stored = JSON.parse(browser.localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored?.schemaVersion === 1) { saved = validSaved(stored.saved); preferences.theme = stored.theme === 'dark' ? 'dark' : 'light'; preferences.view = stored.view === 'brief' ? 'brief' : 'full'; }
  } catch { storageWarning = true; }
  const state = {difficulty:'easy', category:'all', query:'', status:'all', fulltext:true, page:1, view:preferences.view, open:new Set()};
  const toast = message => { $('toast').textContent = message; $('toast').hidden = false; browser.clearTimeout(toastTimer); toastTimer = browser.setTimeout(() => { $('toast').hidden = true; }, 3500); };
  const persist = () => {
    try { browser.localStorage.setItem(STORAGE_KEY, JSON.stringify({schemaVersion:1,saved,theme:preferences.theme,view:state.view})); }
    catch { if (!storageWarning) toast('浏览器未允许保存进度，请使用“导出进度”备份。'); storageWarning = true; }
  };
  const applyTheme = () => {
    document.documentElement.dataset.theme = preferences.theme;
    $('theme-toggle').setAttribute('aria-label', preferences.theme === 'dark' ? '切换为浅色模式' : '切换为深色模式');
    $('theme-label').textContent = preferences.theme === 'dark' ? '浅色' : '深色';
    $('theme-toggle').querySelector('use').setAttribute('href', preferences.theme === 'dark' ? '#i-sun' : '#i-moon');
  };
  const results = () => matchingQuestions(data.questions, state, saved, searchIndex);
  const updateProgress = () => {
    const answered = data.questions.filter(question => question.answer); const mastered = answered.filter(question => saved[question.id]?.mastered).length;
    const percent = Math.round(mastered / answered.length * 100);
    $('learning-progress').max = answered.length; $('learning-progress').value = mastered;
    $('progress-percent').textContent = percent + '%'; $('progress-text').textContent = mastered + ' / ' + answered.length + ' 道已掌握';
  };
  const navButton = (id, name, count, number) => '<button class="category-button' + (state.category === id ? ' active' : '') + '" data-category="' + id + '" aria-pressed="' + (state.category === id) + '"><span class="category-number">' + (number || icon('grid')) + '</span><span class="category-name">' + escapeHtml(name) + '</span><span class="category-count">' + count + '</span></button>';
  const renderNavigation = () => {
    const difficulty = data.difficulties.find(item => item.id === state.difficulty);
    const visible = state.difficulty === 'all' ? topics : data.categories.filter(category => category.difficulty === state.difficulty);
    const count = data.questions.filter(question => state.difficulty === 'all' || question.difficulty === state.difficulty).length;
    let html = navButton('all', '全部专题', count, '');
    html += '<div class="category-divider"></div>';
    for (const category of visible) {
      html += navButton(category.id, category.name, category.count, String(category.number).padStart(2, '0'));
    }
    $('category-nav').innerHTML = html;
    const tabs = [{id:'all',label:'全部',count:data.questions.length}, ...data.difficulties.map(item => ({...item,count:data.questions.filter(question => question.difficulty === item.id).length}))];
    $('difficulty-tabs').innerHTML = tabs.map(item => '<button class="difficulty-button' + (item.id === state.difficulty ? ' active' : '') + '" data-difficulty="' + item.id + '" aria-pressed="' + (item.id === state.difficulty) + '" aria-controls="category-nav">' + item.label + '<span>' + item.count + '</span></button>').join('');
  };
  const answerHtml = question => {
    if (!question.answer) return '<div class="pending-answer"><strong>答案待补充</strong>当前仅整理了这道题的题目，尚未生成参考答案。你可以先收藏，后续补充答案时再复习。</div>';
    if (!rendered.has(question.id)) rendered.set(question.id, Object.fromEntries(Object.entries(question.answer).map(([key,value]) => [key,renderMarkdown(value)])));
    const answer = rendered.get(question.id);
    return (state.view === 'full' ? '<section class="answer-section core"><h3 class="section-label"><span class="section-index">01</span>核心回答</h3><div class="markdown">' + answer.core + '</div></section>' : '') + '<section class="answer-section oral"><h3 class="section-label"><span class="section-index">02</span>口述版</h3><div class="markdown">' + answer.oral + '</div></section><section class="answer-section pitfalls"><h3 class="section-label"><span class="section-index">03</span>易错点</h3><div class="markdown">' + answer.pitfalls + '</div></section>';
  };
  const questionHtml = question => {
    const progress = saved[question.id] || {}; const category = categoriesById.get(question.category); const difficulty = data.difficulties.find(item => item.id === question.difficulty);
    return '<article class="question-card' + (progress.mastered ? ' is-mastered' : '') + '" id="card-' + question.id + '"><details data-question="' + question.id + '"' + (state.open.has(question.id) ? ' open' : '') + '><summary><span class="question-number">' + String(question.number).padStart(2,'0') + '</span><div class="question-content"><h3 class="question-title">' + escapeHtml(question.title) + '</h3><div class="question-meta"><span>' + escapeHtml(category.name) + '</span>' + (state.difficulty === 'all' ? '<span class="tag">' + difficulty.label + '</span>' : '') + question.tags.slice(0,2).map(tag => '<span class="tag">' + escapeHtml(tag) + '</span>').join('') + '<span class="status-badge' + (!question.answer ? ' pending' : '') + '">' + (!question.answer ? '答案待补充' : progress.mastered ? '已掌握' : '有答案') + '</span></div></div><svg class="icon disclosure-icon" aria-hidden="true"><use href="#i-arrow"/></svg></summary><div class="answer-panel">' + answerHtml(question) + '</div></details><div class="quick-actions"><button class="icon-button favorite" data-action="favorite" data-id="' + question.id + '" aria-label="' + (progress.favorite ? '取消收藏' : '收藏') + '第' + question.number + '道' + difficulty.label + '题" title="' + (progress.favorite ? '取消收藏' : '收藏题目') + '" aria-pressed="' + Boolean(progress.favorite) + '">' + icon('star') + '</button><button class="icon-button" data-action="mastered" data-id="' + question.id + '" aria-label="' + (progress.mastered ? '标记为未掌握' : '标记为已掌握') + '第' + question.number + '道' + difficulty.label + '题" title="' + (!question.answer ? '暂无答案，暂不计入掌握进度' : progress.mastered ? '标记为未掌握' : '标记为已掌握') + '" aria-pressed="' + Boolean(progress.mastered) + '"' + (!question.answer ? ' disabled' : '') + '>' + icon('check') + '</button></div></article>';
  };
  const renderList = () => {
    const filtered = results(); const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); state.page = Math.min(state.page, pages);
    const from = (state.page - 1) * PAGE_SIZE; const visible = filtered.slice(from, from + PAGE_SIZE);
    $('question-list').innerHTML = visible.map(questionHtml).join('');
    const category = categoriesById.get(state.category) || topicsById.get(state.category); const difficulty = data.difficulties.find(item => item.id === state.difficulty);
    $('results-title').textContent = category?.name || (difficulty ? '全部' + difficulty.label + '题' : '全部题目');
    const answered = filtered.filter(question => question.answer).length;
    $('results-summary').textContent = '共 ' + filtered.length + ' 道 · ' + answered + ' 道有答案' + (state.query ? ' · 搜索“' + state.query + '”' : '') + ' · 点击题目展开阅读';
    $('results-kicker').textContent = state.view === 'brief' ? '速记 · 口述 + 易错点' : '知识专题 · 完整阅读';
    $('pending-banner').hidden = !filtered.some(question => !question.answer);
    $('empty-state').hidden = filtered.length > 0; $('pagination').hidden = filtered.length === 0;
    $('page-range').textContent = '显示 ' + (filtered.length ? from + 1 : 0) + '–' + Math.min(from + PAGE_SIZE, filtered.length) + ' / ' + filtered.length + ' 道';
    $('page-number').textContent = state.page + ' / ' + pages; $('previous-page').disabled = state.page === 1; $('next-page').disabled = state.page === pages; $('random-question').disabled = !filtered.length;
    $('reset-filters').hidden = state.category === 'all' && !state.query && state.status === 'all';
    $('search-input').placeholder = '搜索' + (difficulty ? difficulty.label + '题的' : '') + '题目、知识点或答案内容…';
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
    updateProgress();
  };
  const render = () => { renderNavigation(); renderList(); };
  const closeMenu = () => { document.body.classList.remove('is-nav-open'); $('nav-backdrop').hidden = true; $('menu-toggle').setAttribute('aria-expanded','false'); };
  const resetFilters = () => { state.category = 'all'; state.query = ''; state.status = 'all'; state.page = 1; $('search-input').value = ''; $('status-filter').value = 'all'; browser.clearTimeout(searchTimer); render(); };
  const focusResults = () => { $('results-title').focus({preventScroll:true}); $('results-title').scrollIntoView({block:'start'}); };
  const openHash = () => {
    let id; try { id = decodeURIComponent(browser.location.hash.slice(1)); } catch { return; }
    const question = questionsById.get(id); if (!question) return;
    state.difficulty = question.difficulty; state.category = 'all'; state.query = ''; state.status = 'all'; $('search-input').value = ''; $('status-filter').value = 'all';
    state.page = Math.floor(data.questions.filter(item => item.difficulty === question.difficulty).findIndex(item => item.id === id) / PAGE_SIZE) + 1; state.open.add(id); render();
    browser.requestAnimationFrame(() => $('card-' + id)?.scrollIntoView({block:'start'}));
  };
  $('category-nav').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; state.page = 1; closeMenu(); render(); focusResults(); });
  $('difficulty-tabs').addEventListener('click', event => { const button = event.target.closest('[data-difficulty]'); if (!button) return; state.difficulty = button.dataset.difficulty; state.category = 'all'; state.page = 1; render(); $('category-nav').scrollTop = 0; $('difficulty-tabs').querySelector('[data-difficulty="' + state.difficulty + '"]')?.focus({preventScroll:true}); });
  $('search-input').addEventListener('input', event => { state.query = event.target.value; state.page = 1; browser.clearTimeout(searchTimer); searchTimer = browser.setTimeout(renderList, 120); });
  $('fulltext-search').addEventListener('change', event => { state.fulltext = event.target.checked; state.page = 1; renderList(); });
  $('status-filter').addEventListener('change', event => { state.status = event.target.value; state.page = 1; renderList(); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; persist(); renderList(); }));
  $('question-list').addEventListener('toggle', event => {
    const details = event.target; if (!details.matches('details[data-question]') || !details.isConnected) return;
    const id = details.dataset.question;
    if (details.open) { state.open.add(id); try { browser.history.replaceState(null,'','#' + id); } catch { /* file origins may restrict History API */ } }
    else state.open.delete(id);
  }, true);
  $('question-list').addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
    const id = button.dataset.id; const action = button.dataset.action; saved[id] ||= {favorite:false,mastered:false}; saved[id][action] = !saved[id][action]; persist(); renderList();
    const replacement = document.querySelector('[data-id="' + id + '"][data-action="' + action + '"]');
    if (replacement) replacement.focus({preventScroll:true}); else $('results-title').focus({preventScroll:true});
  });
  $('previous-page').addEventListener('click', () => { if (state.page > 1) { state.page--; renderList(); focusResults(); } });
  $('next-page').addEventListener('click', () => { if (state.page * PAGE_SIZE < results().length) { state.page++; renderList(); focusResults(); } });
  $('reset-filters').addEventListener('click', resetFilters); $('empty-reset').addEventListener('click', resetFilters);
  $('random-question').addEventListener('click', () => {
    const filtered = results(); if (!filtered.length) return; const index = Math.floor(Math.random() * filtered.length); const question = filtered[index];
    state.page = Math.floor(index / PAGE_SIZE) + 1; state.open.add(question.id); renderList();
    try { browser.history.replaceState(null,'','#' + question.id); } catch { /* optional deep link */ }
    const card = $('card-' + question.id); card.querySelector('summary').focus({preventScroll:true}); card.scrollIntoView({block:'start'});
  });
  $('theme-toggle').addEventListener('click', () => { preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark'; applyTheme(); persist(); });
  $('menu-toggle').addEventListener('click', () => { const open = !document.body.classList.contains('is-nav-open'); if (!open) { closeMenu(); return; } document.body.classList.add('is-nav-open'); $('nav-backdrop').hidden = false; $('menu-toggle').setAttribute('aria-expanded','true'); $('menu-close').focus(); });
  $('menu-close').addEventListener('click', () => { closeMenu(); $('menu-toggle').focus(); }); $('nav-backdrop').addEventListener('click', () => { closeMenu(); $('menu-toggle').focus(); });
  document.addEventListener('keydown', event => {
    const typing = ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) || event.target.isContentEditable;
    if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey) { event.preventDefault(); closeMenu(); $('search-input').focus(); }
    if (event.key === 'Escape') { if (document.body.classList.contains('is-nav-open')) { closeMenu(); $('menu-toggle').focus(); } else if (document.activeElement === $('search-input')) { state.query = ''; $('search-input').value = ''; state.page = 1; browser.clearTimeout(searchTimer); renderList(); } }
    if (event.key === 'Tab' && document.body.classList.contains('is-nav-open')) {
      const elements = Array.from($('sidebar').querySelectorAll('button:not(:disabled)')).filter(element => element.offsetParent !== null);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('export-progress').addEventListener('click', () => {
    const json = JSON.stringify({schemaVersion:1,saved,theme:preferences.theme,view:state.view,exportedAt:new Date().toISOString()},null,2);
    const url = browser.URL.createObjectURL(new browser.Blob([json],{type:'application/json'})); const link = document.createElement('a');
    link.href = url; link.download = 'AI复习进度-' + new Date().toISOString().slice(0,10) + '.json'; document.body.appendChild(link); link.click(); link.remove(); browser.setTimeout(() => browser.URL.revokeObjectURL(url),1000);
    toast('已导出进度。请妥善保存下载的 JSON 文件。');
  });
  $('import-progress').addEventListener('click', () => $('progress-file').click());
  $('progress-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('large');
      const backup = JSON.parse(await file.text()); if (backup.schemaVersion !== 1 || !backup.saved || typeof backup.saved !== 'object' || Array.isArray(backup.saved)) throw new Error('format');
      const incoming = validSaved(backup.saved); saved = {...saved,...incoming}; persist(); renderList(); toast('进度已导入；同一题的状态采用备份中的记录。');
    } catch { toast('导入失败：请选择本网页导出的有效进度 JSON 文件（小于 1 MB）。'); }
    event.target.value = '';
  });
  browser.addEventListener('hashchange', openHash);
  $('total-stat').textContent = data.questions.length; $('answer-stat').textContent = data.questions.filter(question => question.answer).length;
  $('category-stat').textContent = data.categories.filter(category => category.difficulty === 'easy').length; $('updated-note').textContent = '资料更新时间 ' + data.updatedAt;
  applyTheme(); render(); openHash();
  if (storageWarning) toast('浏览器无法读取已保存进度；可以继续浏览，并使用导出功能备份。');
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  try { createApp(JSON.parse(document.getElementById('question-data').textContent), document, window); }
  catch (error) { document.getElementById('question-list').textContent = '题库加载失败，请重新打开网页。原始 Markdown 文档仍然保留。'; console.error(error); }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {escapeHtml,inlineMarkdown,splitTableRow,renderMarkdown,matchingQuestions};
