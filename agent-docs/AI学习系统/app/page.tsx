import Link from "next/link";
import { startSessionAction } from "./actions";
import { getTopics } from "@/lib/bank";
import { getDashboard } from "@/lib/study";
import { getQuestion } from "@/lib/bank";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const dashboard = getDashboard();
  const topics = getTopics();
  return <>
    <section className="hero-panel">
      <div className="hero-copy"><span className="eyebrow">YOUR LEARNING LOOP</span><h1>把会的练熟，<br/><span>把不会的练会。</span></h1><p>一次专注一个主题，一次回答一道题。讲解紧跟你的回答，薄弱点会在合适的时候再次出现。</p><div className="hero-actions">
        {dashboard.due > 0 ? <form action={startSessionAction}><input type="hidden" name="mode" value="review"/><button className="button button-primary" type="submit">开始今日复习 <Icon name="arrow"/></button></form> : <Link className="button button-primary" href="/topics">选择知识模块 <Icon name="arrow"/></Link>}
        <Link className="button button-soft" href="/knowledge">看看最新知识</Link>
      </div></div>
      <div className="hero-note" aria-hidden="true"><div className="note-label">TODAY&apos;S FOCUS</div><div className="note-number">{dashboard.due.toString().padStart(2, "0")}</div><div className="note-caption">道题等待回顾</div><div className="note-rule"/><span>理解 → 作答 → 讲解 → 再练</span></div>
    </section>

    <section className="stats-grid" aria-label="学习概况">
      <div className="stat-card"><Icon name="book"/><span>基础题库</span><strong>{dashboard.base}</strong><small>覆盖十个知识模块</small></div>
      <div className="stat-card"><Icon name="spark"/><span>新知识</span><strong>{dashboard.latest}</strong><small>附官方来源与日期</small></div>
      <div className="stat-card"><Icon name="chart"/><span>已练习</span><strong>{dashboard.attempted}</strong><small>每次作答都有记录</small></div>
      <div className="stat-card"><Icon name="repeat"/><span>待复习</span><strong>{dashboard.due}</strong><small>根据掌握度安排</small></div>
    </section>

    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">EXPLORE TOPICS</span><h2>从一个模块开始</h2><p>先选范围，再逐题作答。每组默认五道题。</p></div><Link href="/topics" className="text-link">查看全部模块 <Icon name="arrow"/></Link></div>
      <div className="topic-grid">{topics.slice(0, 6).map((topic, index) => <Link href={`/topics/${topic.id}`} className={`topic-card accent-${topic.accent}`} key={topic.id}><span className="topic-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{topic.name}</h3><p>{topic.description}</p></div><span className="topic-bottom"><span>{topic.count} 道题</span><Icon name="arrow"/></span></Link>)}</div>
    </section>

    <section className="two-column-section"><div className="surface-card"><div className="section-heading compact"><div><span className="eyebrow">KEEP THE MOMENTUM</span><h2>继续循环学习</h2></div></div><p>答得不完整的题会进入复习队列。重复练习时，先回忆，再对照上次遗漏的要点。</p><div className="inline-progress"><span>已掌握</span><strong>{dashboard.mastered} / {dashboard.base + dashboard.latest}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, (dashboard.mastered / Math.max(1, dashboard.total)) * 100)}%` }}/></div><Link href="/review" className="text-link">打开复习队列 <Icon name="arrow"/></Link></div>
      <div className="surface-card"><div className="section-heading compact"><div><span className="eyebrow">RECENT ANSWERS</span><h2>最近作答</h2></div></div>{dashboard.recent.length ? <div className="recent-list">{dashboard.recent.map(attempt => <div className="recent-row" key={attempt.id}><div><strong>{getQuestion(attempt.questionId)?.title ?? "已移除的题目"}</strong><small>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(new Date(attempt.createdAt))}</small></div><span className="score-pill">{attempt.finalScore === null ? "待自评" : `${attempt.finalScore} / 5`}</span></div>)}</div> : <p>还没有作答记录。选一个模块，完成第一道题吧。</p>}<Link href="/history" className="text-link">查看全部记录 <Icon name="arrow"/></Link></div></section>
  </>;
}
