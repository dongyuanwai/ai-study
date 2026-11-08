import { site } from "@/lib/site";

export function GoogleAnalytics() {
  const id = site.googleAnalyticsId.trim();
  if (!id) return null;
  if (!/^G-[A-Z0-9]+$/.test(id)) throw new Error("googleAnalyticsId 格式应为 G- 开头的 GA4 衡量 ID。");
  return <>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`}/>
    <script id="google-analytics" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');` }}/>
  </>;
}
