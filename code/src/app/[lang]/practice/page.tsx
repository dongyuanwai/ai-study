import { allContent } from "@/lib/server/content.mjs";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { text } from "@/lib/question-bank";
import { Practice } from "@/components/study/practice";
import { StructuredData } from "@/components/study/structured-data";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, text(lang, "AI 能力测试", "AI practice"), text(lang, "按主题与难度随机组题，独立作答后对照解析，标记已掌握和需要复习的知识。", "Practice AI concepts with random questions, save your draft, and review reference explanations."), "practice");
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const questions = await allContent("knowledge");
  return <main id="main-content" className="zp-page"><StructuredData/><Suspense fallback={<div className="zp-pagehead"><h1>{text(lang, "能力测试", "AI practice")}</h1></div>}><Practice lang={lang} questions={questions}/></Suspense></main>;
}
