import fs from "node:fs";
import assert from "node:assert/strict";

const { googleAnalyticsId } = JSON.parse(fs.readFileSync("src/config/site.json", "utf8"));
const id = googleAnalyticsId.trim();
if (id) assert.match(id, /^G-[A-Z0-9]+$/);
const output = process.env.CHECK_OUTPUT_DIR || "out";
const pages = fs.readdirSync(output, { recursive: true }).filter(file => /^(en|zh)\//.test(file) && file.endsWith("/index.html"));
assert.ok(pages.length, "请先构建网站");
for (const page of pages) {
  const html = fs.readFileSync(`${output}/${page}`, "utf8");
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] || "";
  const count = (head.match(/id="google-analytics"/g) || []).length;
  assert.equal(count, id ? 1 : 0, `${page}：统计初始化数量不正确`);
  if (id) {
    assert.ok(head.includes(`https://www.googletagmanager.com/gtag/js?id=${id}`));
    assert.ok(head.includes(`gtag('config','${id}')`));
  } else assert.ok(!head.includes("googletagmanager.com"), `${page}：空配置时不应加载统计`);
}
console.log(`GA4 检查通过：${pages.length} 个页面，${id ? "使用本站配置的衡量 ID" : "未配置统计，不加载第三方标签"}。`);
