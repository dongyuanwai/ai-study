"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import milestones from "@/data/ai-timeline.json";
import { questionIndex, text, topics } from "@/lib/question-bank";
import { type Lang, pathFor } from "@/lib/site";
import { Icon } from "./icon";
import { TimelineField } from "./timeline-field";

const categories = [
  { id: "models", zh: "模型与推理", en: "Models & reasoning", description: { zh: "大模型基础、架构与提示工程", en: "Foundations, architectures and prompting" }, topics: ["llm", "transformer", "prompt"], color: "#5275be", icon: "scan" },
  { id: "tuning", zh: "训练与对齐", en: "Training & alignment", description: { zh: "微调、偏好对齐与模型优化", en: "Fine-tuning, preferences and optimization" }, topics: ["finetune"], color: "#9174b1", icon: "check" },
  { id: "knowledge", zh: "检索与知识", en: "Retrieval & knowledge", description: { zh: "RAG、向量检索与知识图谱", en: "RAG, vector search and knowledge graphs" }, topics: ["rag"], color: "#398b83", icon: "book" },
  { id: "agents", zh: "智能体与应用", en: "Agents & applications", description: { zh: "工具、协议、框架与工程实践", en: "Tools, protocols, frameworks and production" }, topics: ["agent", "protocol", "framework", "engineering"], color: "#ad8150", icon: "timeline" },
] as const;
const accent = (color: string) => ({ "--zt-accent": color } as CSSProperties);

