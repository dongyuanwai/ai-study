import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, pathFor } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { text } from "@/lib/question-bank";
import { KnowledgeLibrary } from "@/components/study/knowledge-library";
import { StructuredData } from "@/components/study/structured-data";
import { Icon } from "@/components/study/icon";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, text(lang, "AI 知识库", "AI knowledge library"), text(lang, "按主题与难度学习 370 条 AI 题目，阅读核心回答、口述表达和易错点。", "Explore 370 AI questions by topic and difficulty, with explanations and common pitfalls."), "knowledge");
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <main id="main-content" className="zp-page"><StructuredData/><div className="zp-pagehead"><div><div className="zp-kicker">KNOWLEDGE LIBRARY</div><h1>{text(lang, "从一个问题，理解一个知识点。", "One question. A deeper understanding.")}</h1><p className="zp-subtitle">{text(lang, "9 个学习方向，370 条题目与参考答案，按你的节奏逐步掌握。", "9 topics and 370 questions. Original question content is currently in Chinese.")}</p></div><Link className="zp-secondary" href={pathFor(lang, "practice")}><Icon name="scan"/>{text(lang, "检验学习效果", "Put it into practice")}</Link></div><Suspense fallback={<div className="zp-empty">{text(lang, "正在加载知识库……", "Loading the knowledge library…")}</div>}><KnowledgeLibrary lang={lang}/></Suspense></main>;
}
