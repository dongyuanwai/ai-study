"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Lang, languages, localeFor, pathFor } from "@/lib/site";

export function LanguageSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const hrefFor = (target: Lang) => pathname?.startsWith(`/${lang}/`) ? pathname.replace(`/${lang}/`, `/${target}/`) : pathFor(target);
  return <nav className="language-switch" aria-label={lang === "zh" ? "选择语言" : "Choose language"}>
    {languages.map(target => <Link key={target} href={hrefFor(target)} lang={localeFor(target)} hrefLang={localeFor(target)} aria-current={target === lang ? "page" : undefined}>
      {target === "en" ? "English" : "中文"}
    </Link>)}
  </nav>;
}
