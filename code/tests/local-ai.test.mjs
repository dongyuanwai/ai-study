import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createLocalAiService, normalizeSettings } from "../scripts/local-ai/service.mjs";
import { generateAnswer, validateAnswer } from "../scripts/local-ai/model.mjs";

const answer = { answer: "## 参考答案\n\n新的参考答案" };
const record = [{ id: "interview", company: "测试公司", role: "测试岗位", questions: [1, 2].map(i => ({ id: `q${i}`, number: i, group: "项目追问", topic: "测试", title: `测试题 ${i}`, answer: "旧答案", oral: "旧口述", pitfalls: "旧注意事项" })) }];
async function fixture(t, generate = async () => answer) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "local-ai-test-"));
  const file = path.join(root, "src/data/company-interviews.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(record));
  const local = await createLocalAiService({ root, webPort: 3035, generate });
  t.after(async () => { await local.close(); await fs.rm(root, { recursive: true, force: true }); });
  const call = async (route, method = "GET", body, headers = {}) => {
    const response = await fetch(local.origin + route, { method, headers: { Origin: "http://127.0.0.1:3035", Authorization: `Bearer ${local.token}`, "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
  const configure = () => call("/settings", "POST", { baseURL: "https://example.com/v1", modelId: "test-model", apiKey: "test-key-never-log" });
  const read = async () => JSON.parse(await fs.readFile(file, "utf8"));
  return { root, file, local, call, configure, read };
}

test("本地配置支持完整兼容 URL，禁止远程明文及带凭据 URL，更换 URL 不沿用密钥", () => {
  const initial = normalizeSettings({ baseURL: "https://example.com/v1/chat/completions", modelId: "model-1", apiKey: "test-key" });
  assert.equal(initial.baseURL, "https://example.com/v1");
  assert.equal(normalizeSettings({ ...initial, apiKey: "" }, initial).apiKey, "test-key");
  assert.throws(() => normalizeSettings({ ...initial, baseURL: "https://other.example/v1", apiKey: "" }, initial));
  for (const baseURL of ["http://example.com/v1", "file:///etc/passwd", "https://user:pass@example.com/v1", "https://example.com/v1?key=secret"]) assert.throws(() => normalizeSettings({ ...initial, baseURL }));
  assert.equal(normalizeSettings({ baseURL: "http://127.0.0.1:11434/v1", modelId: "local", apiKey: "" }).apiKey, "");
});

test("生成不写盘；明确批准后只替换目标题，密钥不回传，旧文件有备份", async t => {
  const f = await fixture(t);
  const before = await fs.readFile(f.file, "utf8");
  const settings = await f.configure(); assert.equal(settings.status, 200); assert.equal(settings.data.hasApiKey, true); assert.ok(!JSON.stringify(settings.data).includes("test-key"));
  assert.ok(!("apiKey" in (await f.call("/settings")).data));
  assert.equal((await fs.stat(path.join(f.root, ".env.local"))).mode & 0o777, 0o600);
  const draft = await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" }); assert.equal(draft.status, 200);
  assert.equal(await fs.readFile(f.file, "utf8"), before);
  assert.equal((await f.call("/approve", "POST", { id: draft.data.id })).status, 400);
  const result = await f.call("/approve", "POST", { id: draft.data.id, confirm: true, answer: "未经审核的注入内容" }); assert.equal(result.status, 200);
  const saved = await f.read(); assert.deepEqual(saved[0].questions[0], { ...record[0].questions[0], ...answer }); assert.deepEqual(saved[0].questions[1], record[0].questions[1]);
  const backups = await fs.readdir(path.join(f.root, ".local-ai/backups")); assert.equal(backups.length, 1); assert.equal(await fs.readFile(path.join(f.root, ".local-ai/backups", backups[0]), "utf8"), before);
  assert.equal((await f.call("/approve", "POST", { id: draft.data.id, confirm: true })).status, 410);
});

test("拒绝跨来源、错误会话、Host 伪造和未配置生成", async t => {
  const f = await fixture(t);
  for (const headers of [{ Origin: "https://evil.example" }, { Origin: "" }, { Authorization: "Bearer wrong" }]) assert.equal((await f.call("/settings", "GET", undefined, headers)).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    const req = http.get(f.local.origin + "/settings", { headers: { Host: "evil.example", Origin: "http://127.0.0.1:3035", Authorization: `Bearer ${f.local.token}` } }, res => { res.resume(); resolve(res.statusCode); });
    req.on("error", reject);
  });
  assert.equal(hostStatus, 403);
  assert.equal((await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" })).status, 400);
  await f.configure(); assert.equal((await f.call("/generate", "POST", { interviewId: "interview", questionId: "../../invalid" })).status, 404);
});

test("放弃、格式无效和版本冲突均不能覆盖答案", async t => {
  const f = await fixture(t); await f.configure();
  const first = (await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" })).data;
  await f.call("/draft", "DELETE", { id: first.id });
  assert.equal((await f.call("/approve", "POST", { id: first.id, confirm: true })).status, 410);
  const second = (await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" })).data;
  const changed = await f.read(); changed[0].questions[0].answer = "用户刚刚修改的答案"; await fs.writeFile(f.file, JSON.stringify(changed));
  assert.equal((await f.call("/approve", "POST", { id: second.id, confirm: true })).status, 409); assert.deepEqual(await f.read(), changed);
  const bad = await fixture(t, async () => ({ answer: "  " })); await bad.configure();
  assert.equal((await bad.call("/generate", "POST", { interviewId: "interview", questionId: "q1" })).status, 502); assert.deepEqual(await bad.read(), record);
});

test("两道题并发批准保留彼此修改", async t => {
  const f = await fixture(t); await f.configure();
  const drafts = [];
  for (const questionId of ["q1", "q2"]) drafts.push((await f.call("/generate", "POST", { interviewId: "interview", questionId })).data);
  const results = await Promise.all(drafts.map(draft => f.call("/approve", "POST", { id: draft.id, confirm: true })));
  assert.ok(results.every(result => result.status === 200)); assert.ok((await f.read())[0].questions.every(question => question.answer === answer.answer));
});

test("LangChain 实际调用使用可配置 URL、Key 和模型，直接返回 Markdown；仅访问本机模拟模型", async t => {
  process.env.LANGSMITH_TRACING = "false"; process.env.LANGCHAIN_TRACING_V2 = "false";
  let captured;
  const upstream = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    captured = { url: req.url, authorization: req.headers.authorization, body: JSON.parse(body) };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "mock", object: "chat.completion", created: 1, model: "custom-model", choices: [{ index: 0, message: { role: "assistant", content: answer.answer }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
  });
  await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve)); t.after(() => { upstream.close(); upstream.closeAllConnections(); });
  const result = await generateAnswer({ baseURL: `http://127.0.0.1:${upstream.address().port}/v1`, apiKey: "local-test-key", modelId: "custom-model" }, record[0], record[0].questions[0], AbortSignal.timeout(5000));
  assert.deepEqual(result, answer); assert.equal(captured.url, "/v1/chat/completions"); assert.equal(captured.body.model, "custom-model"); assert.equal(captured.authorization, "Bearer local-test-key");
  assert.ok(captured.body.messages[0].content.includes("JavaScript"));
});

test("生产环境禁止启动本地写入服务", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try { await assert.rejects(createLocalAiService({ root: os.tmpdir(), webPort: 3035 }), /生产环境/); }
  finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});

test("生成取消会停止上游调用，不产生答案写入", async t => {
  let started;
  const start = new Promise(resolve => { started = resolve; });
  let cancelled;
  const cancel = new Promise(resolve => { cancelled = resolve; });
  const f = await fixture(t, async (_settings, _interview, _question, signal) => {
    started();
    await new Promise((resolve, reject) => signal.addEventListener("abort", () => { cancelled(); reject(new Error("cancelled")); }, { once: true }));
    return answer;
  });
  await f.configure();
  const controller = new AbortController();
  const call = fetch(f.local.origin + "/generate", { method: "POST", headers: { Origin: "http://127.0.0.1:3035", Authorization: `Bearer ${f.local.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ interviewId: "interview", questionId: "q1" }), signal: controller.signal }).catch(() => null);
  await start; controller.abort();
  await Promise.race([cancel, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("取消未传递到上游")), 2000); timer.unref(); })]);
  await call; assert.deepEqual(await f.read(), record);
});


test("套餐订阅无效时返回明确提示，不泄露供应商错误正文，也不改动答案", async t => {
  const privateMessage = "account-private-id secret-key-private";
  let code = "InvalidSubscription";
  const upstream = http.createServer((req, res) => {
    req.resume();
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { code, message: privateMessage, type: "Bad Request" } }));
  });
  await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => { upstream.close(); upstream.closeAllConnections(); });
  const f = await fixture(t, generateAnswer);
  await f.call("/settings", "POST", { baseURL: `http://127.0.0.1:${upstream.address().port}/v1`, modelId: "test-model", apiKey: "test-key" });
  const result = await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" });
  assert.equal(result.status, 502);
  assert.match(result.data.error, /Agent Plan.*订阅/);
  assert.match(result.data.error, /InvalidSubscription/);
  assert.ok(!JSON.stringify(result.data).includes(privateMessage));
  assert.deepEqual(await f.read(), record);
  code = "UnknownProviderError";
  const unknown = await f.call("/generate", "POST", { interviewId: "interview", questionId: "q1" });
  assert.match(unknown.data.error, /HTTP 400/);
  assert.ok(!JSON.stringify(unknown.data).includes(privateMessage));
});


test("只接收答案字段，忽略额外字段；算法答案仍要求 JavaScript", () => {
  assert.deepEqual(validateAnswer({ ...answer, oral: "不写入", pitfalls: "不写入" }, record[0].questions[0]), answer);
  const algorithm = { group: "手撕算法" };
  assert.throws(() => validateAnswer({ answer: "只有描述" }, algorithm));
  const code = { answer: "```javascript\nconst result = 1;\n```" };
  assert.deepEqual(validateAnswer(code, algorithm), code);
});
