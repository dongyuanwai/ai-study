"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Lang, pathFor } from "@/lib/site";
import { Icon } from "./study/icon";

export function MainNavigation({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const links = [{ path: "", zh: "首页", en: "Home", icon: "home" }, { path: "knowledge", zh: "知识库", en: "Knowledge", icon: "book" }, { path: "timeline", zh: "AI 时间线", en: "Timeline", icon: "timeline" }, { path: "practice", zh: "能力测试", en: "Practice", icon: "scan" }] as const;
  return <nav className="zx-nav" aria-label={lang === "zh" ? "主导航" : "Main navigation"}>{links.map(link => {
    const href = pathFor(lang, link.path), active = link.path ? pathname.startsWith(href) : pathname === href || pathname === href.slice(0, -1);
    return <Link key={link.path} href={href} aria-current={active ? "page" : undefined}><Icon name={link.icon}/><span>{link[lang]}</span></Link>;
  })}</nav>;
}
