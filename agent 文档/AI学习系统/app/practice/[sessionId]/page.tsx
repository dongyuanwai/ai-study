import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/practice-client";
import { getQuestion } from "@/lib/bank";
import { getCurrentAttempt, getSession, getSessionAttempts } from "@/lib/study";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PracticePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  if (!session) notFound();
  if (session.currentIndex >= session.questionIds.length) {
    const attempts = getSessionAttempts(sessionId);
    const average = attempts.length ? (attempts.reduce((sum, item) => sum + (item.finalScore ?? 0), 0) / attempts.length).toFixed(1) : "0";
    return <section className="completion-panel"><span className="completion-icon">✓</span><span className="eyebrow">SESSION COMPLETE</span><h1>这一组，完成了。</h1><p>你回答了 {attempts.length} 道题，平均自评 {average} / 5 分。答得不稳的题会进入后续复习。</p><div className="completion-actions"><Link href="/topics" className="button button-primary">继续选模块</Link><Link href="/review" className="button button-soft">查看复习队列</Link><Link href="/history" className="text-link">查看作答记录</Link></div></section>;
  }
  const question = getQuestion(session.questionIds[session.currentIndex]);
  if (!question) notFound();
  const attempt = getCurrentAttempt(session);
  const safeQuestion = { id: question.id, title: question.title, difficulty: question.difficulty, tags: question.tags, sourceUrl: question.sourceUrl, publishedAt: question.publishedAt, verifiedAt: question.verifiedAt };
  return <PracticeClient key={`${session.id}-${session.currentIndex}`} sessionId={session.id} index={session.currentIndex} total={session.questionIds.length} question={safeQuestion} initialFeedback={attempt ? { attempt, reference: question.answer } : null}/>;
}
