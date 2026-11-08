import { notFound } from "next/navigation";
import { isLang } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { getQuestion } from "@/lib/questions";
import { questionIndex } from "@/lib/question-bank";
import { KnowledgeDetail } from "@/components/study/knowledge-detail";
import { StructuredData } from "@/components/study/structured-data";

type Props = { params: Promise<{ lang: string; id: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return questionIndex.map(question => ({ id: question.id })); }
export async function generateMetadata({ params }: Props) {
  const { lang, id } = await params;
  const question = getQuestion(id);
  if (!isLang(lang) || !question) notFound();
  const title = `${question.title} · ${lang === "zh" ? question.level : "Question"} ${question.number}`;
  const description = `${lang === "zh" ? "核心回答、口述练习与易错点" : "Explanation, spoken answer and common pitfalls"}：${question.title} [${id}]`;
  return pageMetadata(lang, title, description, `knowledge/${id}`);
}
export default async function Page({ params }: Props) {
  const { lang, id } = await params;
  const question = getQuestion(id);
  if (!isLang(lang) || !question) notFound();
  return <main id="main-content" className="zp-page"><StructuredData/><KnowledgeDetail key={id} question={question} lang={lang}/></main>;
}
