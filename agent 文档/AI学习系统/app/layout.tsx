import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 学习系统",
  description: "按模块练习 AI 知识，获得讲解，并循环复习薄弱题目。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN"><body><a className="skip-link" href="#main">跳到内容</a><SiteHeader/><main id="main" className="page-container">{children}</main><footer className="site-footer">根据原始题库独立整理的学习练习；新知识条目附有来源与核对日期。学习记录保存在本机。</footer></body></html>;
}
