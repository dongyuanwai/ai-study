import Link from "next/link";
import { type Lang, pathFor, site } from "@/lib/site";
import { LanguageSwitch } from "./language-switch";
import { MainNavigation } from "./main-navigation";

export function Header({ lang }: { lang: Lang }) {
  return <header className="site-header"><div className="zx-top"><Link className="zx-brand" href={pathFor(lang)} aria-label={lang === "zh" ? `${site.name} 首页` : "Zhixu AI home"}><img src="/brand-mark.svg" alt="" width={32} height={32}/><span><span className="zx-brand-name">{lang === "zh" ? "知序" : "Zhixu"}</span><span className="zx-brand-sub">ZHIXU · AI</span></span></Link><MainNavigation lang={lang}/><LanguageSwitch lang={lang}/></div></header>;
}
export function Footer({ lang }: { lang: Lang }) {
  return <footer className="zx-footer"><span className="zx-footer-status"><span className="zx-live"/>{lang === "zh" ? "题目与答案来自你的资料" : "Learn from your question library"}</span></footer>;
}
