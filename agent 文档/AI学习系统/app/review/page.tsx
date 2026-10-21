import Link from "next/link";
import { startSessionAction } from "@/app/actions";
import { Icon } from "@/components/icon";
import { getQuestions } from "@/lib/bank";
import { getDueQuestions, getReviewStates } from "@/lib/study";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  const due = getDueQuestions();
  const states = getReviewStates();
  const weak = getQuestions().filter(question => {
    const state = states.get(question.id);
    return state && state.score <= 3;
  }).sort((a, b) => states.get(a.id)!.dueAt.localeCompare(states.get(b.id)!.dueAt));
  return <>
    <div className="page-intro"><span className="eyebrow">SPACED REVIEW</span><h1>把薄弱点再练一遍</h1><p>到期题会优先出现在这里。提交答案前不会展示参考内容，方便你真正回忆，而不只是重读。</p></div>
    <div className="review-banner"><div><span className="eyebrow">DUE TODAY</span><strong>{due.length}</strong><p>道题等待回顾</p></div>{due.length > 0 ? <form action={startSessionAction}><input type="hidden" name="mode" value="review"/><button className="button button-primary" type="submit">开始复习 <Icon name="arrow"/></button></form> : <Link href="/topics" className="button button-soft">去练一个模块 <Icon name="arrow"/></Link>}</div>
    {due.length ? <section className="section-block"><div className="section-heading"><div><h2>当前复习队列</h2><p>每次最多练五题；完成后可回来继续。</p></div></div><div className="question-list">{due.map(q => <div key={q.id} className="question-row"><span className="score-pill">上次 {states.get(q.id)?.score ?? 0} / 5</span><span>{q.title}</span><small>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(new Date(states.get(q.id)!.dueAt))} 到期</small></div>)}</div></section> : <div className="empty-state"><Icon name="check"/><h2>当前没有到期的题目</h2><p>继续学习新模块，或者过几天回来复习。</p></div>}
    {weak.length > 0 && <section className="section-block"><div className="section-heading"><div><span className="eyebrow">WEAK POINTS</span><h2>待巩固的题目</h2><p>上次自评 0–3 分的题会留在这里；到期后也会进入上方的练习队列。</p></div></div><div className="question-list">{weak.map(q => <div key={q.id} className="question-row"><span className="score-pill">上次 {states.get(q.id)!.score} / 5</span><span>{q.title}</span><small>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(new Date(states.get(q.id)!.dueAt))} 到期</small></div>)}</div></section>}
  </>;
}
