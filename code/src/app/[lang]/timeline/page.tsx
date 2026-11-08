import { notFound } from "next/navigation";
import { isLang } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { text } from "@/lib/question-bank";
import { StructuredData } from "@/components/study/structured-data";
import { Timeline } from "@/components/study/timeline";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, text(lang, "AI 知识时间线", "AI knowledge timeline"), text(lang, "从 2023 年起随页面滚动探索 AI 进展，按四个大类学习知识点。", "Explore AI developments from 2023 on a scroll-driven timeline, with four knowledge categories and related questions."), "timeline");
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <main id="main-content" className="zt-page"><StructuredData/><Timeline lang={lang}/></main>;
}
