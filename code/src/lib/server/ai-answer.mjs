import { approvalToken } from './ai-approval.mjs';
import { timingSafeEqual } from 'node:crypto';
import { getContent } from './content.mjs';
import { generateAnswer } from '../../../scripts/local-ai/model.mjs';
import { publicModelFetch, validateModelURL } from './model-fetch.mjs';

class AiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const same = (a,b) => Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function chooseModel(input, env) {
  if (input.mode === 'default') {
    const key = env.AI_ACCESS_KEY || '';
    if (!key) throw new AiError(503, '默认模型暂未开放，请使用自己的模型配置。');
    if (typeof input.accessKey !== 'string' || !same(input.accessKey, key)) throw new AiError(401, '访问密钥不正确。');
    if (!env.AI_BASE_URL || !env.AI_API_KEY || !env.AI_MODEL_ID) throw new AiError(503, '默认模型尚未配置。');
    return { baseURL: env.AI_BASE_URL, apiKey: env.AI_API_KEY, modelId: env.AI_MODEL_ID };
  }
  if (input.mode !== 'custom') throw new AiError(400, '请选择模型使用方式。');
  const settings = input.settings;
  if (!settings || ['baseURL','apiKey','modelId'].some(name => typeof settings[name] !== 'string' || !settings[name].trim() || settings[name].length > 4096 || /[\r\n\0]/.test(settings[name]))) throw new AiError(400, '请填写 API 地址、Key 和模型 ID。');
  try { validateModelURL(settings.baseURL); } catch { throw new AiError(400, '模型接口必须是公网 HTTPS 地址。'); }
  return { baseURL: settings.baseURL.trim().replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, ''), apiKey: settings.apiKey.trim(), modelId: settings.modelId.trim() };
}

export function createAnswerHandler({ env = process.env, generate = generateAnswer, find = getContent } = {}) {
  let active = 0;
  return async function answer(request) {
    const respond = (value,status=200) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
    let acquired = false;
    try {
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AiError(415,'需要 JSON 请求。');
      const chunks = []; let size = 0;
      if (!request.body) throw new AiError(400,'请求体为空。');
      for await (const chunk of request.body) { size += chunk.length; if (size > 16384) throw new AiError(413,'请求过大。'); chunks.push(chunk); }
      let input; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AiError(400,'请求格式不正确。'); }
      if (!input || typeof input !== 'object') throw new AiError(400,'请求格式不正确。');
      const settings = chooseModel(input, env);
      if ([input.interviewId,input.questionId].some(id => typeof id !== 'string' || !/^[\w-]{1,160}$/.test(id))) throw new AiError(400,'题目 ID 无效。');
      if (active >= 3) throw new AiError(429,'当前生成请求较多，请稍后重试。');
      active++; acquired = true;
      const [interview,question] = await Promise.all([find('interviews',input.interviewId),find('questions',input.questionId,input.interviewId)]);
      if (!interview || !question) throw new AiError(404,'题目不存在。');
      const result = await generate(settings,interview,question,AbortSignal.any([request.signal,AbortSignal.timeout(95000)]),{fetch:publicModelFetch});
      return respond({ answer: result.answer, ...(input.mode === 'default' ? { approvalToken: approvalToken(input.interviewId,input.questionId,question._revision,result.answer,env) } : {}) });
    } catch (error) {
      if (error instanceof AiError) return respond({error:error.message},error.status);
      if (['AbortError','TimeoutError'].includes(error.name)) return respond({error:'生成已取消或超时，请重试。'},504);
      if (error.code === 'InvalidSubscription') return respond({error:'模型服务的套餐无效或已过期，请检查订阅状态。'},502);
      return respond({error:'生成失败，请检查模型配置或稍后重试。'},502);
    } finally { if (acquired) active--; }
  };
}
