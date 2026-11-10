import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleDataRequest } from '../src/lib/server/api.mjs';

const token = 'test-admin-token-at-least-thirty-two-characters';
const sample = { id: 'test-question', number: 1, title: '测试问题', level: '简单', category: 'agent', sourceTopic: '测试', tags: 'Agent', core: '答案', oral: '口述', pitfalls: '注意事项' };
test('CRUD 接口验证鉴权、分页、版本冲突、字段限制、缺失记录与删除', async t => {
  let rows = []; let calls = 0;
  const upstream = http.createServer(async (req, res) => {
    calls++;
    const url = new URL(req.url, 'http://localhost');
    let body = ''; for await (const chunk of req) body += chunk;
    const input = body ? JSON.parse(body) : null;
    const matches = row => (!url.searchParams.has('id') || `eq.${row.id}` === url.searchParams.get('id')) && (!url.searchParams.has('revision') || `eq.${row.revision}` === url.searchParams.get('revision'));
    let result;
    if (req.method === 'GET') result = rows.filter(matches).slice(Number(url.searchParams.get('offset') || 0), Number(url.searchParams.get('offset') || 0) + Number(url.searchParams.get('limit') || 500));
    if (req.method === 'POST') {
      if (rows.some(row => row.id === input.id)) { res.writeHead(409, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ code: '23505' })); }
      result = [{ ...input, revision: 1 }]; rows.push(result[0]);
    }
    if (req.method === 'PATCH') { result = rows.filter(matches).map(row => Object.assign(row, input, { revision: row.revision + 1 })); }
    if (req.method === 'DELETE') { result = rows.filter(matches); rows = rows.filter(row => !matches(row)); }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const previous = { ...process.env };
  Object.assign(process.env, { SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SECRET_KEY: 'sb_secret_test', ADMIN_API_TOKEN: token });
  t.after(() => { upstream.close(); upstream.closeAllConnections(); for (const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','ADMIN_API_TOKEN']) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } });
  const call = async (method, parts, body, headers = {}, query = '') => {
    const request = new Request(`http://localhost/api/data/${parts.join('/')}/?${query}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const response = await handleDataRequest(request, parts);
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  const auth = { Authorization: `Bearer ${token}` };
  assert.equal((await call('POST', ['knowledge'], sample)).status, 401); assert.equal(calls, 0);
  assert.equal((await call('POST', ['knowledge'], { ...sample, injected: true }, auth)).status, 400);
  assert.equal((await call('POST', ['knowledge'], { ...sample, level: 'bad' }, auth)).status, 400);
  assert.equal((await call('POST', ['knowledge'], sample, auth)).status, 201);
  assert.equal((await call('POST', ['knowledge'], sample, auth)).status, 409);
  const list = await call('GET', ['knowledge']); assert.equal(list.body.data.length, 1);
  const get = await call('GET', ['knowledge','test-question']); assert.equal(get.headers.get('etag'), '"1"');
  assert.equal((await call('GET', ['knowledge'], undefined, {}, 'limit=99999')).status, 400);
  assert.equal((await call('GET', ['unknown'])).status, 404);
  assert.equal((await call('PATCH', ['knowledge','test-question'], { core: '新版' }, auth)).status, 428);
  const patched = await call('PATCH', ['knowledge','test-question'], { core: '新版' }, { ...auth, 'If-Match': '"1"' });
  assert.equal(patched.status, 200); assert.equal(patched.body.data._revision, 2); assert.equal(patched.body.data.oral, sample.oral);
  assert.equal((await call('PATCH', ['knowledge','test-question'], { core: '过时' }, { ...auth, 'If-Match': '"1"' })).status, 409);
  assert.equal((await call('DELETE', ['knowledge','test-question'], undefined, auth)).status, 428);
  assert.equal((await call('DELETE', ['knowledge','test-question'], undefined, { ...auth, 'If-Match': '"2"' })).status, 200);
  assert.equal((await call('GET', ['knowledge','test-question'])).status, 404);
  delete process.env.SUPABASE_SECRET_KEY;
  assert.equal((await call('POST', ['knowledge'], sample, auth)).status, 503);
  delete process.env.ADMIN_API_TOKEN;
  assert.equal((await call('POST', ['knowledge'], sample, auth)).status, 503);
});
