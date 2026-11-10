import { alternateLinks, languages, type Lang, pages, pathFor, url } from "./site";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const dateTag = (date?: string) => date ? `<lastmod>${escape(date)}</lastmod>` : "";

export function languageSitemap(lang: Lang, knowledge?: { id: string }[]) {
  const currentPages = knowledge ? [...pages.filter(page => !page.path.startsWith("knowledge/")), ...knowledge.map(item => ({ path: `knowledge/${item.id}`, updated: undefined }))] : pages;
  const entries = currentPages.map(page => `<url><loc>${escape(url(pathFor(lang, page.path)))}</loc>${dateTag(page.updated)}${Object.entries(alternateLinks(page.path)).map(([language, href]) => `<xhtml:link rel="alternate" hreflang="${language}" href="${escape(href)}"/>`).join("")}</url>`);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + entries.join("") + "</urlset>";
}

export function sitemapIndex() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + languages.map(lang => `<sitemap><loc>${escape(url(`/sitemap-${lang}.xml`))}</loc></sitemap>`).join("") + "</sitemapindex>";
}

export const xmlResponse = (xml: string) => new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
