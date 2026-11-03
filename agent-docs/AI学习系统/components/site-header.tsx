import Link from "next/link";
import { Icon } from "./icon";

const links = [
  ["/", "首页"],
  ["/topics", "知识模块"],
  ["/knowledge", "最新知识"],
  ["/review", "错题复习"],
  ["/history", "作答记录"],
] as const;

export function SiteHeader() {
  return <header className="site-header">
    <div className="header-inner">
      <Link href="/" className="brand" aria-label="AI 学习系统首页"><span className="brand-mark"><Icon name="layers"/></span><span><strong>AI 学习系统</strong><small>LEARN · ANSWER · REVIEW</small></span></Link>
      <nav className="main-nav" aria-label="主导航">{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
  </header>;
}
