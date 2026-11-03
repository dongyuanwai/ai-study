import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { startSessionAction } from "@/app/actions";
import { getQuestions, getTopic } from "@/lib/bank";
import { getReviewStates } from "@/lib/study";

export const dynamic = "force-dynamic";

const names = { easy: "简单", medium: "中等", hard: "困难" } as const;

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();
  const questions = getQuestions().filter(q => q.topicId === id && q.difficulty !== "latest");
  const states = getReviewStates();
  const counts = Object.entries(names).map(([difficulty, label]) => ({ difficulty, label, count: questions.filter(q => q.difficulty === difficulty).length }));
  return <>
    <Link className="back-link" href="/topics">← 全部模块</Link>
    <section className={`topic-detail accent-${topic.accent}`}><span className="eyebrow">FOCUSED PRACTICE</span><h1>{topic.name}</h1><p>{topic.description}</p><div className="detail-metrics"><span><strong>{topic.count}</strong> 道题</span><span><strong>{questions.filter(q => states.has(q.id)).length}</strong> 已练习</span><span><strong>{questions.filter(q => { const state = states.get(q.id); return state && state.score >= 4 && state.streak >= 2; }).length}</strong> 已掌握</span></div></section>
    <div className="detail-layout"><section className="surface-card"><span className="eyebrow">START A SESSION</span><h2>开始一组练习</h2><p>选择难度后，系统会优先安排到期复习题，再安排未做过的题。每组最多五题。</p><form action={startSessionAction} className="session-form"><input type="hidden" name="mode" value="topic"/><input type="hidden" name="topicId" value={id}/><label htmlFor="difficulty">题目难度</label><select id="difficulty" name="difficulty" defaultValue="all"><option value="all">全部难度（{questions.length} 题）</option>{counts.map(item => <option key={item.difficulty} value={item.difficulty} disabled={item.count === 0}>{item.label}（{item.count} 题）</option>)}</select><button type="submit" className="button button-primary">开始作答 <Icon name="arrow"/></button></form></section>
      <aside className="surface-card tip-card"><span className="eyebrow">HOW IT WORKS</span><h2>先回忆，再对照</h2><ol><li>阅读问题，用自己的话回答。</li><li>提交后看针对性讲解与参考要点。</li><li>给自己 0–5 分的掌握度，系统安排复习。</li></ol><p>没有配置 AI 密钥也能练习：你可以对照参考答案自行评分。</p></aside></div>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">QUESTION MAP</span><h2>本模块题目</h2></div></div><div className="question-list">{questions.map(q => <div className="question-row" key={q.id}><span className={`difficulty difficulty-${q.difficulty}`}>{names[q.difficulty as keyof typeof names]}</span><span>{q.title}</span><small>{states.has(q.id) ? "已练习" : "未练习"}</small></div>)}</div></section>
  </>;
}
