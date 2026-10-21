import Link from "next/link";
import { getQuestion } from "@/lib/bank";
import { getRecentAttempts } from "@/lib/study";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const attempts = getRecentAttempts(100);
  return <>
    <div className="page-intro"><span className="eyebrow">ANSWER JOURNAL</span><h1>你的作答记录</h1><p>回看自己的原回答、系统给出的讲解和自评分数。这里展示最近一百次作答，数据保存在本机。</p></div>
    {attempts.length ? <div className="history-list">{attempts.map(attempt => {
      const question = getQuestion(attempt.questionId);
      return <details className="surface-card history-card" key={attempt.id}><summary><div><span className="history-date">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(attempt.createdAt))}</span><h2>{question?.title ?? "已移除的题目"}</h2></div><span className="score-pill">{attempt.finalScore === null ? "待自评" : `${attempt.finalScore} / 5`}</span></summary><div className="history-body"><h3>我的回答</h3><p className="pre-line">{attempt.answer}</p><h3>{attempt.evaluation.mode === "ai" ? "AI 讲解" : "参考对照"}</h3><p>{attempt.evaluation.explanation}</p>{attempt.evaluation.missing.length > 0 && <p><strong>可补充：</strong>{attempt.evaluation.missing.join("；")}</p>}{question && <p><strong>参考口述：</strong>{question.answer.oral}</p>}{attempt.finalScore === null && <Link className="text-link" href={`/practice/${attempt.sessionId}`}>返回完成自评 →</Link>}</div></details>;
    })}</div> : <div className="empty-state"><h2>还没有作答记录</h2><p>完成第一道题后，答案会出现在这里。</p><Link className="button button-primary" href="/topics">选择模块开始</Link></div>}
  </>;
}
