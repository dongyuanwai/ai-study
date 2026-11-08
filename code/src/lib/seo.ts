import type { Metadata } from "next";
import { alternateLinks, type Lang, pathFor, site, siteUrl, url, allowIndexing } from "./site";

export function pageMetadata(lang: Lang, title: string, description: string, path = ""): Metadata {
  const canonical = url(pathFor(lang, path));
  const image = { url: url("/images/og-default.png"), width: 1200, height: 630, alt: site.name };
  return {
    metadataBase: new URL(siteUrl), title: `${title} | ${site.name}`, description,
    alternates: { canonical, languages: alternateLinks(path) },
    robots: { index: allowIndexing, follow: allowIndexing },
    openGraph: {
      title, description, url: canonical, siteName: site.name,
      locale: lang === "zh" ? "zh_CN" : "en_US", type: "website", images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    icons: { icon: [{ url: "/favicon.png", type: "image/png", sizes: "96x96" }], apple: "/apple-touch-icon.png" },
  };
}

export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
