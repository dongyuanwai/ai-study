# 知序 AI 学习系统

代码直接导出自 `/Users/yuanwai/code/ai-tools-web/grokbotkit` 的 `template-starter` 分支，源提交为 `377d58305cce3b1884c7c36af7b2f871f89b477a`。来源记录在 `docs/template-origin.json`。

沿用模板的 Next.js 16、React 19、TypeScript、App Router、中英文路由、静态导出、SEO 工具与图片生成脚本。开发和构建都显式使用 **Turbopack**，不再使用 Webpack。

## 本地运行

需要 Node.js 20.9 或以上版本：

```sh
npm ci
npm run dev
```

中文首页：`http://127.0.0.1:3000/zh/`。英文入口：`http://127.0.0.1:3000/en/`。题目和答案保留资料中的中文原文，界面提供中英文版本。

## 功能与目录

- 首页：白色界面、紧凑导航、学习专题、继续学习和测试入口。
- 知识库：按主题、难度和关键词筛选 378 条题目（370 条原始题目与 8 条补充研读）。
- 详情：核心回答、口述练习、易错点；支持标记掌握及进入单题练习。
- AI 时间线：2023 年起的滚动式时间线，含 15 个代表节点；中央时间轴贯穿页面，知识节点在左右两侧交错排列，滚动联动轴线点亮、内容入场和全屏粒子背景，按四类筛选、按年份跳转，弹窗查看详情、题目及来源；支持减少动态效果设置。
- 测试：专题和难度随机组题，支持 5 / 10 / 20 题、独立作答、切题和参考答案复盘。
- 学习标记存入本机浏览器 localStorage；当前作答草稿存入当前标签页的 sessionStorage。
- 当前不包含账号、后端数据库或 AI 自动评分，也不包含资讯模块。

```text
src/app/[lang]/                 双语首页和根布局
src/app/[lang]/knowledge/       知识库及静态知识详情
src/app/[lang]/practice/        测试与复盘
src/app/[lang]/timeline/        AI 发展历程与知识时间线
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
npm run check:seo
npm run check:analytics
```

构建结果位于 `out/`。默认 `ALLOW_INDEXING=false`，页面输出 noindex，robots 禁止抓取。默认不加载统计，不带托管绑定、域名或旧项目的环境配置。

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
| Output Directory | `out` |
| SITE_URL | 最终站点根地址，例如 `https://你的项目.vercel.app` |
| ALLOW_INDEXING | `false` |

构建与根路径跳转已配置在 `vercel.json`；根路径永久跳转到 `/en/`，中文入口为 `/zh/`。`SITE_URL` 在构建时用于 canonical 与 sitemap，必须填写真实访问域名，变更后重新部署。只有决定开放搜索引擎收录时才将 `ALLOW_INDEXING` 设为 `true`。

部署使用已提交的题库 JSON，不需要在 Vercel 执行 `data:import`，也不需要数据库或 API 密钥。部署后检查 `/zh/`、`/zh/knowledge/`、`/zh/timeline/`、`/zh/practice/` 与知识详情页的直接访问和刷新。

Vercel 官方参考：[构建设置](https://vercel.com/docs/builds/configure-a-build)、[vercel.json 配置](https://vercel.com/docs/project-configuration/vercel-json)。
