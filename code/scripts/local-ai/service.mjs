import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { generateAnswer, validateAnswer } from "./model.mjs";
import { readAiSettings, saveAiSettings } from "./settings.mjs";
import { DatabaseError } from "../../src/lib/supabase-data.mjs";

const loopback = host => ["localhost", "127.0.0.1", "[::1]"].includes(host);
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const pick = question => ({ answer: question.answer });
class RequestError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function normalizeSettings(input, previous = {}) {
  if (!input || typeof input.baseURL !== "string" || typeof input.modelId !== "string" || typeof input.apiKey !== "string") throw new RequestError(400, "请填写 URL 和模型 ID。");
  let url;
  try { url = new URL(input.baseURL.trim()); } catch { throw new RequestError(400, "URL 格式不正确。"); }
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback(url.hostname))) || url.username || url.password || url.search || url.hash) throw new RequestError(400, "使用 HTTPS 地址，或本机 HTTP 地址；URL 不应包含密钥、查询参数或片段。");
  url.pathname = url.pathname.replace(/\/chat\/completions\/?$/, "").replace(/\/+$/, "") || "/";
  const baseURL = url.href.replace(/\/+$/, "");
  const modelId = input.modelId.trim();
  if (!modelId || modelId.length > 200 || input.apiKey.length > 4096) throw new RequestError(400, "模型 ID 或 API Key 格式不正确。");
  // 更换接口后不沿用旧密钥，防止将另一服务的密钥发往新地址。
  const apiKey = input.apiKey.trim() || (previous.baseURL === baseURL ? previous.apiKey : "") || "";
  if (!apiKey && !loopback(url.hostname)) throw new RequestError(400, "请为这个 URL 填写 API Key。");
  return { baseURL, modelId, apiKey };
}

async function atomicWrite(file, text, mode = 0o600) {
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, text, { flag: "wx", mode });
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}

