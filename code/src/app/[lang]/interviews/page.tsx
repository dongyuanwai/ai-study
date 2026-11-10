import { notFound } from "next/navigation";
import { isLang } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { CompanyInterviews } from "@/components/study/company-interviews";
import { StructuredData } from "@/components/study/structured-data";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, lang === "zh" ? "公司面试真题" : "Real company interviews", lang === "zh" ? "按公司和岗位浏览真实面经题目，收录字节跳动 Agent 开发一面 47 道题与拼多多 AI Agent 后端 5 轮面经 45 道题，按题目分类与轮次浏览。" : "Explore reported interview questions by company and role: 47 ByteDance Agent developer questions and 45 PDD AI Agent backend questions across five rounds.", "interviews");
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <main id="main-content"><StructuredData/><CompanyInterviews lang={lang}/></main>;
}
