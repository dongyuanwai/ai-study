# oldCode AI 学习系统

代码直接导出自 `/Users/yuanwai/code/ai-tools-web/grokbotkit` 的 `template-starter` 分支，源提交为 `377d58305cce3b1884c7c36af7b2f871f89b477a`。来源记录在 `docs/template-origin.json`。

沿用模板的 Next.js 16、React 19、TypeScript、App Router、中英文路由、SEO 工具与图片生成脚本。开发和构建都显式使用 **Turbopack**，不再使用 Webpack。

## 本地运行

需要 Node.js 22 或以上版本：

```sh
npm ci
npm run dev
```

中文首页：`http://127.0.0.1:3035/zh/`。英文入口：`http://127.0.0.1:3035/en/`。题目和答案保留资料中的中文原文，界面提供中英文版本。

## 功能与目录

- 首页：白色界面、紧凑导航、学习专题、继续学习和测试入口。
- 知识库：按主题、难度和关键词筛选 378 条题目（370 条原始题目与 8 条补充研读）。
- 详情：核心回答、口述练习、易错点；支持标记掌握及进入单题练习。
- AI 时间线：2023 年起的滚动式时间线，含 15 个代表节点；中央时间轴贯穿页面，知识节点在左右两侧交错排列，滚动联动轴线点亮、内容入场和全屏粒子背景，按四类筛选、按年份跳转，弹窗查看详情、题目及来源；支持减少动态效果设置。
- 公司面试真题：按公司、岗位和关键词筛选，按题目分类浏览；当前收录字节跳动 Agent 开发（抖音开发）技术一面 47 道题（项目追问 35 题、后端服务化 10 题、手撕算法 2 题，均已补充参考答案、口述版和易错点，两道算法题使用 JavaScript），以及拼多多 AI Agent 后端工程师 5 轮面经 45 道题（25 道主问题与 20 条追问，参考答案待补充）。
- 测试：专题和难度随机组题，支持 5 / 10 / 20 题、独立作答、切题和参考答案复盘。
- 学习标记存入本机浏览器 localStorage；当前作答草稿存入当前标签页的 sessionStorage。
- 当前支持 Supabase 知识库与公司真题数据库，以及管理员增删改查接口；不包含账号、AI 自动评分或资讯模块。

```text
src/app/[lang]/                 双语首页和根布局
src/app/[lang]/knowledge/       知识库及动态知识详情
src/app/[lang]/practice/        测试与复盘
src/app/[lang]/timeline/        AI 发展历程与知识时间线
src/app/[lang]/interviews/      公司面试案例与题目答案
src/data/company-interviews.json 公司面试独立数据
src/data/ai-timeline.json       时间线节点、概念、题目匹配词与来源
src/components/study/           学习组件、Markdown 展示及进度状态
src/data/                      完整题库与轻量目录索引
src/config/site.json            本站名称与基础 SEO 配置
src/lib/                       站点、题库和 SEO 辅助函数
scripts/                       资料导入、构建资源与检查工具
tests/                         题库完整性检查
```

## 更新题库

读取上一级 `agent-docs` 内三份题目文档、三份对应答案和 `ai-concepts-supplement.json`，不读取其中旧应用的代码：

```sh
npm run data:import
npm test
```

保留简单 151、中等 164、困难 55 条原始记录；补充研读独立维护并使用稳定的 `concept-` ID，导入时一并生成目录和答案。学习方向根据原文主分类映射到 9 类，原分类保留在 `sourceTopic`。

## 验证

```sh
npm run typecheck
npm test
npm run build
npm run check:site
```

使用支持 Route Handlers 的 Next.js 服务端模式，构建结果位于 `.next/`，不再静态导出到 `out/`。默认 `ALLOW_INDEXING=false`，页面输出 noindex，robots 禁止抓取。默认不加载统计，不带托管绑定、域名或旧项目的环境配置。

后续在明确准备发布时，配置自己的 `SITE_URL`，再决定是否设置 `ALLOW_INDEXING=true`。不要复用其他站点的域名、GA ID 或验证信息。

## 持续知识更新

补充资料保存问题、三段式答案和一手来源；时间轴通过 `questionIds` 精确关联。日期区分论文发表、官方发布与官方解读，只精确到月份时不填写具体日。每次更新完成后记录 `docs/knowledge-updates.json`，并执行数据导入、测试、构建与 SEO 检查。应用定时任务「更新 AI 学习时间线与知识库」已按用户要求停用；当前仅按需检索并展示候选内容，确认后再更新资料。

## Vercel 部署

