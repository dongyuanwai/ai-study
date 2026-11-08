import questionIndex from "@/data/question-index.json";
import config from "@/config/site.json";

export type Lang = "en" | "zh";
export const languages: Lang[] = ["en", "zh"];
export const defaultLanguage: Lang = "en";
export const site = config;
export const allowIndexing = process.env.ALLOW_INDEXING === "true";
const configuredUrl = new URL(process.env.SITE_URL || "http://127.0.0.1:3000");
if (!["http:", "https:"].includes(configuredUrl.protocol) || configuredUrl.pathname !== "/" || configuredUrl.search || configuredUrl.hash || configuredUrl.username || configuredUrl.password) {
  throw new Error("SITE_URL 必须是完整的 HTTP(S) 站点根地址，不含路径、查询、片段或凭据。");
}
export const siteUrl = configuredUrl.origin;
export const isLang = (value: string): value is Lang => languages.includes(value as Lang);
export const localeFor = (lang: Lang) => lang === "zh" ? "zh-Hans" : "en";
export function pathFor(lang: Lang, path = "") {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `/${lang}/${clean}${clean ? "/" : ""}`;
}
export const url = (path = "/") => new URL(path, `${siteUrl}/`).href;
export const alternateLinks = (path = "") => ({
  en: url(pathFor("en", path)),
  "zh-Hans": url(pathFor("zh", path)),
  "x-default": url(pathFor(defaultLanguage, path)),
});

// 新增页面时登记不含语言前缀的路径；没有可靠日期就省略 updated。
export const pages: { path: string; updated?: string }[] = [{ path: "" }, { path: "knowledge" }, { path: "practice" }, { path: "timeline" }, ...questionIndex.map(question => ({ path: `knowledge/${question.id}` }))];
