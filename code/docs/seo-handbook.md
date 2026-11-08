# SEO 基础检查

本模板保留技术 SEO 基础设施，默认只有两个空白语言首页。检查通过代表配置满足所覆盖的规则，不代表搜索引擎已收录或页面有排名。

## 本地检查

```sh
npm run build
npm run typecheck
CHECK_SITE_URL=http://127.0.0.1:3000 npm run check:seo
npm run check:analytics
```

`check:seo` 检查实际导出页面、唯一标题与描述、HTML 语言、主标题、自指 canonical、双向 hreflang、HTML/XML 一致性、内链、图标、分享图片、网站结构化数据、robots、404 及根路径重定向声明。页面数量根据 sitemap 与导出文件核对，不需要为了新增页面手工改数量。

这是技术检查；标题和描述要与真实内容一致，图片 alt 要符合用途，结构化数据应描述页面事实。空白页面不应作为正式内容发布。

## 发布后检查

- 使用正式域名重新构建，确认 HTML 与 XML 没有本地地址。
- 通过 HTTP 验证 sitemap、代表性页面、根路径跳转和真实 404。
- 在 Google Search Console 与 Bing Webmaster Tools 验证新站并提交 `/sitemap.xml`。
- 需要 IndexNow 时生成新站自己的 key，在文件部署并验证成功后通知发生变化的页面。
- 分别观察页面抓取、收录、Google/Bing 查询与点击、AI 引荐，以及真实业务行为。

记录问题时保留检查日期、页面、证据、影响范围、修复和复验结果。平台上次抓取结果与实时响应可能不同，应分别核对。

## 官方参考

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google 多语言网页说明](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google sitemap 指南](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [IndexNow 接入文档](https://www.indexnow.org/documentation.html)
