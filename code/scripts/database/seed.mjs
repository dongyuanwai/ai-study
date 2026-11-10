import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadLocalEnv, databaseConfig } from './config.mjs';
import { createSupabaseApi, seedRows } from '../../src/lib/supabase-data.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
loadLocalEnv(root);
try {
  const config = databaseConfig();
  if (!config) throw new Error('请先在 .env.local 填写 Supabase 配置。');
  const request = createSupabaseApi(config.url, config.key);
  const data = JSON.parse(await fs.readFile(new URL('../../src/data/company-interviews.json', import.meta.url), 'utf8'));
  const rows = seedRows(data);
  const knowledge = JSON.parse(await fs.readFile(new URL("../../src/data/questions.json", import.meta.url), "utf8")).map(({ id, ...content }, position) => ({ id, position, content }));
  for (const [table, items, conflict] of [['knowledge_questions', knowledge, 'id'], ['interview_records', rows.records, 'id'], ['interview_questions', rows.questions, 'interview_id,id']]) {
    for (let start = 0; start < items.length; start += 100) {
      await request(`${table}?on_conflict=${conflict}`, { method: 'POST', body: items.slice(start, start + 100), headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' } });
    }
  }
  console.log(`导入完成：检查了 ${knowledge.length} 道知识库题目、${rows.records.length} 场面试、${rows.questions.length} 道公司题；已存在的记录保持不变。`);
} catch (error) {
  console.error(error.message.startsWith('fetch') ? '无法连接 Supabase，请检查项目地址和网络。' : error.message);
  process.exitCode = 1;
}
