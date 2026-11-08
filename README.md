# 知序 AI 学习系统

当前应用位于 `code/`，基于 Next.js 16、React 19 和 Turbopack，提供知识库、能力测试及 AI 发展时间线。

- `code/`：当前应用代码与 [运行、验证及部署说明](code/README.md)。
- `agent-docs/`：原始题目、答案、补充研读资料与历史原型。
- `面试题分类整理/`：按 10 个大类整理的 378 条 Markdown 题目与 [目录](面试题分类整理/README.md)。

## Vercel 部署

导入本仓库，Production Branch 选 `master`，**Root Directory 必须设为 `code`**。框架为 Next.js，安装命令 `npm ci`，构建命令 `npm run build`，Output Directory 保持自动识别（关闭 Override，不填写 `out`）；这些构建设置已写入 `code/vercel.json`。

在 Vercel 环境变量中设置 `SITE_URL` 为最终访问地址（包含 `https://`，不要带路径），保留 `ALLOW_INDEXING=false`。首次部署后如果域名变化，更新 `SITE_URL` 并重新部署。中文首页路径为 `/zh/`，根路径跳转到 `/en/`。

项目为静态站点，无需数据库或 API 密钥。详细设置见 [应用说明](code/README.md#vercel-部署)。