export function Timeline({ lang }: { lang: Lang }) {
  const [category, setCategory] = useState("all");
  const [active, setActive] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const journey = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const progress = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const items = milestones.filter(item => category === "all" || item.category === category);
  const current = items[Math.min(active, items.length - 1)];
  const group = categories.find(item => item.id === current.category)!;
  const detail = milestones.find(item => item.id === detailId) || current;
  const detailGroup = categories.find(item => item.id === detail.category)!;
  const related = detail.questionIds.length ? questionIndex.filter(question => detail.questionIds.some(id => id === question.id)) : questionIndex.filter(question => detail.keywords.some(keyword => `${question.title} ${question.tags}`.toLowerCase().includes(keyword.toLowerCase()))).slice(0, 5);

  useEffect(() => {
    const root = journey.current, list = track.current;
    if (!root || !list) return;
    const header = document.querySelector<HTMLElement>(".site-header");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    function measure() {
      frame = 0;
      if (!root || !list) return;
      const headerHeight = header?.getBoundingClientRect().height || 0;
      root.style.setProperty("--header-height", `${headerHeight}px`);
      const focus = Math.max(headerHeight + 130, innerHeight * .48);
      const rows = Array.from(list.querySelectorAll<HTMLElement>(".zt-event"));
      const positions = rows.map(row => row.querySelector(".zt-marker")!.getBoundingClientRect().top + 7);
      let index = 0;
      positions.forEach((position, i) => { if (position <= focus) index = i; });
      const next = Math.min(index + 1, positions.length - 1);
      const fraction = next === index ? 0 : Math.max(0, Math.min(1, (focus - positions[index]) / (positions[next] - positions[index])));
      progress.current = index + fraction;
      setActive(previous => previous === index ? previous : index);
      const rect = list.getBoundingClientRect();
      root.style.setProperty("--line-fill", `${Math.max(0, Math.min(rect.height, focus - rect.top))}px`);
      rows.forEach((row, i) => {
        const rect = row.getBoundingClientRect();
        const reveal = reduced.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * .94 - rect.top) / 180));
        row.style.setProperty("--reveal", String(reveal));
        row.style.setProperty("--entry-shift", `${(1 - reveal) * 42}px`);
        row.dataset.passed = String(positions[i] <= focus);
      });
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule); observer.observe(list); if (header) observer.observe(header);
    addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule); reduced.addEventListener("change", schedule);
    measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener("scroll", schedule); removeEventListener("resize", schedule); reduced.removeEventListener("change", schedule); };
  }, [category]);

  useEffect(() => {
    if (!detailId) return;
    const element = dialog.current;
    const previous = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [detailId]);

  function jump(year: string) {
    const row = track.current?.querySelector<HTMLElement>(`[data-year="${year}"]`);
    if (!row) return;
    const header = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
    window.scrollTo({ top: scrollY + row.getBoundingClientRect().top - header - 110, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function filter(id: string) {
    setCategory(id); setActive(0); progress.current = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return <div ref={journey} className="zt-journey" style={accent(group.color)}>
    <div className="zt-background" aria-hidden="true"><TimelineField progress={progress} nodes={items}/><span className="zt-background-year">{current.date.slice(0, 4)}</span></div>
    <header className="zt-intro"><div><span className="zt-range">2023 — {milestones.at(-1)!.date.slice(0, 4)}</span><h1>{text(lang, "AI 知识演进", "AI knowledge evolution")}</h1></div><span className="zt-total">{String(items.length).padStart(2, "0")}<small>{text(lang, "个知识节点", "milestones")}</small></span></header>
    <div className="zt-toolbar">
      <div className="zt-filters" role="group" aria-label={text(lang, "知识分类", "Knowledge categories")}><button type="button" aria-pressed={category === "all"} onClick={() => filter("all")}>{text(lang, "全部", "All")}</button>{categories.map(item => <button key={item.id} type="button" style={accent(item.color)} aria-pressed={category === item.id} onClick={() => filter(item.id)}><span/>{item[lang]}</button>)}</div>
      <nav className="zt-year-nav" aria-label={text(lang, "年份导航", "Year navigation")}>{[...new Set(items.map(item => item.date.slice(0, 4)))].map(year => <button key={year} type="button" aria-current={current.date.startsWith(year) ? "step" : undefined} onClick={() => jump(year)}>{year}</button>)}</nav>
    </div>
    <div className="zt-track-wrap">
      <div className="zt-axis-title" aria-hidden="true">{items[0].date.slice(0, 4)}</div>
      <ol ref={track} className="zt-track" aria-label={text(lang, "AI 知识时间线", "AI knowledge timeline")}>
        {items.map((item, index) => {
          const itemGroup = categories.find(group => group.id === item.category)!;
          return <li key={item.id} className="zt-event" data-id={item.id} data-year={item.date.slice(0, 4)} data-side={index % 2 ? "right" : "left"} style={accent(itemGroup.color)}>
            <span className="zt-marker" aria-hidden="true"/>
            <time className="zt-event-date" dateTime={item.date}><strong>{item.date.slice(0, 4)}</strong><span>{item.date.slice(5).replace("-", " · ")}</span></time>
            <article className="zt-event-card">
              <div className="zt-card-top"><span className="zt-card-category"><i/>{itemGroup[lang]}</span><span className="zt-card-kind">{text(lang, item.kind === "paper" ? "论文发表" : item.kind === "article" ? "官方解读" : "官方发布", item.kind === "paper" ? "Paper" : item.kind === "article" ? "Official article" : "Release")}</span></div>
              <span className="zt-card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2><button type="button" onClick={() => setDetailId(item.id)}>{item.name}<Icon name="diagonal"/></button></h2><p>{item.title[lang]}</p>
              <div className="zt-card-terms">{item.terms[lang].map(term => <button key={term} type="button" onClick={() => setDetailId(item.id)}>{term}</button>)}</div>
              <button className="zt-card-open" type="button" aria-label={`${text(lang, "查看", "Explore")} ${item.name}`} onClick={() => setDetailId(item.id)}>{text(lang, "查看知识点", "Explore concepts")}<Icon name="arrow"/></button>
            </article>
          </li>;
        })}
      </ol>
      <div className="zt-axis-end"><span/>{text(lang, "持续演进", "Still evolving")}</div>
    </div>
    <dialog ref={dialog} className="zt-dialog" aria-labelledby="zt-detail-title" onClose={() => setDetailId(null)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="zt-dialog-content" style={accent(detailGroup.color)}><header><span>{detailGroup[lang]} · {detail.date}</span><button type="button" aria-label={text(lang, "关闭详情", "Close details")} onClick={() => dialog.current?.close()}>×</button></header><h2 id="zt-detail-title">{detail.name}</h2><h3>{detail.title[lang]}</h3><p>{detail.description[lang]}</p><div className="zt-detail-terms">{detail.terms[lang].map(term => <span key={term}>{term}</span>)}</div><h4>{text(lang, "继续学习", "Continue learning")}</h4><div className="zt-question-links">{related.map(question => <Link key={question.id} href={pathFor(lang, `knowledge/${question.id}`)}>{question.title}<Icon name="arrow"/></Link>)}</div><div className="zt-topic-links">{topics.filter(topic => detailGroup.topics.some(id => id === topic.id)).map(topic => <Link key={topic.id} href={`${pathFor(lang, "knowledge")}?topic=${topic.id}`}>{topic[lang]}<Icon name="diagonal"/></Link>)}</div><a className="zt-source" href={detail.source.url} target="_blank" rel="noreferrer">{text(lang, "原始来源", "Original source")}<Icon name="diagonal"/></a></div>
    </dialog>
  </div>;
}
