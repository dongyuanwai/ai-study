// 仅启动一次性隔离容器；不连接用户云端数据库，也不挂载本地数据卷。
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { seedRows } from '../../src/lib/supabase-data.mjs';
const name = `ai-study-db-test-${randomUUID().slice(0, 8)}`;
const docker = (args, input) => {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout: 60000 });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Docker 操作失败');
  return result.stdout.trim();
};
const psqlArgs = ['exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'];
const sql = text => docker(psqlArgs, text);
const quote = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
let started = false;
try {
  docker(['run', '--rm', '-d', '--network', 'none', '--name', name, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17-bookworm']); started = true;
  for (let i = 0; ; i++) {
    const ready = spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'postgres'], { encoding: 'utf8' });
    if (ready.status === 0) break;
    if (i >= 60) throw new Error('测试数据库启动超时');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  sql('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;');
  for (const filename of (await fs.readdir(new URL('../../supabase/migrations/', import.meta.url))).filter(file => file.endsWith('.sql')).sort()) sql(await fs.readFile(new URL(`../../supabase/migrations/${filename}`, import.meta.url), 'utf8'));
  const records = JSON.parse(await fs.readFile(new URL('../../src/data/company-interviews.json', import.meta.url), 'utf8'));
  const rows = seedRows(records);
  const seed = `insert into public.interview_records (id,position,details) select id,position,details from jsonb_populate_recordset(null::public.interview_records, ${quote(rows.records)}) on conflict do nothing;
insert into public.interview_questions (interview_id,id,position,content) select interview_id,id,position,content from jsonb_populate_recordset(null::public.interview_questions, ${quote(rows.questions)}) on conflict do nothing;`;
  sql(seed); sql(seed);
  assert.equal(sql('select count(*) from public.interview_questions;'), String(rows.questions.length));
  for (const role of ['anon', 'authenticated']) {
    assert.equal(sql(`set role ${role}; select count(*) from public.interview_questions;`).split('\n').at(-1), String(rows.questions.length));
    for (const operation of ["update public.interview_questions set content = '{}'::jsonb", 'select * from public.interview_answer_history', "select public.approve_interview_answer('i','q',1,'x')", "insert into public.interview_records values ('bad',0,'{}')"]) {
      assert.throws(() => sql(`set role ${role}; ${operation};`), /permission denied/);
    }
  }
  const first = rows.questions[0];
  const id = value => `'${value.replaceAll("'", "''")}'`;
  const approve = revision => `set role service_role; select public.approve_interview_answer(${id(first.interview_id)},${id(first.id)},${revision},'测试新答案');`;
  sql(approve(1));
  assert.throws(() => sql(approve(1)), /answer_conflict/);
  assert.equal(sql('select count(*) from public.interview_answer_history;'), '1');
  const current = JSON.parse(sql(`select content from public.interview_questions where interview_id=${id(first.interview_id)} and id=${id(first.id)};`));
  assert.deepEqual(current, { ...first.content, answer: '测试新答案' });
  assert.deepEqual(JSON.parse(sql('select previous_content from public.interview_answer_history;')), first.content);
  sql(seed);
  assert.equal(sql(`select content->>'answer' from public.interview_questions where interview_id=${id(first.interview_id)} and id=${id(first.id)};`), '测试新答案');
  const concurrently = () => new Promise(resolve => {
    const child = spawn('docker', psqlArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; }); child.stdout.resume();
    child.on('close', code => resolve({ code, stderr })); child.stdin.end(approve(2));
  });
  const results = await Promise.all([concurrently(), concurrently()]);
  assert.equal(results.filter(result => result.code === 0).length, 1);
  assert.match(results.find(result => result.code !== 0).stderr, /answer_conflict/);
  assert.equal(sql('select count(*) from public.interview_answer_history;'), '2');
  const knowledge = JSON.parse(await fs.readFile(new URL('../../src/data/questions.json', import.meta.url), 'utf8')).map(({ id, ...content }, position) => ({ id, position, content }));
  sql(`insert into public.knowledge_questions (id,position,content) select id,position,content from jsonb_populate_recordset(null::public.knowledge_questions, ${quote(knowledge)}) on conflict do nothing;`);
  assert.equal(sql('set role anon; select count(*) from public.knowledge_questions;').split('\n').at(-1), String(knowledge.length));
  assert.throws(() => sql("set role anon; delete from public.knowledge_questions;"), /permission denied/);
  sql("set role service_role; update public.knowledge_questions set content=jsonb_set(content,'{core}','\"changed\"') where id='easy-1' and revision=1;");
  assert.equal(sql("select revision from public.knowledge_questions where id='easy-1';"), '2');
  sql("set role service_role; delete from public.knowledge_questions where id='easy-1' and revision=2;");
  assert.equal(sql("select count(*) from public.knowledge_question_history where question_id='easy-1';"), '2');
  assert.throws(() => sql("set role anon; select * from public.knowledge_question_history;"), /permission denied/);
  console.log(`PostgreSQL 验证通过：${rows.records.length} 场面试、${rows.questions.length} 题；重复导入不覆盖、公开只读、历史不可读、确认事务与并发冲突。`);
} finally { if (started) docker(['stop', name]); }
