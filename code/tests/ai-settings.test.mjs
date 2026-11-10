import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readAiSettings, saveAiSettings, migrateAiSettings } from '../scripts/local-ai/settings.mjs';

test('AI 设置读写 .env.local，保留数据库配置、注释和多行变量', async t => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ai-env-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const original='# 配置\nSUPABASE_URL=https://example.supabase.co\nSUPABASE_SECRET_KEY=keep-me\nPRIVATE_TEXT="line1\nline2"\nexport AI_BASE_URL="https://old.example/v1" # old\nAI_API_KEY=old\nAI_MODEL_ID=old\nAI_MODEL_ID=duplicate\n';
  await fs.writeFile(path.join(root,'.env.local'),original);
  const settings={baseURL:'https://new.example/v1',apiKey:'test-$value#hash=literal',modelId:'model'};
  await saveAiSettings(root,settings);
  assert.deepEqual(await readAiSettings(root),settings);
  const saved=await fs.readFile(path.join(root,'.env.local'),'utf8');
  assert.ok(saved.startsWith(original.slice(0,original.indexOf('export AI_BASE_URL'))));
  assert.equal((saved.match(/^AI_MODEL_ID=/gm)||[]).length,1);
  assert.equal((await fs.stat(path.join(root,'.env.local'))).mode&0o777,0o600);
  await assert.rejects(saveAiSettings(root,{...settings,apiKey:'key\nADMIN_API_TOKEN=inject'}));
  assert.equal(await fs.readFile(path.join(root,'.env.local'),'utf8'),saved);
  await fs.writeFile(path.join(root,'.env.local'),saved.replace('AI_MODEL_ID=\'model\'',"AI_MODEL_ID='changed'"));
  assert.equal((await readAiSettings(root)).modelId,'changed');
});
test('旧 AI 配置可迁移，已有 env 配置优先且不混用旧密钥',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ai-migrate-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.mkdir(path.join(root,'.local-ai'));
  const old={baseURL:'https://old.example/v1',apiKey:'old-key',modelId:'old-model'};
  await fs.writeFile(path.join(root,'.local-ai/settings.json'),JSON.stringify(old));
  assert.equal(await migrateAiSettings(root),true);assert.deepEqual(await readAiSettings(root),old);
  await fs.writeFile(path.join(root,'.env.local'),'AI_BASE_URL=https://new.example/v1\n');
  assert.equal(await migrateAiSettings(root),false);assert.equal((await readAiSettings(root)).apiKey,'');
});
