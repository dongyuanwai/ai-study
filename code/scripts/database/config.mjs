import fs from 'node:fs';
import path from 'node:path';
import { validatePublicKey } from '../../src/lib/supabase-data.mjs';

export function loadLocalEnv(root) {
  const file = path.join(root, '.env.local');
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

export function databaseConfig(env = process.env) {
  const url = env.SUPABASE_URL?.trim();
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const secret = env.SUPABASE_SECRET_KEY?.trim();
  if (!url && !publicKey && !secret) return null;
  if (!url || !publicKey) throw new Error('请同时填写 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY。');
  validatePublicKey(publicKey);
  if (!secret) throw new Error('本地 AI 保存需要 SUPABASE_SECRET_KEY，请在 .env.local 中配置。');
  if (!secret.startsWith('sb_secret_')) {
    let role;
    try { role = JSON.parse(Buffer.from(secret.split('.')[1], 'base64url').toString()).role; } catch {}
    if (role !== 'service_role') throw new Error('SUPABASE_SECRET_KEY 需使用 Secret Key 或旧版 service_role Key。');
  }
  return { url, key: secret };
}
