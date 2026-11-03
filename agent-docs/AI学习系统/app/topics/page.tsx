import Link from "next/link";
import { Icon } from "@/components/icon";
import { getQuestions, getTopics } from "@/lib/bank";
import { getReviewStates } from "@/lib/study";

export const dynamic = "force-dynamic";

export default function TopicsPage() {
  const topics = getTopics();
  const questions = getQuestions();
  const states = getReviewStates();
  return <>
    <div className="page-intro"><span className="eyebrow">LEARNING PATHS</span><h1>选择一个知识模块</h1><p>把有关联的问题放在一起练。每次抽取五题，答完再看讲解，掌握度会决定之后的复习时间。</p></div>
    <div className="topic-grid full">{topics.map((topic, index) => {
      const own = questions.filter(q => q.topicId === topic.id);
      const practiced = own.filter(q => states.has(q.id)).length;
      const mastered = own.filter(q => { const state = states.get(q.id); return state && state.score >= 4 && state.streak >= 2; }).length;
      return <Link href={`/topics/${topic.id}`} className={`topic-card accent-${topic.accent}`} key={topic.id}>
        <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
        <div><h2>{topic.name}</h2><p>{topic.description}</p></div>
        <div className="topic-mini-progress"><span style={{ width: `${(practiced / Math.max(1, own.length)) * 100}%` }}/></div>
        <span className="topic-bottom"><span>{topic.count} 道题 · 已练 {practiced} · 已掌握 {mastered}</span><Icon name="arrow"/></span>
      </Link>;
    })}</div>
  </>;
}
