import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const output = path.resolve("out");
const allowIndexing = process.env.ALLOW_INDEXING === "true";
const read = name => fs.readFileSync(path.join(output, name), "utf8");
const attribute = (tag, name) => new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i").exec(tag)?.[1];
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(match => match[0]);
const locs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
const fileFor = pathname => {
  const local = path.join(output, decodeURIComponent(pathname).replace(/^\//, ""));
  return fs.existsSync(local) && fs.statSync(local).isFile() ? local : path.join(local, "index.html");
};

assert.ok(fs.existsSync(path.join(output, "sitemap.xml")), "请先运行 npm run build");
const index = read("sitemap.xml");
assert.ok(index.includes("<sitemapindex"), "缺少 sitemap 索引");
const children = locs(index);
assert.ok(children.length, "sitemap 索引为空");
assert.equal(new Set(children.map(url => url.href)).size, children.length, "重复子 sitemap");
const origin = new URL(process.env.CHECK_SITE_URL || children[0].origin).origin;
const urls = [];
const blocks = new Map();
for (const child of children) {
  assert.equal(child.origin, origin, "子 sitemap 域名不一致");
  const lang = child.pathname.match(/^\/sitemap-(en|zh)\.xml$/)?.[1];
  assert.ok(lang, "未识别的语言 sitemap");
  const xml = fs.readFileSync(fileFor(child.pathname), "utf8");
  assert.ok(xml.includes("<urlset"), "子 sitemap 格式不正确");
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const locations = locs(match[1]);
    assert.equal(locations.length, 1, "每条 sitemap 记录应只有一个 loc");
    const location = locations[0];
    assert.equal(location.origin, origin, "页面域名不一致");
    assert.ok(location.pathname.startsWith(`/${lang}/`), "页面位于错误的语言 sitemap");
    assert.ok(location.pathname.endsWith("/"), "规范页面应以 / 结尾");
    assert.ok(!blocks.has(location.href), "重复 sitemap 页面");
    blocks.set(location.href, match[1]);
    urls.push(location);
    const modified = /<lastmod>(.*?)<\/lastmod>/.exec(match[1])?.[1];
    if (modified) assert.ok(Number.isFinite(Date.parse(modified)) && Date.parse(modified) <= Date.now(), "无效更新时间");
  }
}
assert.ok(urls.length, "sitemap 没有页面");
const titles = new Set();
const descriptions = new Set();
for (const page of urls) {
  assert.ok(fs.existsSync(fileFor(page.pathname)), `页面未导出：${page.pathname}`);
  const html = fs.readFileSync(fileFor(page.pathname), "utf8");
  const title = /<title>(.*?)<\/title>/s.exec(html)?.[1];
  assert.ok(title && !titles.has(title), `缺少或重复标题：${page.pathname}`);
  titles.add(title);
  const metadata = tags(html, "meta");
  const description = attribute(metadata.find(tag => attribute(tag, "name") === "description") || "", "content");
  assert.ok(description?.trim() && !descriptions.has(description), `缺少或重复描述：${page.pathname}`);
  descriptions.add(description);
  const policy = attribute(metadata.find(tag => attribute(tag, "name") === "robots") || "", "content") || "";
  assert.match(policy, allowIndexing ? /(?:^|,\s*)index(?:,|$)/ : /(?:^|,\s*)noindex(?:,|$)/);
  assert.match(policy, allowIndexing ? /(?:^|,\s*)follow(?:,|$)/ : /(?:^|,\s*)nofollow(?:,|$)/);
  const lang = page.pathname.split("/")[1];
  assert.equal(attribute(tags(html, "html")[0], "lang"), lang === "zh" ? "zh-Hans" : "en");
  assert.equal(tags(html, "h1").length, 1, "每页应有一个主标题");
  const links = tags(html, "link");
  assert.equal(attribute(links.find(tag => attribute(tag, "rel") === "canonical") || "", "href"), page.href);
  const alternates = links.filter(tag => attribute(tag, "rel") === "alternate" && attribute(tag, "hreflang"));
  const suffix = page.pathname.replace(/^\/(en|zh)\//, "");
  for (const [language, targetLang] of [["en", "en"], ["zh-Hans", "zh"], ["x-default", "en"]]) {
    const expected = `${origin}/${targetLang}/${suffix}`;
    const alternate = alternates.find(tag => attribute(tag, "hreflang") === language);
    assert.equal(attribute(alternate || "", "href"), expected, "语言链接目标不正确");
    assert.ok(blocks.has(expected), "语言版本未登记到 sitemap");
    const target = fs.readFileSync(fileFor(new URL(expected).pathname), "utf8");
    assert.ok(tags(target, "link").some(tag => attribute(tag, "rel") === "alternate" && attribute(tag, "href") === page.href), "语言链接未双向对应");
    const xmlLink = [...blocks.get(page.href).matchAll(/<xhtml:link\b[^>]*>/g)].map(match => match[0]).find(tag => attribute(tag, "hreflang") === language);
    assert.equal(attribute(xmlLink || "", "href"), expected, "HTML 与 sitemap 语言链接不一致");
  }
  for (const anchor of tags(html, "a")) {
    const href = attribute(anchor, "href");
    if (!href || href.startsWith("//")) continue;
    const target = new URL(href, page);
    if (target.origin !== origin) continue;
    assert.ok(fs.existsSync(fileFor(target.pathname)), `失效内链：${href}`);
    if (target.hash) assert.ok(fs.readFileSync(fileFor(target.pathname), "utf8").includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `失效锚点：${href}`);
  }
  for (const image of tags(html, "img")) {
    const src = attribute(image, "src");
    assert.ok(attribute(image, "alt") !== undefined, "图片缺少 alt 属性");
    if (src?.startsWith("/")) assert.ok(fs.existsSync(fileFor(new URL(src, page).pathname)), `图片不存在：${src}`);
  }
  for (const link of links.filter(tag => /^(icon|apple-touch-icon)$/.test(attribute(tag, "rel") || ""))) {
    assert.ok(fs.existsSync(fileFor(new URL(attribute(link, "href"), page).pathname)), "网站图标不存在");
  }
  const ogImage = metadata.find(tag => attribute(tag, "property") === "og:image");
  const shareImage = new URL(attribute(ogImage || "", "content"));
  assert.equal(shareImage.origin, origin, "分享图片域名不一致");
  assert.ok(fs.existsSync(fileFor(shareImage.pathname)), "分享图片不存在");
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert.ok(schemas.some(item => item["@type"] === "WebSite" && new URL(item.url).origin === origin), "缺少网站结构化数据");
}
const sitemapPaths = new Set(urls.map(page => page.pathname));
for (const filename of fs.readdirSync(output, { recursive: true })) {
  if (!/^(en|zh)\//.test(filename) || !filename.endsWith("/index.html")) continue;
  assert.ok(sitemapPaths.has(`/${filename.slice(0, -"index.html".length)}`), `导出页面未纳入 sitemap：${filename}`);
}
assert.ok(!fs.existsSync(path.join(output, "index.html")), "根路径不应重复导出首页");
const routes = JSON.parse(fs.readFileSync(".next/routes-manifest.json", "utf8"));
assert.equal(routes.redirects.find(item => item.source === "/" && item.destination === "/en/")?.statusCode, 308);
const robots = read("robots.txt");
assert.match(robots, allowIndexing ? /^Allow: \/$/m : /^Disallow: \/$/m);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(tags(read("404.html"), "meta").some(tag => attribute(tag, "name") === "robots" && attribute(tag, "content")?.includes("noindex")), "404 页面应禁止索引");
console.log(`SEO 检查通过：${urls.length} 个规范页面，标题、描述、语言、canonical、hreflang、sitemap、图片、内链、结构化数据和 404 配置有效。`);
