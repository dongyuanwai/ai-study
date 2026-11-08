import "./globals.css";
import { site } from "@/lib/site";

export default function NotFound() {
  return <html lang="en"><head><title>{`Page not found | ${site.name}`}</title><meta name="robots" content="noindex,follow"/></head>
    <body><main className="container page"><h1>404</h1><p>Page not found. / 未找到这个页面。</p><nav className="language-switch"><a href="/en/">English home</a><a href="/zh/" lang="zh-Hans">中文首页</a></nav></main></body>
  </html>;
}
