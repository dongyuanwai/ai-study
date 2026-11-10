import { allContent } from "@/lib/server/content.mjs";
import { languageSitemap, xmlResponse } from "@/lib/sitemaps";
export const dynamic = "force-dynamic";
export async function GET() { return xmlResponse(languageSitemap("zh", await allContent("knowledge"))); }
