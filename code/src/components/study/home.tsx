"use client";

import Link from "next/link";
import { useState } from "react";
import { type Lang, pathFor } from "@/lib/site";
import { questionIndex, text, topics, type TopicId } from "@/lib/question-bank";
import { useStudy } from "./provider";
import { Icon } from "./icon";

function KnowledgeSphere({ lang }: { lang: Lang }) {
  const project = (latitude: number, longitude: number) => {
    const lat = latitude * Math.PI / 180, lon = longitude * Math.PI / 180, radius = 111;
    const x = radius * Math.cos(lat) * Math.cos(lon), y = radius * Math.sin(lat), z = radius * Math.cos(lat) * Math.sin(lon);
    const xx = x * Math.cos(.39) - z * Math.sin(.39), zz = x * Math.sin(.39) + z * Math.cos(.39);
    return { x: 207 + xx, y: 157 + y * Math.cos(-.38) - zz * Math.sin(-.38), z: y * Math.sin(-.38) + zz * Math.cos(-.38) };
  };
  const latitudes = Array.from({ length: 8 }, (_, index) => -70 + index * 20), longitudes = Array.from({ length: 12 }, (_, index) => index * 30);
  const points = latitudes.flatMap(lat => Array.from({ length: 24 }, (_, index) => project(lat, index * 15))).sort((a, b) => a.z - b.z);
  // 固定 SVG 输出精度，避免 Node 与浏览器三角函数的浮点尾数导致 hydration 不一致。
  const path = (values: { x: number; y: number }[]) => values.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  return <div className="zx-universe"><svg aria-hidden="true" className="zx-sphere" viewBox="0 0 400 310"><defs><radialGradient id="knowledge-glow"><stop offset="0" stopColor="#648bdf" stopOpacity=".12"/><stop offset="1" stopColor="#648bdf" stopOpacity="0"/></radialGradient></defs><circle cx="207" cy="157" r="147" fill="url(#knowledge-glow)"/><g fill="none" stroke="#a5b5cf" strokeWidth=".6">{latitudes.map(lat => <path key={lat} d={path(Array.from({ length: 25 }, (_, index) => project(lat, index * 15)))} opacity=".52"/>)}{longitudes.map(lon => <path key={lon} d={path(Array.from({ length: 37 }, (_, index) => project(-90 + index * 5, lon)))} opacity=".38"/>)}</g>{points.map((point, index) => <circle key={index} cx={point.x.toFixed(3)} cy={point.y.toFixed(3)} r={point.z > 55 ? 1.3 : .8} fill="#6682af" opacity={(.18 + (point.z + 111) / 222 * .7).toFixed(4)}/>)}<ellipse cx="207" cy="157" rx="169" ry="42" transform="rotate(-27 207 157)" fill="none" stroke="#9aaecf" strokeWidth=".8" opacity=".38"/><circle cx="207" cy="157" r="4" fill="#7396d5"/></svg><Link className="zx-orbit-label zx-label-a" href={`${pathFor(lang, "knowledge")}?topic=llm`}>{text(lang, "大语言模型", "LLM")}<Icon name="diagonal"/></Link><Link className="zx-orbit-label zx-label-b" href={`${pathFor(lang, "knowledge")}?topic=rag`}>{text(lang, "RAG 检索增强", "RAG")}<Icon name="diagonal"/></Link><Link className="zx-orbit-label zx-label-c" href={`${pathFor(lang, "knowledge")}?topic=agent`}>AI Agent<Icon name="diagonal"/></Link></div>;
}