导入 GitHub 仓库 `dongyuanwai/ai-study`，使用 `master` 分支，并将 **Root Directory 设置为 `code`**，避免选到资料目录中的历史原型。

| 设置 | 值 |
| --- | --- |
| Framework Preset | Next.js |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | 自动识别，关闭 Override，不填写 `out` |
| SITE_URL | 最终站点根地址，例如 `https://你的项目.vercel.app` |
| ALLOW_INDEXING | `false` |

`vercel.json` 中的 `outputDirectory: null` 恢复框架自动识别。Vercel 读取 `.next/routes-manifest.json` 并部署页面与 API，不能把输出目录设为 `out`。

构建与根路径跳转已配置在 `vercel.json`；根路径永久跳转到 `/en/`，中文入口为 `/zh/`。`SITE_URL` 在构建时用于 canonical 与 sitemap，必须填写真实访问域名，变更后重新部署。只有决定开放搜索引擎收录时才将 `ALLOW_INDEXING` 设为 `true`。

启用数据库后需要在 Vercel 配置下文的服务端环境变量。未配置时，GET 接口与页面只读本地 JSON，CRUD 写入返回 503；无需在 Vercel 执行资料导入。部署后检查 `/zh/`、`/zh/knowledge/`、`/zh/timeline/`、`/zh/practice/` 与知识详情页的直接访问和刷新。

