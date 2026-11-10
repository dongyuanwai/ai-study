import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSupabaseApi, seedRows, validatePublicKey } from '../src/lib/supabase-data.mjs';
import { databaseConfig } from '../scripts/database/config.mjs';
import { createInterviewRepository } from '../scripts/database/repository.mjs';
import { createLocalAiService } from '../scripts/local-ai/service.mjs';

const records = [{ id: 'i', company: '公司', companyEn: 'Company', role: '开发', questions: [{ id: 'q', number: 1, group: '项目', topic: 'Agent', title: '问题', answer: '旧答案', oral: '旧口述', pitfalls: '旧注意事项' }] }];
const jwt = role => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;

test('公开 Key 校验拒绝管理员密钥，服务端配置不允许半配置时退回本地写入', () => {
  validatePublicKey('sb_publishable_test'); validatePublicKey(jwt('anon'));
  for (const key of ['sb_secret_test', jwt('service_role'), 'invalid']) assert.throws(() => validatePublicKey(key));
  assert.equal(databaseConfig({}), null);
  assert.throws(() => databaseConfig({ SUPABASE_URL: 'https://example.supabase.co' }));
  assert.throws(() => databaseConfig({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }));
  assert.deepEqual(databaseConfig({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SECRET_KEY: 'sb_secret_test' }), { url: 'https://example.supabase.co', key: 'sb_secret_test' });
});

test('导入映射保留所有题目字段与稳定 ID', () => {
  const rows = seedRows(records);
  assert.equal(rows.records[0].id, records[0].id);
  assert.ok(!('questions' in rows.records[0].details));
  assert.deepEqual({ ...rows.questions[0].content, id: rows.questions[0].id }, records[0].questions[0]);
});

test('本地生成读取云端当前题目，确认才写云端；失败不回退覆盖 JSON', async t => {
  let current = { ...records[0].questions[0], answer: '云端当前答案' };
  let revision = 1;
  let writes = 0;
  let fail = false;
  const headers = [];
  const upstream = http.createServer(async (req, res) => {
    headers.push(req.headers);
    const url = new URL(req.url, 'http://localhost');
    let output;
    if (fail) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ code: 'unavailable', message: 'private-secret' })); }
    if (url.pathname.endsWith('/interview_records')) output = [{ id: 'i', details: { company: '公司', role: '开发' } }];
    else if (url.pathname.endsWith('/interview_questions')) output = [{ id: 'q', content: current, revision }];
    else {
      let body = ''; for await (const chunk of req) body += chunk;
      const input = JSON.parse(body);
      if (input.p_revision !== revision) { res.writeHead(409, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ code: 'PT409' })); }
      current = { ...current, answer: input.p_answer }; revision++; writes++; output = { answer: current.answer };
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(output));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => { upstream.close(); upstream.closeAllConnections(); });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'supabase-ai-'));
  const file = path.join(root, 'src/data/company-interviews.json');
  await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(records));
  const before = await fs.readFile(file, 'utf8');
  const repository = createInterviewRepository({ url: `http://127.0.0.1:${upstream.address().port}`, key: 'sb_secret_test' });
  const local = await createLocalAiService({ root, webPort: 3035, repository, generate: async (_settings, _interview, question) => { assert.equal(question.answer, current.answer); return { answer: '生成答案', oral: '不应覆盖' }; } });
  t.after(async () => { await local.close(); await fs.rm(root, { recursive: true, force: true }); });
  const call = async (route, body) => {
    const r = await fetch(local.origin + route, { method: 'POST', headers: { Origin: 'http://127.0.0.1:3035', Authorization: `Bearer ${local.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  };
  await call('/settings', { baseURL: 'https://example.test/v1', modelId: 'test', apiKey: 'test-key' });
  const draft = await call('/generate', { interviewId: 'i', questionId: 'q' });
  assert.equal(draft.data.previous.answer, '云端当前答案'); assert.equal(writes, 0);
  const saved = await call('/approve', { id: draft.data.id, confirm: true });
  assert.equal(saved.status, 200); assert.equal(writes, 1); assert.equal(current.oral, '旧口述');
  const stale = await call('/generate', { interviewId: 'i', questionId: 'q' }); revision++;
  const conflict = await call('/approve', { id: stale.data.id, confirm: true }); assert.equal(conflict.status, 409); assert.equal(writes, 1);
  fail = true;
  const broken = await call('/generate', { interviewId: 'i', questionId: 'q' }); assert.equal(broken.status, 503); assert.ok(!JSON.stringify(broken).includes('private-secret'));
  assert.equal(await fs.readFile(file, 'utf8'), before);
  assert.ok(headers.every(h => h.apikey === 'sb_secret_test' && !h.authorization));
});

test('REST 传输支持旧版 JWT Key，拒绝把密钥发到重定向目标', async t => {
  let auth;
  const upstream = http.createServer((req, res) => {
    auth = req.headers.authorization;
    res.writeHead(302, { Location: 'https://example.test/should-not-follow' }); res.end();
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => { upstream.close(); upstream.closeAllConnections(); });
  const key = jwt('anon');
  await assert.rejects(createSupabaseApi(`http://127.0.0.1:${upstream.address().port}`, key)('interview_records'));
  assert.equal(auth, `Bearer ${key}`);
});