export async function createLocalAiService({ root, webPort, generate = generateAnswer, repository = null }) {
  if (process.env.NODE_ENV === "production") throw new Error("本地 AI 服务不允许在生产环境启动。");
  const dataFile = path.join(root, "src/data/company-interviews.json");
  const localDir = path.join(root, ".local-ai");
  const token = randomBytes(32).toString("hex");
  const allowedOrigins = new Set([`http://127.0.0.1:${webPort}`, `http://localhost:${webPort}`]);
  const drafts = new Map();
  let busy = false;
  let writes = Promise.resolve();
  const serial = fn => { const job = writes.then(fn); writes = job.catch(() => {}); return job; };
  const readSettings = () => readAiSettings(root);
  const publicSettings = settings => ({ baseURL: settings.baseURL || "", modelId: settings.modelId || "", hasApiKey: Boolean(settings.apiKey) });
  const findQuestion = (records, interviewId, questionId) => {
    const interview = records.find(item => item.id === interviewId);
    const question = interview?.questions.find(item => item.id === questionId);
    if (!question) throw new RequestError(404, "找不到这道面试题，请刷新页面。");
    return { interview, question };
  };
  const readBody = async req => {
    if (!req.headers["content-type"]?.startsWith("application/json")) throw new RequestError(415, "需要 JSON 请求。");
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 16384) throw new RequestError(413, "请求内容过长。");
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new RequestError(400, "请求格式不正确。"); }
  };
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => { if (!res.destroyed) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(data)); } };
    res.setHeader("Cache-Control", "no-store");
    const address = server.address();
    if (req.headers.host !== `127.0.0.1:${address.port}` || !allowedOrigins.has(req.headers.origin)) return send(403, { error: "仅允许本机开发页面访问。" });
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" });
      return res.end();
    }
    if (req.headers.authorization !== `Bearer ${token}`) return send(403, { error: "本地会话已失效，请刷新页面。" });
    const route = new URL(req.url, "http://localhost").pathname;
    try {
      if (route === "/settings" && req.method === "GET") return send(200, publicSettings(await readSettings()));
      if (route === "/settings" && req.method === "POST") {
        const input = await readBody(req);
        const settings = await serial(async () => {
          const settings = normalizeSettings(input, await readSettings());
          await saveAiSettings(root, settings);
          return settings;
        });
        return send(200, publicSettings(settings));
      }
      if (route === "/generate" && req.method === "POST") {
        const input = await readBody(req);
        if (busy) throw new RequestError(409, "已有题目正在生成，请稍后再试。");
        const current = repository
          ? await repository.find(input.interviewId, input.questionId)
          : findQuestion(JSON.parse(await fs.readFile(dataFile, "utf8")), input.interviewId, input.questionId);
        const { interview, question } = current;
        const settings = await readSettings();
        if (!settings.baseURL || !settings.modelId) throw new RequestError(400, "请先打开 AI 设置，填写 URL、API Key 和模型 ID。");
        const revision = repository ? current.revision : digest(question);
        const controller = new AbortController();
        const cancel = () => { if (!res.writableEnded) controller.abort(); };
        res.once("close", cancel);
        busy = true;
        try {
          const output = validateAnswer(await generate(settings, interview, question, AbortSignal.any([controller.signal, AbortSignal.timeout(95000)])), question);
          if (controller.signal.aborted) return;
          for (const [id, draft] of drafts) if (draft.expiresAt < Date.now()) drafts.delete(id);
          if (drafts.size >= 100) drafts.delete(drafts.keys().next().value);
          const id = randomUUID();
          drafts.set(id, { interviewId: interview.id, questionId: question.id, revision, output, expiresAt: Date.now() + 30 * 60 * 1000 });
          return send(200, { id, questionTitle: question.title, previous: pick(question), ...output });
        } catch (error) {
          if (controller.signal.aborted) return;
          if (["AbortError", "TimeoutError"].includes(error.name)) throw new RequestError(504, "生成超时，请稍后重试。");
          if (error.status === 400 && error.code === "InvalidSubscription") throw new RequestError(502, "模型接口拒绝请求：当前账号没有有效的 Agent Plan 订阅，或订阅已过期。请到火山方舟控制台检查套餐状态；如使用按量计费，请填写对应的接口地址、API Key 和模型 ID。（InvalidSubscription）");
          if (typeof error.status === "number") throw new RequestError(502, `模型接口请求失败（HTTP ${error.status}），请检查 URL、API Key 和模型 ID。`);
          // 不把供应商异常正文回传，避免异常中包含密钥、请求头或私人数据。
          throw new RequestError(502, "生成失败或回答格式不符合要求，请检查配置后重试。");
        } finally { busy = false; res.off("close", cancel); }
      }
      if (route === "/draft" && req.method === "DELETE") {
        const input = await readBody(req); drafts.delete(input.id); return send(200, { discarded: true });
      }
      if (route === "/approve" && req.method === "POST") {
        const input = await readBody(req);
        if (input.confirm !== true) throw new RequestError(400, "请先确认替换。");
        const result = await serial(async () => {
          const draft = drafts.get(input.id);
          if (!draft || draft.expiresAt < Date.now()) throw new RequestError(410, "预览已失效，请重新生成。");
          if (repository) {
            const result = await repository.approve(draft);
            drafts.delete(input.id);
            return { questionId: draft.questionId, ...result };
          }
          const raw = await fs.readFile(dataFile, "utf8");
          const records = JSON.parse(raw);
          const { question } = findQuestion(records, draft.interviewId, draft.questionId);
          if (digest(question) !== draft.revision) throw new RequestError(409, "这道题已被修改，未覆盖现有答案；请刷新后重新生成。");
          Object.assign(question, draft.output);
          const backupDir = path.join(localDir, "backups");
          await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
          await fs.writeFile(path.join(backupDir, `interviews-${Date.now()}-${randomUUID()}.json`), raw, { flag: "wx", mode: 0o600 });
          if (await fs.readFile(dataFile, "utf8") !== raw) throw new RequestError(409, "答案文件发生变化，未覆盖；请重试。");
          await atomicWrite(dataFile, JSON.stringify(records, null, 2) + "\n", 0o644);
          drafts.delete(input.id);
          return { questionId: question.id, ...pick(question) };
        });
        return send(200, result);
      }
      return send(404, { error: "接口不存在。" });
    } catch (error) { send(error.status || 500, { error: (error instanceof RequestError || error instanceof DatabaseError) ? error.message : "本地操作失败，请检查文件权限或重启开发服务。" }); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { server, token, origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
