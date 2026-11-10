import test from 'node:test';
import assert from 'node:assert/strict';
import { approvalToken, verifyApproval, createApprovalHandler } from '../src/lib/server/ai-approval.mjs';
import { ContentError } from '../src/lib/server/content.mjs';
const env={AI_ACCESS_KEY:'test1997',AI_API_KEY:'server-only-provider-key'};
const request=body=>new Request('http://localhost/api/ai/approve/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('仅有效访问密钥和服务端签发预览能确认保存，不能篡改答案或题目',async()=>{
  const token=approvalToken('interview','question',1,'已预览的答案',env);
  let revision=1;const writes=[];
  const handler=createApprovalHandler({env,save:async(resource,method,input)=>{if(input.revision!==revision)throw new ContentError(409,'conflict');writes.push({resource,method,input});revision++;return {answer:input.data.answer};}});
  assert.equal((await handler(request({approvalToken:token,confirm:true}))).status,401);
  assert.equal((await handler(request({accessKey:'wrong',approvalToken:token,confirm:true}))).status,401);
  assert.equal((await handler(request({accessKey:env.AI_ACCESS_KEY,approvalToken:token}))).status,400);
  const [payload,signature]=token.split('.');const tampered=JSON.parse(Buffer.from(payload,'base64url').toString());tampered.answer='篡改';tampered.questionId='other';
  const forged=Buffer.from(JSON.stringify(tampered)).toString('base64url')+'.'+signature;
  assert.equal((await handler(request({accessKey:env.AI_ACCESS_KEY,approvalToken:forged,confirm:true}))).status,400);assert.equal(writes.length,0);
  const response=await handler(request({accessKey:env.AI_ACCESS_KEY,approvalToken:token,confirm:true,answer:'请求中注入',questionId:'other'}));
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{answer:'已预览的答案'});
  assert.deepEqual(writes[0],{resource:'questions',method:'PATCH',input:{id:'question',interviewId:'interview',data:{answer:'已预览的答案'},revision:1}});
  assert.equal((await handler(request({accessKey:env.AI_ACCESS_KEY,approvalToken:token,confirm:true}))).status,409);assert.equal(writes.length,1);
});
test('过期或非服务端密钥签名的预览不能写入',()=>{
  const token=approvalToken('i','q',1,'answer',env,0);
  assert.throws(()=>verifyApproval(token,env,31*60*1000),/过期/);
  const forged=approvalToken('i','q',1,'answer',{AI_API_KEY:env.AI_ACCESS_KEY});
  assert.throws(()=>verifyApproval(forged,env),/无效/);
});
