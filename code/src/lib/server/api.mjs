import { timingSafeEqual } from 'node:crypto';
import { allContent, listContent, getContent, writeContent, ContentError } from './content.mjs';
import { DatabaseError } from '../supabase-data.mjs';
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/;
const fields = {
  knowledge: { strings: ['title', 'level', 'category', 'sourceTopic', 'tags', 'core', 'oral', 'pitfalls'], arrays: [], nullable: [], optional: ['source'], number: true },
  interviews: { strings: ['company', 'companyEn', 'role', 'round', 'duration', 'summary'], arrays: ['tags', 'notes'], nullable: [], optional: ['answerNote'], number: false },
  questions: { strings: ['title', 'group', 'topic'], arrays: [], nullable: ['answer', 'oral', 'pitfalls'], optional: [], number: true },
};
function validate(resource, value, creating) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContentError(400, '请求体必须是 JSON 对象。');
  const spec = fields[resource];
  const allowed = [...spec.strings, ...spec.arrays, ...spec.nullable, ...spec.optional, '_position', ...(spec.number ? ['number'] : []), ...(creating ? ['id'] : [])];
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new ContentError(400, '请求中包含不允许修改的字段。');
  if (creating && (typeof value.id !== 'string' || !idPattern.test(value.id))) throw new ContentError(400, 'id 仅支持字母、数字、下划线和连字符。');
  for (const name of spec.strings) if ((creating || name in value) && (typeof value[name] !== 'string' || !value[name].trim() || value[name].length > 50000)) throw new ContentError(400, `${name} 必须是非空字符串。`);
  for (const name of spec.arrays) if ((creating || name in value) && (!Array.isArray(value[name]) || value[name].some(item => typeof item !== 'string'))) throw new ContentError(400, `${name} 必须是字符串数组。`);
  for (const name of spec.nullable) if ((creating || name in value) && value[name] !== null && typeof value[name] !== 'string') throw new ContentError(400, `${name} 必须是字符串或 null。`);
  for (const name of ['number', '_position']) if ((name === 'number' && spec.number && creating) || name in value) if (!Number.isSafeInteger(value[name]) || value[name] < (name === 'number' ? 1 : 0)) throw new ContentError(400, `${name} 必须是有效的整数。`);
  if ('answerNote' in value && typeof value.answerNote !== 'string') throw new ContentError(400, 'answerNote 必须是字符串。');
  if ('level' in value && !['简单', '中等', '困难'].includes(value.level)) throw new ContentError(400, '难度值无效。');
  if ('category' in value && !['llm','prompt','rag','agent','protocol','framework','finetune','transformer','engineering'].includes(value.category)) throw new ContentError(400, '知识分类无效。');
  if ('source' in value) {
    const s = value.source;
    if (!s || ['url','title','date','checkedAt'].some(key => typeof s[key] !== 'string')) throw new ContentError(400, 'source 格式无效。');
    try { if (!['http:', 'https:'].includes(new URL(s.url).protocol)) throw new Error(); } catch { throw new ContentError(400, '来源地址无效。'); }
  }
  if (!creating && !Object.keys(value).length) throw new ContentError(400, '没有要修改的字段。');
  return value;
}
function authenticate(request) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) throw new ContentError(503, '管理员接口尚未配置。');
  const supplied = request.headers.get('authorization') || '';
  const expected = `Bearer ${token}`;
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) throw new ContentError(401, '需要管理员凭据。');
}
async function bodyOf(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ContentError(415, '需要 application/json。');
  let size = 0; const parts = [];
  if (!request.body) throw new ContentError(400, '请求体为空。');
  for await (const chunk of request.body) { size += chunk.length; if (size > 200000) throw new ContentError(413, '请求体过大。'); parts.push(chunk); }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { throw new ContentError(400, 'JSON 格式无效。'); }
}
export async function handleDataRequest(request, segments) {
  const respond = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
  try {
    let [resource, id] = segments; let interviewId;
    if (resource === 'interviews' && segments[2] === 'questions' && [3,4].includes(segments.length)) { interviewId = id; resource = 'questions'; id = segments[3]; }
    else if (!['knowledge','interviews'].includes(resource) || segments.length > 2) throw new ContentError(404, '接口不存在。');
    if ([id, interviewId].filter(Boolean).some(value => !idPattern.test(value))) throw new ContentError(400, '记录 ID 无效。');
    const method = request.method;
    if (method === 'GET') {
      if (id) { const data = await getContent(resource, id, interviewId); if (!data) throw new ContentError(404, '记录不存在。'); return respond({ data }, 200, { ETag: `"${data._revision}"` }); }
      const query = new URL(request.url).searchParams;
      const offset = Number(query.get('offset') || 0), limit = Number(query.get('limit') || 100);
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 500) throw new ContentError(400, '分页参数无效，limit 范围为 1–500。');
      const data = await listContent(resource, { interviewId, offset, limit });
      if (resource === 'interviews' && query.get('include') === 'questions') await Promise.all(data.map(async item => { item.questions = await allContent('questions', item.id); }));
      return respond({ data, nextOffset: data.length ? offset + data.length : null });
    }
    authenticate(request);
    if (!['POST','PATCH','DELETE'].includes(method) || (method === 'POST' ? Boolean(id) : !id)) return respond({ error: '不支持该操作。' }, 405);
    let revision;
    if (method !== 'POST') {
      const match = /^"([1-9]\d*)"$/.exec(request.headers.get('if-match') || '');
      if (!match) throw new ContentError(428, '请先读取记录，并通过 If-Match 传入版本号。');
      revision = Number(match[1]);
    }
    const data = method === 'DELETE' ? undefined : validate(resource, await bodyOf(request), method === 'POST');
    const saved = await writeContent(resource, method, { id, interviewId, data, revision });
    return respond({ data: saved }, method === 'POST' ? 201 : 200);
  } catch (error) {
    if (error instanceof ContentError) return respond({ error: error.message }, error.status);
    if (error instanceof DatabaseError) {
      if (error.code === '23503') return respond({ error: '请先处理关联的面试记录或题目。' }, 409);
      if (error.code === '23505') return respond({ error: 'ID 已存在。' }, 409);
      return respond({ error: '数据库操作失败，请检查配置或稍后重试。' }, error.status === 409 ? 409 : 502);
    }
    return respond({ error: '数据服务暂时不可用，请稍后重试。' }, 503);
  }
}