Vercel 官方参考：[构建设置](https://vercel.com/docs/builds/configure-a-build)、[vercel.json 配置](https://vercel.com/docs/project-configuration/vercel-json)。

## 公司面试真题

中文入口 `/zh/interviews/`，英文入口 `/en/interviews/`。数据独立维护在 `src/data/company-interviews.json`，类型定义在 `src/lib/company-interviews.ts`，不混入通用知识库。每条记录包含稳定 `id`、公司中英文名、岗位、轮次、时长、标签、摘要与题目列表。每题使用稳定 ID、连续编号、大类 `group`、专题 `topic`、题干以及可空的 `answer`、`oral`、`pitfalls`；答案支持 Markdown。

目前收录用户提供的字节 Agent 开发一面 47 题与拼多多 AI Agent 后端 5 轮面经 45 题，已移除全部模拟公司与模拟题目。按用户要求不保留作者、来源链接等来源信息。字节 47 题均已逐题补充参考答案、口述版与易错点，页面注明这些不是原面试者的回答；项目架构题使用可替换的答题框架，不虚构实际经历或业绩。两道算法使用 JavaScript 实现，测试直接执行题目答案中的代码，覆盖空输入、越界、重复值和原地合并。拼多多记录按轮次作为 `group`、按主题作为 `topic`，追问以题干前缀「追问：」单独成题；未提供答案的题目统一使用 `null`，页面显示「答案待补充」，仅有答案的题目显示展开入口。

## AI 回答与配置

AI 配置统一放在已忽略的 `.env.local`，与数据库配置并存：

```dotenv
AI_BASE_URL=https://你的模型接口/v1
AI_API_KEY=你的模型APIKey
AI_MODEL_ID=你的模型ID
AI_ACCESS_KEY=你发放的访问密钥
```

访问密钥和 `ADMIN_API_TOKEN` 用途不同，分别设置。线上默认模型的四项参数需要同步配置到 Vercel 环境变量后重新部署，不加 `NEXT_PUBLIC_`。默认 API Key 不回传给浏览器。

公司真题页面的「AI 设置」提供两种方式：用户填写自己的公网 HTTPS/OpenAI 兼容接口、API Key 和模型 ID；或填写站点发放的访问密钥使用默认模型。用户输入只在当前页面内存中保留，刷新或清除配置后失效，不写 localStorage、数据库或服务端配置。自带配置生成的结果仅供自己查看；通过访问密钥使用默认模型生成的回答，可点击「替换公共答案」确认保存。

`POST /api/ai/answer/` 只读取指定题目并生成答案；默认模式额外返回有效期 30 分钟的服务端签名预览。`POST /api/ai/approve/` 再次校验访问密钥和签名，仅把已预览的答案写回对应题目，并检查生成时的版本号。自带配置不会取得可写入的预览。默认模式校验 `AI_ACCESS_KEY` 后才使用服务端参数；自带配置缺失时不回退默认模型。自定义模型连接检查公网地址、实际 DNS 解析结果，并拒绝重定向。每个服务实例最多同时处理 3 个生成请求；不是跨实例的配额或计费系统。

本地维护使用 `npm run dev`（默认 3035）。「本地默认配置」读写 `.env.local` 中的 AI_BASE_URL/AI_API_KEY/AI_MODEL_ID，保留数据库等其他配置；已移除独立「维护参考答案」按钮，统一使用「AI 回答」和访问密钥模式下的「替换公共答案」，只更新 answer，保留 oral 和 pitfalls。公共答案替换必须配置 Supabase，在数据库事务中保存历史。未接数据库时仍可读取本地题目并生成，但替换返回未配置提示。默认配置编辑入口仅本地开发可见。

原 `.local-ai/settings.json` 的参数已迁移。开发启动器仅在 env 尚无 AI 参数时兼容迁移旧文件；正常读写只使用 `.env.local`。本地维护服务每次读取文件，所以修改后下一次调用生效；线上 API 读取进程环境，修改配置后需重启本地 Next.js 服务，Vercel 则重新部署。

提示词在 `scripts/local-ai/model.mjs`，角色是具有丰富面试和实战经验的 AI Agent 工程师，回答包含“详细解答”和“面试口述版”，使用中文 Markdown，算法使用 JavaScript。LangChain.js 1.6.3、@langchain/openai 1.8.2 和 @langchain/core 1.3.6 用于本地和线上模型调用。

## 加载与缓存

页面切换和公司真题首次请求显示骨架屏，并尊重减少动画偏好。公开题库列表采用浏览器内存及服务端实例内存的 30 秒缓存，合并同一查询的并发请求；失败不缓存。CRUD 写入成功清理当前实例缓存，本地确认答案清理当前页面数据缓存。跨实例写入或直接在 Supabase 修改时，其他实例最多可能保留 30 秒旧列表。单条数据库记录和写入前的版本校验不缓存，避免覆盖新数据。

缓存仅用于公开题库，不包含 AI 参数、访问密钥或模型生成结果；页面刷新后客户端缓存清空。模型结果仅保存在当前页面；只有访问密钥模式下明确确认替换才写入公共题库。

## Supabase 与数据接口

范围：知识库/通用面试题 378 题，公司面试记录 2 场及其 92 道题和答案。时间线仍使用 JSON，不在本次入库范围。页面和 API 共用服务端数据层，公司真题页面通过 `/api/data/interviews/` 加载。数据库变更刷新即可生效，无需重新部署。

1. 创建 Supabase 项目，在 SQL Editor 按文件名顺序执行 `supabase/migrations/` 下两份 SQL，各执行一次。
2. 填写已经创建的 `code/.env.local`（相对于仓库根目录）：

```dotenv
SUPABASE_URL=https://你的项目编号.supabase.co
SUPABASE_PUBLISHABLE_KEY=你的PublishableKey
SUPABASE_SECRET_KEY=你的SecretKey
ADMIN_API_TOKEN=至少32字符的随机管理令牌
```

四项均只在服务端读取，不加 `NEXT_PUBLIC_`。Publishable Key 支持旧版 anon Key；Secret Key 支持旧版 service_role Key。可运行 `openssl rand -hex 32` 生成管理员令牌，自行填入文件，不提交 Git。模型参数也统一保存在 `.env.local`。

3. 在 `code` 目录执行 `npm run db:seed` 导入现有真实数据，再运行 `npm run dev`。重复导入只补充缺失记录，不覆盖云端已有答案。项目尚未创建时，可先验证本地代码；不能声称已完成云端入库。
4. Vercel 保持 Next.js 预设、Root Directory 为 `code`、输出目录自动识别，并填写相同服务端环境变量后部署。仅需要公开查询时可不配置 Secret Key 和管理员令牌，写接口不可用。

题目修改和删除会在数据库事务中保存旧内容到历史表。修改/删除需携带版本号，冲突返回 409；公司记录仍包含题目时禁止直接删除，需要先处理题目。历史表及写操作不向匿名用户开放。数据库配置不完整或连接失败时，不会静默改写本地 JSON。

接口清单、请求示例、鉴权、分页和错误码见 [docs/data-api.md](docs/data-api.md)。表结构见 `supabase/migrations/`。`npm test` 验证 API 与本地 AI 流程；`npm run db:test` 使用隔离临时 PostgreSQL 容器验证真实 SQL、权限、历史及并发冲突，需要 Docker 和 `postgres:17-bookworm` 镜像。`npm run check:site` 会临时启动构建后的 Next.js 服务，验证所有 sitemap 页面的实际响应，结束后停止服务并清理临时文件。

官方参考：[REST Data API](https://supabase.com/docs/guides/api)、[API Keys](https://supabase.com/docs/guides/getting-started/api-keys)、[行级安全](https://supabase.com/docs/guides/database/postgres/row-level-security)。