export function Home({ lang }: { lang: Lang }) {
  const [selected, setSelected] = useState<TopicId>("llm");
  const { learned } = useStudy();
  const topic = topics.find(item => item.id === selected)!;
  const group = questionIndex.filter(question => question.category === selected);
  const completed = group.filter(question => learned.includes(question.id)).length;
  const next = group.find(question => !learned.includes(question.id)) || group[0];
  const percentage = Math.round(completed / group.length * 100);
  const learnedCount = questionIndex.filter(question => learned.includes(question.id)).length;

  return <>
    <section className="zx-hero">
      <div className="zx-hero-copy">
        <h1>{lang === "zh" ? <>理解 <em>AI</em>，<br/>从这里开始。</> : <>Understand <em>AI.</em><br/>Make it yours.</>}</h1>
        <p className="zx-hero-description">{text(lang, "学习核心概念，用题目检验理解。", "Learn the core concepts. Test what you understand.")}</p>
        <div className="zx-hero-actions">
          <Link className="zx-primary" href={pathFor(lang, `knowledge/${next.id}`)}>{learnedCount ? text(lang, "继续学习", "Continue learning") : text(lang, "开始学习", "Start learning")}<Icon name="arrow"/></Link>
          <Link className="zx-text-action" href={pathFor(lang, "practice")}>{text(lang, "进入测试", "Take a test")}<Icon name="arrow"/></Link>
        </div>
        <dl className="zx-home-stats">
          <div><dt>{text(lang, "题目", "Questions")}</dt><dd>{questionIndex.length}</dd></div>
          <div><dt>{text(lang, "学习方向", "Topics")}</dt><dd>{topics.length}</dd></div>
          <div><dt>{text(lang, "已掌握", "Mastered")}</dt><dd>{learnedCount}</dd></div>
        </dl>
      </div>
      <KnowledgeSphere lang={lang}/>
    </section>

    <div className="zx-learning-grid">
      <section className="zx-panel zx-course" aria-labelledby="home-knowledge-title">
        <div className="zx-home-card-head">
          <span className="zx-home-card-label"><Icon name="book"/>{text(lang, "知识库", "Knowledge")}</span>
          <Link className="zx-home-more" href={pathFor(lang, "knowledge")}>{text(lang, "全部方向", "All topics")}<Icon name="arrow"/></Link>
        </div>
        <div className="zx-course-content">
          <div>
            <h2 id="home-knowledge-title">{topic[lang]}</h2>
            <p className="zx-course-desc">{lang === "zh" ? topic.description : "Read questions and reference answers in Chinese."}</p>
          </div>
          <div className="zx-course-progress" role="progressbar" aria-label={text(lang, "当前专题学习进度", "Topic progress")} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="#e9eef6" strokeWidth="3"/><circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="157.08" strokeDashoffset={157.08 * (1 - percentage / 100)} strokeLinecap="round"/></svg>
            <strong>{percentage}%</strong>
          </div>
        </div>
        <p className="zx-home-progress-text">{text(lang, `已掌握 ${completed} / ${group.length} 题`, `${completed} / ${group.length} mastered`)}</p>
        <div className="zx-course-bottom">
          <div className="zx-topics" role="group" aria-label={text(lang, "学习专题", "Learning topics")}>
            {(["llm", "rag", "agent"] as const).map(id => <button key={id} type="button" onClick={() => setSelected(id)} aria-pressed={selected === id}>{id === "llm" ? text(lang, "大模型", "LLM") : id === "rag" ? "RAG" : "Agent"}</button>)}
          </div>
          <Link className="zx-home-card-action" href={pathFor(lang, `knowledge/${next.id}`)}>{completed === group.length ? text(lang, "复习专题", "Review topic") : text(lang, "继续学习", "Continue learning")}<Icon name="arrow"/></Link>
        </div>
      </section>

      <section className="zx-panel zx-test" aria-labelledby="home-practice-title">
        <div className="zx-home-card-head">
          <span className="zx-home-card-label"><Icon name="scan"/>{text(lang, "能力测试", "Practice")}</span>
          <span className="zx-home-card-meta">{text(lang, "自主作答 · 参考解析", "Written answers · Reference explanations")}</span>
        </div>
        <div className="zx-home-test-copy">
          <h2 id="home-practice-title">{text(lang, "检验你对知识的理解", "Put your knowledge to the test")}</h2>
          <p>{text(lang, "选择专题与难度，完成作答后对照解析。", "Choose a topic and difficulty, then review the reference answers.")}</p>
          <div className="zx-home-levels" aria-label={text(lang, "支持的测试难度", "Available difficulties")}>
            <span>{text(lang, "简单", "Easy")}</span><span>{text(lang, "中等", "Medium")}</span><span>{text(lang, "困难", "Hard")}</span>
          </div>
        </div>
        <div className="zx-test-bottom">
          <span className="zx-home-card-meta">{text(lang, "每组 5–20 题", "5–20 questions per session")}</span>
          <Link className="zx-home-card-action" href={pathFor(lang, "practice")}>{text(lang, "开始测试", "Start a test")}<Icon name="arrow"/></Link>
        </div>
      </section>
    </div>
  </>;
}
