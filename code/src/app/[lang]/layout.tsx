import { GoogleAnalytics } from "@/components/google-analytics";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLang, languages } from "@/lib/site";
import { Footer, Header } from "@/components/shell";
import { StudyProvider } from "@/components/study/provider";

export const dynamicParams = false;
export function generateStaticParams() { return languages.map(lang => ({ lang })); }
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <html lang={lang === "zh" ? "zh-Hans" : "en"} suppressHydrationWarning><head><GoogleAnalytics/></head><body><a className="skip-link" href="#main-content">{lang === "zh" ? "跳到正文" : "Skip to content"}</a><StudyProvider><div className="study-app"><Header lang={lang}/><div className="zx-main">{children}<Footer lang={lang}/></div></div></StudyProvider></body></html>;
}
