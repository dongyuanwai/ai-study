"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Lang, pathFor } from "@/lib/site";
import { difficultyName, filterQuestions, sampleQuestions, text, topicName, topics, type DifficultyFilter, type Question, type TopicFilter } from "@/lib/question-bank";
import { useStudy } from "./provider";
import { Icon } from "./icon";
import { Markdown } from "./markdown";

type Session = { stage: "setup" | "answer" | "review"; ids: string[]; index: number; answers: Record<string, string> };
const emptySession = (): Session => ({ stage: "setup", ids: [], index: 0, answers: {} });
const storageKey = "ai-study-draft-v1";

export function Practice({ lang, questions }: { lang: Lang; questions: Question[] }) {
  const params = useSearchParams(), requested = params.get("question"), router = useRouter();
  const questionMap = useMemo(() => new Map(questions.map(question => [question.id, question])), [questions]);
  const [topic, setTopic] = useState<TopicFilter>("all"), [level, setLevel] = useState<DifficultyFilter>("all"), [count, setCount] = useState(5);
  const [session, setSession] = useState<Session>(emptySession), [ready, setReady] = useState(false);
  const { learned, review, toggle } = useStudy();
  useEffect(() => {
    let draft: Session | undefined;
    try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null") as Partial<Session> | null;
        if (saved && Array.isArray(saved.ids)) {
          const ids = [...new Set(saved.ids.filter((id): id is string => typeof id === "string" && questionMap.has(id)))].slice(0, 20);
          const answers = Object.fromEntries(ids.map(id => [id, typeof saved.answers?.[id] === "string" ? saved.answers[id].slice(0, 2000) : ""]));
          const stage = ids.length && (saved.stage === "answer" || saved.stage === "review") ? saved.stage : "setup";
          draft = { stage, ids, answers, index: Math.max(0, Math.min(Number.isInteger(saved.index) ? Number(saved.index) : 0, ids.length - 1)) };
        }
    } catch { /* 忽略损坏或不可用的本地草稿。 */ }
    if (requested && questionMap.has(requested)) setSession(draft?.ids.length === 1 && draft.ids[0] === requested ? draft : { stage: "answer", ids: [requested], index: 0, answers: {} });
    else if (draft) setSession(draft);
    setReady(true);
  }, [requested, questionMap]);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* 当前页面仍可正常作答。 */ } } }, [session, ready]);
  const pool = filterQuestions(questions, topic, level), actualCount = Math.min(count, pool.length);
  const answered = session.ids.filter(id => session.answers[id]?.trim()).length;
  function begin() { const chosen = sampleQuestions(pool, count); if (chosen.length) setSession({ stage: "answer", ids: chosen.map(question => question.id), index: 0, answers: {} }); }
  function header(title: string, subtitle: string, action?: React.ReactNode) {
    return <div className="zp-pagehead"><div><div className="zp-kicker">PRACTICE YOUR UNDERSTANDING</div><h1>{title}</h1><p className="zp-subtitle">{subtitle}</p></div>{action}</div>;
  }
  if (session.stage === "setup") return <>
    {header(text(lang, "从理解，到独立回答。", "From knowing to explaining."), text(lang, "选一个方向，试着讲清楚；在对照答案中，找到下一步学习重点。", "Choose a topic, explain your thinking, then compare with the reference answers."))}
    <div className="zp-setup"><div className="zp-setup-form"><div className="zp-form-section"><label htmlFor="test-topic">{text(lang, "01 / 选择测试范围", "01 / Choose a topic")}</label><select id="test-topic" className="zp-select" value={topic} onChange={event => setTopic(event.target.value as TopicFilter)}><option value="all">{text(lang, "全部知识方向", "All topics")}</option>{topics.map(item => <option key={item.id} value={item.id}>{item[lang]}</option>)}</select><p>{text(lang, "按主题练习，也可以混合不同知识方向。", "Focus on one topic or practice across the entire library.")}</p></div><div className="zp-form-section"><div className="zp-field-title">{text(lang, "02 / 选择难度", "02 / Choose a difficulty")}</div><div className="zp-choices" role="group" aria-label={text(lang, "测试难度", "Difficulty")}>{(["all", "简单", "中等", "困难"] as const).map(value => <button type="button" key={value} aria-pressed={level === value} onClick={() => setLevel(value)}>{difficultyName(value, lang)}</button>)}</div></div><div className="zp-form-section"><div className="zp-field-title">{text(lang, "03 / 选择题目数量", "03 / Choose a session length")}</div><div className="zp-choices" role="group" aria-label={text(lang, "测试题目数量", "Question count")}>{[5, 10, 20].map(value => <button type="button" key={value} aria-pressed={count === value} onClick={() => setCount(value)}>{value} {text(lang, "题", "questions")}</button>)}</div><p aria-live="polite">{text(lang, `当前范围有 ${pool.length} 条题目，本次抽取 ${actualCount} 题。`, `${pool.length} questions available. This session will contain ${actualCount}.`)}</p></div></div><aside><div className="zp-sidebox"><div className="zp-section-label">{text(lang, "本次练习", "THIS SESSION")}</div><h2>{topicName(topic, lang)}</h2><div className="zp-setup-total"><b>{actualCount}</b><span>{text(lang, "道问答题", "questions")}</span></div><p>{difficultyName(level, lang)} · {text(lang, "随机组题", "Random selection")}</p><button className="zp-primary" type="button" disabled={!actualCount || !ready} onClick={begin}>{text(lang, "开始测试", "Start practice")}<Icon name="arrow"/></button><div className="zp-rule"><Icon name="message"/><span>{text(lang, "用自己的话回答，完成后对照核心要点、口述版与易错点复盘。", "Answer in your own words, then review explanations and common pitfalls.")}</span></div></div></aside></div>
  </>;
  if (session.stage === "answer") {
    const question = questionMap.get(session.ids[session.index])!, answer = session.answers[question.id] || "";
    const finish = () => setSession(current => ({ ...current, stage: "review" }));
    return <>{header(text(lang, "把理解，用自己的话说出来。", "Explain it in your own words."), text(lang, `本组 ${session.ids.length} 题 · 完成后可查看参考解析`, `${session.ids.length} questions · Reference answers are available after practice`), <button type="button" className="zp-secondary" onClick={finish}>{text(lang, "完成并查看解析", "Finish & review")}</button>)}<div className="zp-test-layout"><section className="zp-answer-card"><div className="zp-answer-heading"><span>{text(lang, `第 ${session.index + 1} / ${session.ids.length} 题`, `Question ${session.index + 1} / ${session.ids.length}`)}</span><span className="zp-level">{difficultyName(question.level, lang)}</span></div><h2>{question.title}</h2><label className="zp-answer-label" htmlFor="practice-answer"><span>{text(lang, "你的回答", "Your answer")}</span><span>{answer.length} / 2000</span></label><textarea id="practice-answer" className="zp-answer-area" rows={7} maxLength={2000} value={answer} placeholder={text(lang, "先解释核心概念，再补充一个例子或使用场景……", "Explain the main idea, then add an example or a use case…")} onChange={event => setSession(current => ({ ...current, answers: { ...current.answers, [question.id]: event.target.value } }))}/><p className="zp-answer-tip">{text(lang, "草稿自动保留在当前浏览器标签页中。", "Your draft is saved in this browser tab.")}</p><div className="zp-answer-footer"><button className="zp-secondary" type="button" disabled={session.index === 0} onClick={() => setSession(current => ({ ...current, index: current.index - 1 }))}>{text(lang, "上一题", "Previous")}</button><button className="zp-primary" type="button" onClick={() => session.index === session.ids.length - 1 ? finish() : setSession(current => ({ ...current, index: current.index + 1 }))}>{session.index === session.ids.length - 1 ? text(lang, "完成并查看解析", "Finish & review") : text(lang, "下一题", "Next")}<Icon name="arrow"/></button></div></section><aside><div className="zp-sidebox"><h2>{text(lang, "答题进度", "Your progress")}</h2><p>{text(lang, `已填写 ${answered} / ${session.ids.length} 题`, `${answered} / ${session.ids.length} answered`)}</p><div className="zp-progress-line"><span style={{ width: `${answered / session.ids.length * 100}%` }}/></div><div className="zp-answer-grid">{session.ids.map((id, index) => <button type="button" key={id} aria-label={text(lang, `第 ${index + 1} 题`, `Question ${index + 1}`)} aria-current={session.index === index ? "step" : undefined} data-filled={Boolean(session.answers[id]?.trim())} onClick={() => setSession(current => ({ ...current, index }))}>{String(index + 1).padStart(2, "0")}</button>)}</div><div className="zp-answer-legend">{text(lang, "浅蓝表示已填写，高亮为当前题目。", "Filled answers are shaded. The current question is highlighted.")}</div></div><div className="zp-sidebox"><h2>{text(lang, "先独立思考，再核对答案。", "Think first. Review next.")}</h2><p>{text(lang, "不用逐字背诵参考答案。试着表达定义、工作过程和使用边界。", "You do not need to match the reference word for word. Explain the definition, process, and limits.")}</p></div></aside></div></>;
  }
  return <>{header(text(lang, "每次复盘，都更接近真正掌握。", "Review, reflect, and understand."), text(lang, "对照参考要点，标记已经掌握和需要复习的知识点。", "Compare your answers and mark what you learned or want to revisit."), <button type="button" className="zp-secondary" onClick={() => { setSession(emptySession()); router.replace(pathFor(lang, "practice"), { scroll: false }); }}>{text(lang, "再开始一组", "Start another session")}</button>)}<div className="zp-report-banner"><div><h2>{text(lang, "回答已整理，可以开始复盘。", "Your answers are ready to review.")}</h2><p>{text(lang, "此处提供参考答案对照，不是 AI 自动评分。", "Compare with reference answers. These are not automated AI grades.")}</p></div><div className="zp-report-total">{answered}<span> / {session.ids.length} {text(lang, "已答", "answered")}</span></div></div>{session.ids.map((id, index) => {
    const question = questionMap.get(id)!;
    return <article className="zp-report-item" key={id}><div className="zp-detail-meta"><span className="zp-level">{difficultyName(question.level, lang)}</span><span>{topicName(question.category, lang)}</span></div><h3>{String(index + 1).padStart(2, "0")}. {question.title}</h3><div className="zp-your-answer">{session.answers[id]?.trim() || text(lang, "本题未填写回答", "No answer provided")}</div><div className="zp-report-actions"><div className="zp-review-buttons"><button type="button" aria-pressed={learned.includes(id)} onClick={() => toggle(id, "learned")}>{text(lang, "已掌握", "Learned")}</button><button type="button" aria-pressed={review.includes(id)} onClick={() => toggle(id, "review")}>{text(lang, "需要复习", "Review later")}</button></div></div><details className="reference-details"><summary>{text(lang, "查看参考答案", "Show reference answer")}<Icon name="down"/></summary><div className="zp-report-reference"><h3>{text(lang, "核心回答", "Explanation")}</h3><Markdown value={question.core}/><h3>{text(lang, "口述表达", "Spoken answer")}</h3><Markdown value={question.oral}/><h3>{text(lang, "易错点", "Common pitfalls")}</h3><Markdown value={question.pitfalls}/></div></details></article>;
  })}</>;
}
