import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadCache } from '../read-cache.mjs';
const cache = createReadCache();
export const invalidateContentCache = () => cache.clear();
import { createSupabaseApi, validatePublicKey } from '../supabase-data.mjs';

export const resources = {
  knowledge: { table: 'knowledge_questions', field: 'content', file: 'questions.json' },
  interviews: { table: 'interview_records', field: 'details', file: 'company-interviews.json' },
  questions: { table: 'interview_questions', field: 'content', file: 'company-interviews.json' },
};
export class ContentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function connection(write = false, env = process.env) {
  const url = env.SUPABASE_URL;
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const secret = env.SUPABASE_SECRET_KEY;
  if (!url && !publicKey && !secret) {
    if (write) throw new ContentError(503, '请先配置 Supabase 并导入数据。');
    return null;
  }
  if (!url || !publicKey || (write && !secret)) throw new ContentError(503, 'Supabase 配置不完整。');
  validatePublicKey(publicKey);
  return createSupabaseApi(url, write ? secret : publicKey);
}
const rowData = (row, resource) => ({ ...row[resources[resource].field], id: row.id, _revision: row.revision, _position: row.position });
export async function listContent(resource, { interviewId, offset = 0, limit = 500 } = {}) {
  const key = JSON.stringify([process.env.SUPABASE_URL || 'local', resource, interviewId, offset, limit]);
  return cache.read(key, () => readContentPage(resource, { interviewId, offset, limit }));
}
async function readContentPage(resource, { interviewId, offset, limit }) {
  const definition = resources[resource];
  const request = connection();
  if (!request) {
    const raw = JSON.parse(await fs.readFile(path.join(process.cwd(), 'src/data', definition.file), 'utf8'));
    const data = resource === 'questions' ? raw.find(item => item.id === interviewId)?.questions || [] : resource === 'interviews' ? raw.map(({ questions, ...item }) => item) : raw;
    return data.slice(offset, offset + limit).map((item, i) => ({ ...item, _revision: 0, _position: offset + i }));
  }
  const params = new URLSearchParams({ select: '*', order: 'position.asc,id.asc', offset: String(offset), limit: String(limit) });
  if (interviewId) params.set('interview_id', `eq.${interviewId}`);
  return (await request(`${definition.table}?${params}`)).map(row => rowData(row, resource));
}
export async function allContent(resource, interviewId) {
  const rows = [];
  while (true) {
    const batch = await listContent(resource, { interviewId, offset: rows.length });
    if (!batch.length) return rows;
    rows.push(...batch);
  }
}
export async function getContent(resource, id, interviewId) {
  const request = connection();
  if (!request) return (await allContent(resource, interviewId)).find(item => item.id === id) || null;
  const params = new URLSearchParams({ id: `eq.${id}`, select: '*' });
  if (interviewId) params.set('interview_id', `eq.${interviewId}`);
  const rows = await request(`${resources[resource].table}?${params}`);
  return rows[0] ? rowData(rows[0], resource) : null;
}
export async function writeContent(resource, method, { id, interviewId, data, revision } = {}) {
  const request = connection(true);
  const definition = resources[resource];
  const params = new URLSearchParams();
  if (id) params.set('id', `eq.${id}`);
  if (interviewId) params.set('interview_id', `eq.${interviewId}`);
  let body;
  if (method === 'POST') {
    const { id: newId, _position = 0, ...content } = data;
    body = { id: newId, position: _position, [definition.field]: content, ...(interviewId ? { interview_id: interviewId } : {}) };
  } else {
    const current = await getContent(resource, id, interviewId);
    if (!current) throw new ContentError(404, '记录不存在。');
    if (current._revision !== revision) throw new ContentError(409, '数据已改变，请重新读取后再修改。');
    params.set('revision', `eq.${revision}`);
    if (method === 'PATCH') {
      const { id: _id, _revision: _revision, _position, ...content } = { ...current, ...data };
      body = { position: _position, [definition.field]: content };
    }
  }
  const rows = await request(`${definition.table}?${params}`, { method, body, headers: { Prefer: 'return=representation' } });
  if (!rows.length) throw new ContentError(409, '数据已改变，请重新读取后再修改。');
  invalidateContentCache();
  return rowData(rows[0], resource);
}
