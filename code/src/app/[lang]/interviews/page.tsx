import { notFound } from "next/navigation";
import { isLang } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { CompanyInterviews } from "@/components/study/company-interviews";
import { StructuredData } from "@/components/study/structured-data";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, lang === "zh" ? "公司面试真题" : "Real company interviews", lang === "zh" ? "按公司和岗位浏览真实面经题目，当前收录字节跳动 Agent 开发一面 47 道题，按项目追问、后端服务化和算法分类。" : "Explore reported interview questions by company and role, starting with 47 ByteDance Agent developer questions grouped by project discussions, backend services and algorithms.", "interviews");
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <main id="main-content"><StructuredData/><CompanyInterviews lang={lang}/></main>;
}
