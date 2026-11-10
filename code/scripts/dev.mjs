import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { migrateAiSettings } from "./local-ai/settings.mjs";
import { loadLocalEnv, databaseConfig } from "./database/config.mjs";
import { createInterviewRepository } from "./database/repository.mjs";

process.env.NODE_ENV = "development";
process.env.LANGSMITH_TRACING = "false";
process.env.LANGCHAIN_TRACING_V2 = "false";
const root = fileURLToPath(new URL("../", import.meta.url));
await migrateAiSettings(root);
loadLocalEnv(root);
const database = databaseConfig();
const repository = database ? createInterviewRepository(database) : null;
const args = process.argv.slice(2);
let port = 3035;
if (args.length) {
  if (args.length !== 2 || !["--port", "-p"].includes(args[0]) || !/^\d+$/.test(args[1])) throw new Error("用法：npm run dev -- --port 3035");
  port = Number(args[1]);
}
if (port < 1024 || port > 65535) throw new Error("端口需在 1024–65535 之间。");
// 端口占用时明确退出，避免 Next 自动换端口后本地 API 的允许来源失配。
await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once("error", () => reject(new Error(`端口 ${port} 已被占用，请使用 --port 指定其他端口。`)));
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});
const { createLocalAiService } = await import("./local-ai/service.mjs");
const local = await createLocalAiService({ root, webPort: port, repository });
const child = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "dev", "--hostname", "127.0.0.1", "--turbopack", "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_LOCAL_AI_ORIGIN: local.origin, NEXT_PUBLIC_LOCAL_AI_TOKEN: local.token },
});
console.log(`本地预览：http://127.0.0.1:${port}/zh/interviews/`);
let stopping = false;
const stop = async () => { if (stopping) return; stopping = true; child.kill("SIGTERM"); await local.close(); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
child.once("error", async () => { await stop(); process.exitCode = 1; });
child.once("exit", async code => { await stop(); process.exitCode = code ?? 0; });
