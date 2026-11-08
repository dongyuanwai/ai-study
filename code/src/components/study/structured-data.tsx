import { jsonLd } from "@/lib/seo";
import { languages, localeFor, site, siteUrl } from "@/lib/site";

export function StructuredData() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: siteUrl, inLanguage: languages.map(localeFor) }) }}/>;
}
