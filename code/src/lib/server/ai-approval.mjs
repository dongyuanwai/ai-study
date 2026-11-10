import { createHmac, timingSafeEqual } from 'node:crypto';
import { ContentError, writeContent } from './content.mjs';
import { DatabaseError } from '../supabase-data.mjs';

const sign = (payload, env) => createHmac('sha256', env.AI_API_KEY).update('ai-answer-approval-v1:').update(payload).digest('base64url');
export function approvalToken(interviewId, questionId, revision, answer, env, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ interviewId, questionId, revision, answer, expires: now + 30 * 60 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload, env)}`;
}
export function verifyApproval(token, env, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 150000 || !env.AI_API_KEY) throw new ContentError(400,'回答预览无效，请重新生成。');
  const parts = token.split('.');
  if (parts.length !== 2) throw new ContentError(400,'回答预览无效，请重新生成。');
  const expected = sign(parts[0], env);
  if (Buffer.byteLength(parts[1]) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) throw new ContentError(400,'回答预览无效，请重新生成。');
  let draft;
  try { draft = JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8')); } catch { throw new ContentError(400,'回答预览无效，请重新生成。'); }
  if (!Number.isFinite(draft.expires) || draft.expires < now) throw new ContentError(410,'回答预览已过期，请重新生成。');
  return draft;
}
export function createApprovalHandler({ env = process.env, save = writeContent } = {}) {
  return async function approve(request) {
    const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
    try {
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ContentError(415,'需要 JSON 请求。');
      if (!request.body) throw new ContentError(400,'请求体为空。');
      const chunks=[];let size=0;for await(const chunk of request.body){size+=chunk.length;if(size>160000)throw new ContentError(413,'请求过大。');chunks.push(chunk);}
      let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ContentError(400,'请求格式不正确。');}
      if (!input || typeof input !== 'object') throw new ContentError(400,'请求格式不正确。');
      const key=env.AI_ACCESS_KEY||'';const supplied=typeof input.accessKey==='string'?input.accessKey:'';
      if (!key || Buffer.byteLength(supplied)!==Buffer.byteLength(key) || !timingSafeEqual(Buffer.from(supplied),Buffer.from(key))) throw new ContentError(401,'访问密钥不正确。');
      if(input.confirm!==true)throw new ContentError(400,'请先确认替换公共答案。');
      const draft=verifyApproval(input.approvalToken,env);
      const result=await save('questions','PATCH',{id:draft.questionId,interviewId:draft.interviewId,data:{answer:draft.answer},revision:draft.revision});
      return reply({answer:result.answer});
    }catch(error){
      if(error instanceof ContentError)return reply({error:error.message},error.status);
      if(error instanceof DatabaseError && error.status===409)return reply({error:'公共答案已被修改，请重新生成后再替换。'},409);
      return reply({error:'保存失败，请检查数据库配置或稍后重试。'},502);
    }
  };
}
