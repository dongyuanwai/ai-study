import { notFound } from "next/navigation";
import { isLang, site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/study/structured-data";
import { Home } from "@/components/study/home";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return pageMetadata(lang, site.home[lang].title, site.home[lang].description);
}
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <main id="main-content" className="zx-home"><StructuredData/><Home lang={lang}/></main>;
}
