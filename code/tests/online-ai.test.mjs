import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnswerHandler, chooseModel } from '../src/lib/server/ai-answer.mjs';
import { isPublicAddress, validateModelURL, publicModelFetch } from '../src/lib/server/model-fetch.mjs';
import { handleDataRequest } from '../src/lib/server/api.mjs';
const accessKey='test-ai-access-key-at-least-thirty-two-characters';
const env={AI_ACCESS_KEY:accessKey,AI_BASE_URL:'https://default.example/v1',AI_API_KEY:'owner-secret',AI_MODEL_ID:'default-model'};
const call=(handler,body)=>handler(new Request('http://localhost/api/ai/answer/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interviewId:'i',questionId:'q',...body})}));

test('默认模型需访问密钥，自带模型不回退默认凭据，响应不泄露任何 Key',async()=>{
  const calls=[];
  const handler=createAnswerHandler({env,find:async()=>({title:'真实题目',_revision:1}),generate:async(settings,_i,_q,signal,options)=>{calls.push(settings);assert.ok(signal);assert.equal(options.fetch,publicModelFetch);return {answer:'测试答案'};}});
  assert.equal((await call(handler,{mode:'default'})).status,401);
  assert.equal((await call(handler,{mode:'default',accessKey:'wrong'})).status,401);assert.equal(calls.length,0);
  const response=await call(handler,{mode:'default',accessKey,settings:{apiKey:'injected'}});
  const generated=await response.json();assert.equal(generated.answer,'测试答案');assert.equal(typeof generated.approvalToken,'string');assert.ok(!JSON.stringify(generated).includes('owner-secret')); assert.equal(calls[0].apiKey,'owner-secret');
  const custom=await call(handler,{mode:'custom',settings:{baseURL:'https://custom.example/v1/chat/completions',apiKey:'own-key',modelId:'own-model'}});
  assert.equal((await custom.json()).approvalToken,undefined);
  assert.deepEqual(calls[1],{baseURL:'https://custom.example/v1',apiKey:'own-key',modelId:'own-model'});
  assert.equal((await call(handler,{mode:'custom',settings:{baseURL:'https://custom.example/v1',modelId:'x'}})).status,400);
  assert.throws(()=>chooseModel({mode:'default',accessKey},{...env,AI_ACCESS_KEY:''}));
});
test('自定义模型禁止内网、凭据 URL、重定向风险，DNS 解析也检查目标地址',async()=>{
  for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','192.168.1.1','172.16.1.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::'])assert.equal(isPublicAddress(address),false,address);
  for(const address of ['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])assert.equal(isPublicAddress(address),true,address);
  for(const url of ['http://public.example','https://127.0.0.1','https://[::1]','https://user:pass@public.example','https://public.example?key=x'])assert.throws(()=>validateModelURL(url));
  await assert.rejects(publicModelFetch('https://localhost/v1',{method:'POST',body:'{}'}));
});
test('普通 AI 访问密钥不能写公共题库；生成失败不泄露供应商异常',async()=>{
  const previous=process.env.ADMIN_API_TOKEN;process.env.ADMIN_API_TOKEN='separate-admin-token-at-least-32-characters';
  try{const result=await handleDataRequest(new Request('http://localhost/api/data/knowledge/',{method:'POST',headers:{Authorization:`Bearer ${accessKey}`,'Content-Type':'application/json'},body:'{}'}),['knowledge']);assert.equal(result.status,401);}finally{if(previous===undefined)delete process.env.ADMIN_API_TOKEN;else process.env.ADMIN_API_TOKEN=previous;}
  const handler=createAnswerHandler({env,find:async()=>({}),generate:async()=>{throw new Error('owner-secret own-key private-provider-body');}});
  const result=await call(handler,{mode:'default',accessKey});assert.equal(result.status,502);assert.ok(!(await result.text()).includes('secret'));
});
test('并发达到上限时拒绝额外生成，取消可传递给模型',async()=>{
  const pending=[];
  const handler=createAnswerHandler({env,find:async()=>({}),generate:async(_s,_i,_q,signal)=>new Promise(resolve=>{pending.push(()=>resolve({answer:'ok'}));assert.ok(signal);})});
  const requests=Array.from({length:3},()=>call(handler,{mode:'default',accessKey}));
  while(pending.length<3)await new Promise(resolve=>setTimeout(resolve,1));
  assert.equal((await call(handler,{mode:'default',accessKey})).status,429);
  pending.forEach(resolve=>resolve());assert.ok((await Promise.all(requests)).every(r=>r.status===200));
});
