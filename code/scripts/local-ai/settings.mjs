import fs from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';

const names = { baseURL: 'AI_BASE_URL', apiKey: 'AI_API_KEY', modelId: 'AI_MODEL_ID' };
const readFile = async file => { try { return await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return ''; throw error; } };
export async function readAiSettings(root) {
  const values = parseEnv(await readFile(path.join(root, '.env.local')));
  return Object.fromEntries(Object.entries(names).map(([field, name]) => [field, values[name] || '']));
}
function encode(value) {
  if (typeof value !== 'string' || /[\r\n\0]/.test(value)) throw new Error('AI 配置必须是单行文本。');
  for (const quote of ["'", '"', '`']) {
    if (!value.includes(quote)) {
      const encoded = `${quote}${value}${quote}`;
      if (parseEnv(`VALUE=${encoded}`).VALUE === value) return encoded;
    }
  }
  throw new Error('AI 配置包含不支持的引号。');
}
export async function saveAiSettings(root, settings) {
  const file = path.join(root, '.env.local');
  const raw = await readFile(file);
  let next = raw;
  for (const [field, name] of Object.entries(names)) {
    const line = `${name}=${encode(settings[field])}`;
    const pattern = new RegExp('^[ \\t]*(?:export[ \\t]+)?' + name + '[ \\t]*=[ \\t]*(?:\'[^\']*\'|"[^"]*"|`[^`]*`|[^\\r\\n]*)[^\\r\\n]*', 'gm');
    let found = false;
    next = next.replace(pattern, () => { if (found) return ''; found = true; return line; });
    if (!found) next += `${next.endsWith('\n') || !next ? '' : '\n'}${line}\n`;
  }
  if (await readFile(file) !== raw) throw new Error('配置文件已被修改，请重新保存。');
  const temp = `${file}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temp, next, { flag: 'wx', mode: 0o600 }); await fs.rename(temp, file); }
  finally { await fs.rm(temp, { force: true }); }
}

// 一次性迁移已有本地设置；任何已填写的 AI 配置都优先于旧文件。
export async function migrateAiSettings(root) {
  const current = await readAiSettings(root);
  if (Object.values(current).some(Boolean)) return false;
  const file = path.join(root, '.local-ai/settings.json');
  const raw = await readFile(file);
  if (!raw) return false;
  const old = JSON.parse(raw);
  await saveAiSettings(root, { baseURL: old.baseURL || '', apiKey: old.apiKey || '', modelId: old.modelId || '' });
  return true;
}
