# AI 学习系统

基于 Next.js 的本地单人学习工具。它直接读取上级文件夹中的 370 道 AI 题及答案 Markdown，并加载 40 道人工整理的 JS/TS、Solidity 与 Web3 面试题，共 410 道基础题；按十个知识模块练习，提交后展示讲解，并根据 0–5 分自评安排复习。另有少量人工维护、带官方来源与核对日期的「最新知识」示例。

## 运行

需要 Node.js 20.9 或更新版本。进入本目录后运行：

```bash
npm install
npm run dev
```

在浏览器打开 <http://localhost:3000>。如果 3000 端口被占用，以终端显示的实际地址为准。

默认无需模型密钥：回答后显示参考要点，由你自行评分。需要 AI 针对性评价时，复制 `.env.example` 为 `.env.local`，填写 `OPENAI_API_KEY`，并按可用模型设置 `OPENAI_MODEL`。密钥只在服务端使用，不会发往浏览器。

## 数据与题库

- 题库默认从本目录的上一级读取 `AI大模型面试题库-简单题.md` 等六个原文件。本地开发和 Vercel 都是这个布局：工作目录是 `agent-docs/AI学习系统`，题库在它的父目录。请不要设置 `AI_BANK_DIR`。相对路径（例如 `agent-docs`）会从工作目录再往下解析，找不到这些文件。只有题库不在上一级时才设置它，并且必须是绝对路径；在 Vercel 函数里该目录是 `/var/task/agent-docs`。
- 部署时这些 Markdown 不在 Next 应用目录内，`next.config.ts` 用 `outputFileTracingIncludes` 把它们打进 Serverless Function，否则运行时会因找不到文件而报 ENOENT。
- JS/TS、Solidity 与 Web3 面试题维护在 `lib/web3-questions.ts`，每题包含难度、标签、核心回答、口述版、易错点和官方资料链接。
- 作答、会话与复习计划保存在 SQLite，不提交版本控制。本地开发写入 `data/learning.sqlite`。Vercel 上函数目录只读，且追踪后的函数包里没有 `data/`，继续在那里 `mkdir` 会让首页报 `ENOENT`，所以默认改写到临时目录下的 `ai-learning/learning.sqlite`（一般是 `/tmp`，实例回收后清空）。需要别的可写文件时再设置 `AI_DB_PATH`。备份时复制该数据库文件及可能存在的 `-wal`、`-shm` 文件，最好先停服务。
- 复习时间按自评分数安排。当前是简化的间隔复习策略，不是经过学习科学验证的个性化算法。
- 「最新知识」目前手工维护，不会自动抓取。时效性信息请以卡片链接的官方来源为准。
- 这是本地单用户 MVP，没有账号、跨设备同步或权限隔离；不要直接暴露到公网。

## 验证

```bash
npm run typecheck
npm run build
```
