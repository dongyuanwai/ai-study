import type { MetadataRoute } from "next";
import { allowIndexing, url } from "@/lib/site";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return { rules: allowIndexing ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" }, sitemap: url("/sitemap.xml") };
}
