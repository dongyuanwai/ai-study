// Next.js 服务端与本地工具共用 REST 传输层；不直接读取环境变量。
export class DatabaseError extends Error {
  constructor(status, code = '') {
    super(status === 409 ? '这道题已被修改，请刷新后重新生成。' : `数据库请求失败（HTTP ${status}），请检查 Supabase 配置和迁移状态。`);
    this.status = status;
    this.code = code;
  }
}

export function validatePublicKey(key) {
  if (key.startsWith('sb_publishable_')) return;
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role === 'anon') return;
  } catch {}
  throw new Error('公开配置只能填写 Supabase Publishable Key 或 anon Key，不能填写管理员密钥。');
}

export function createSupabaseApi(url, key) {
  const base = new URL(url);
  if ((base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('Supabase URL 应填写项目根地址，例如 https://项目编号.supabase.co。');
  }
  if (!key) throw new Error('缺少 Supabase API Key。');
  return async function request(route, { method = 'GET', body, headers = {}, signal } = {}) {
    const response = await fetch(`${base.origin}/rest/v1/${route}`, {
      method, cache: 'no-store', redirect: 'error',
      headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      let code = '';
      try { code = (await response.json()).code || ''; } catch {}
      throw new DatabaseError(response.status, code);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };
}

export function seedRows(records) {
  return {
    records: records.map(({ id, questions, ...details }, position) => ({ id, position, details })),
    questions: records.flatMap(record => record.questions.map(({ id, ...content }, position) => ({ interview_id: record.id, id, position, content }))),
  };
}
