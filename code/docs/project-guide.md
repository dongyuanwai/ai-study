# 空白网站模板维护说明

更新日期：2026-11-06。

## 结构

| 职责 | 位置 |
| --- | --- |
| 网站名称、GA4 ID、双语首页标题和描述 | `src/config/site.json` |
| 语言、站点 URL、规范路径、页面登记 | `src/lib/site.ts` |
| 空白首页 | `src/app/[lang]/page.tsx` |
| 双语根布局、页头、语言切换 | `src/app/[lang]/layout.tsx`、`src/components/` |
| 通用样式 | `src/app/globals.css` |
| metadata、分享卡片、JSON-LD 序列化 | `src/lib/seo.ts` |
| sitemap 索引和语言子文件 | `src/lib/sitemaps.ts`、`src/app/sitemap*/` |
| robots 与全局 404 | `src/app/robots.ts`、`src/app/global-not-found.tsx` |
| 唯一 Logo 源文件 | `public/brand-mark.svg` |
| 图片生成 | `scripts/generate-assets.mjs` |
| SEO、统计及线上 HTTP 检查 | `scripts/check-*.mjs` |

模板不依赖数据库、后端或内容接口。`output: "export"` 与 `trailingSlash: true` 保留，页面在构建时输出为静态 HTML。

## 页面与 SEO

初始只有 `/en/` 和 `/zh/` 两个规范页面。新增成对页面时，在对应路由调用 `pageMetadata(lang, title, description, path)`，并在 `src/lib/site.ts` 的 `pages` 中登记不含语言前缀的路径。每个新增页面保留适合内容的结构化数据；当前检查要求页面有 WebSite 描述。

例如新增 `contact` 路由时，登记 `{ path: "contact" }`，metadata 的最后一个参数也传 `"contact"`。语言切换沿用当前路径，因此两个语言版本都需要实现。

`updated` 可选，填写真实重要修改时间；不知道时间时省略，不把构建时间写成内容更新时间。静态导出的每个规范页面必须纳入 sitemap，检查命令会发现遗漏。

空白首页仅为开发起点。正式发布前补充真实内容及准确描述。不要把短占位描述当成内容质量已通过的证明。

## 域名与统计

`SITE_URL` 默认 `http://127.0.0.1:3000`，必须是 HTTP(S) 根地址，不含语言路径、查询参数或凭据。生产环境需在构建时设置正式地址，配置变化后重新构建。

GA4 ID 在 `src/config/site.json` 的 `googleAnalyticsId` 中配置；空字符串不加载统计。填写后重新构建，并用 `npm run check:analytics` 核对导出 HTML，使用 GA4 Realtime/DebugView 复核真实收数。不要重复发送已有自动采集的 page_view。

模板没有托管项目绑定、站长平台验证文件或 IndexNow key。新站独立设置；不得复用其他站点身份。

## 图标与分享图片

替换 `public/brand-mark.svg` 后运行 `npm run build`：自动生成 96×96 的 `favicon.png`、180×180 的 `apple-touch-icon.png`，并根据网站名称生成 1200×630 的默认分享图片。新站可在生成脚本中替换分享图片设计。

## 本地与发布

本地开发绑定 loopback。运行构建后，如已有开发服务发生缓存错误，仅重启本项目服务。

模板不带线上部署设置。正式托管需要目录索引、根路径到 `/en/` 的 308 跳转、未知路径真实 404，以及正确的 HTTPS 与规范主机跳转。发布后用显式 `CHECK_SITE_URL` 执行线上检查；文件存在不等于 HTTP 正常。

## AI 学习系统改造

当前代码由 template-starter 的 377d583 导出，来源见 template-origin.json。首页、知识库、知识详情和测试位于 src/app/[lang] 下；共享学习组件位于 src/components/study。题库导入脚本只读取 ../agent-docs 中的 Markdown，不读取旧应用代码。开发与构建显式使用 --turbopack。默认不启用索引、不加载统计、不部署或推送。
