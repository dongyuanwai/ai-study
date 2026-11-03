"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { rateAttemptAction, submitAnswerAction, type SubmittedFeedback } from "@/app/actions";
import { Icon } from "@/components/icon";
import { Markdown } from "@/components/markdown";
import type { Question } from "@/lib/types";

type SafeQuestion = Pick<Question, "id" | "title" | "difficulty" | "tags" | "sourceUrl" | "publishedAt" | "verifiedAt">;
const scoreLabels = ["完全不会", "大部分不会", "关键点缺失", "部分会", "基本掌握", "熟练掌握"];
const difficultyNames = { easy: "简单", medium: "中等", hard: "困难", latest: "新知识" };

export function PracticeClient({ sessionId, index, total, question, initialFeedback }: {
  sessionId: string; index: number; total: number; question: SafeQuestion; initialFeedback: SubmittedFeedback | null;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState(initialFeedback?.attempt.answer ?? "");
  const [feedback, setFeedback] = useState(initialFeedback);
  const [score, setScore] = useState<number | null>(initialFeedback?.attempt.evaluation.score ?? null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const progress = Math.round(((index + 1) / total) * 100);

  useEffect(() => {
    if (index === 0) return;
    window.scrollTo(0, 0);
    document.getElementById("practice-question-title")?.focus({ preventScroll: true });
  }, [index]);

  function submit() {
    if (!answer.trim() || pending) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await submitAnswerAction(sessionId, answer);
        setFeedback(result);
        setScore(result.attempt.evaluation.score);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "提交失败，请稍后重试。");
      }
    });
  }

  function next() {
    if (score === null || !feedback || pending) return;
    setError("");
    startTransition(async () => {
      try {
        await rateAttemptAction(sessionId, feedback.attempt.id, score);
        window.scrollTo(0, 0);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "保存评分失败，请稍后重试。");
      }
    });
  }

  return <div className="practice-shell">
    <div className="practice-top"><Link href="/topics" className="back-link">← 退出练习</Link><span>第 {index + 1} / {total} 题</span></div>
    <div className="progress-track practice-progress" role="progressbar" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={total} aria-label="本组练习进度"><span style={{ width: `${progress}%` }}/></div>
    <section className="question-panel"><div className="question-meta"><span className={`difficulty difficulty-${question.difficulty}`}>{difficultyNames[question.difficulty]}</span>{question.tags.slice(0, 4).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><span className="eyebrow">THINK BEFORE YOU READ</span><h1 id="practice-question-title" tabIndex={-1}>{question.title}</h1><p>先尽量用自己的话解释清楚，再提交回答。提交后才会显示参考要点。</p></section>
    {!feedback ? <section className="surface-card answer-panel"><label htmlFor="answer" className="answer-label">你的回答</label><textarea id="answer" value={answer} onChange={event => setAnswer(event.target.value)} maxLength={8000} rows={11} placeholder="写下你的理解：核心概念是什么？为什么？如何在实际项目中使用？" disabled={pending}/><div className="answer-toolbar"><span>{answer.length} / 8000 字</span><button type="button" className="button button-primary" onClick={submit} disabled={!answer.trim() || pending}>{pending ? "正在保存并讲解…" : "提交回答，查看讲解"}<Icon name="arrow"/></button></div><p className="small-note">你的原回答会先保存在本机；AI 评价不可用时仍可对照参考答案自评。</p></section> : <>
      <section className="surface-card feedback-panel"><div className="section-heading compact"><div><span className="eyebrow">YOUR ANSWER</span><h2>你的回答</h2></div><span className="score-pill">{feedback.attempt.evaluation.mode === "ai" ? `AI 建议 ${feedback.attempt.evaluation.score} / 5` : "参考对照模式"}</span></div><p className="pre-line">{feedback.attempt.answer}</p></section>
      <section className="surface-card feedback-panel"><span className="eyebrow">PERSONALIZED FEEDBACK</span><h2>{feedback.attempt.evaluation.mode === "ai" ? "针对这次回答的讲解" : "对照参考要点"}</h2><p>{feedback.attempt.evaluation.explanation}</p>{feedback.attempt.evaluation.covered.length > 0 && <div className="feedback-list positive"><strong>说对了</strong><ul>{feedback.attempt.evaluation.covered.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}{feedback.attempt.evaluation.missing.length > 0 && <div className="feedback-list"><strong>可以补充</strong><ul>{feedback.attempt.evaluation.missing.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}{feedback.attempt.evaluation.incorrect.length > 0 && <div className="feedback-list warning"><strong>需要纠正</strong><ul>{feedback.attempt.evaluation.incorrect.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}{feedback.attempt.evaluation.followUp && <p className="follow-up"><strong>想一想：</strong>{feedback.attempt.evaluation.followUp}</p>}</section>
      <section className="surface-card reference-panel"><span className="eyebrow">REFERENCE</span><h2>参考要点</h2><div className="reference-section"><h3>核心回答</h3><Markdown>{feedback.reference.core}</Markdown></div><div className="reference-section"><h3>适合口述的版本</h3><Markdown>{feedback.reference.oral}</Markdown></div><div className="reference-section"><h3>易错点</h3><Markdown>{feedback.reference.pitfalls}</Markdown></div>{question.sourceUrl && <a className="text-link" href={question.sourceUrl} target="_blank" rel="noopener noreferrer">查看官方来源 <Icon name="external"/></a>}{question.verifiedAt && <p className="small-note">核对日期：{question.verifiedAt}</p>}</section>
      <section className="surface-card rating-panel"><span className="eyebrow">CLOSE THE LOOP</span><h2>现在你掌握到什么程度？</h2><p>请按自己能否脱离参考答案复述来评分；低分题会更早进入复习队列。</p><div className="rating-options" role="group" aria-label="掌握度评分">{scoreLabels.map((label, value) => <button key={value} type="button" className={score === value ? "rating-option selected" : "rating-option"} onClick={() => setScore(value)} aria-pressed={score === value}><strong>{value}</strong><span>{label}</span></button>)}</div><button type="button" className="button button-primary" onClick={next} disabled={score === null || pending}>{pending ? "正在保存…" : index + 1 === total ? "完成这一组" : "保存并进入下一题"}<Icon name="arrow"/></button></section>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
