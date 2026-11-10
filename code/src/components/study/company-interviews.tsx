"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { AnswerValue } from "./local-ai-editor";
import { type CompanyInterview } from "@/lib/company-interviews";
import { fetchAllData, clearDataCache } from "@/lib/data-client";
import type { Lang } from "@/lib/site";
import { Icon } from "./icon";
import { Markdown } from "./markdown";
import { DataLoading } from "./data-loading";
import { AiAnswerProvider, AiSettings, AiAnswer } from "./ai-answer";
import styles from "./company-interviews.module.css";

const LocalAiSettings = process.env.NODE_ENV === "development" ? dynamic(() => import("./local-ai-editor").then(module => module.LocalAiSettings), { ssr: false }) : () => null;

export function CompanyInterviews({ lang }: { lang: Lang }) {
  return <AiAnswerProvider><CompanyInterviewContent lang={lang}/></AiAnswerProvider>;
}

function CompanyInterviewContent({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [interviews, setInterviews] = useState<CompanyInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(false);
    async function load() {
      try {
        const data = await fetchAllData<CompanyInterview>("interviews", "include=questions", controller.signal);
        if (!controller.signal.aborted) setInterviews(data);
      } catch { if (!controller.signal.aborted) setLoadError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [reload]);
  const companies = [...new Map(interviews.map(item => [item.company, item.companyEn])).entries()];
  const roles = [...new Set(interviews.map(item => item.role))];
  const [savedAnswers, setSavedAnswers] = useState<Record<string, AnswerValue>>({});
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [selected, setSelected] = useState(interviews[0]?.id || "");
  const term = query.trim().toLowerCase();
  const matchesRecord = (item: (typeof interviews)[number]) => [item.company, item.companyEn, item.role, item.round, ...item.tags].join(" ").toLowerCase().includes(term);
  const rows = interviews.filter(item => (!company || item.company === company) && (!role || item.role === role) && (!term || matchesRecord(item) || item.questions.some(question => `${question.title} ${question.group} ${question.topic}`.toLowerCase().includes(term))));
  const active = rows.find(item => item.id === selected) || rows[0];
  const groups = [...new Set(active?.questions.map(question => question.group) || [])];
  const selectedGroup = groups.includes(group) ? group : "";
  const visibleQuestions = active?.questions.filter(question => (!selectedGroup || question.group === selectedGroup) && (!term || matchesRecord(active) || `${question.title} ${question.group} ${question.topic}`.toLowerCase().includes(term))) || [];
  const displayedQuestions = visibleQuestions.map(question => ({ ...question, ...savedAnswers[`${active?.id}:${question.id}`] }));
  const topics = [...new Set(visibleQuestions.map(question => question.topic))];
  const questionCount = interviews.reduce((count, item) => count + item.questions.length, 0);
  const reset = () => { setCompany(""); setRole(""); setQuery(""); setGroup(""); };

  return <section className={styles.page}>
    <header className={styles.heading}>
      <div><h1>{zh ? "公司面试真题" : "Real company interviews"}</h1><p>{zh ? "按公司与岗位，梳理面试中的关键问题。" : "Browse interview questions by company and role. Questions are in Chinese."}</p></div>
      <div className={styles.stats}><span><b>{companies.length}</b>{zh ? "家公司" : "companies"}</span><span><b>{interviews.length}</b>{zh ? "场面试" : "interviews"}</span><span><b>{questionCount}</b>{zh ? "道题目" : "questions"}</span></div>
    </header>
    <AiSettings/>
    <LocalAiSettings/>
    {loading && <DataLoading label={zh ? "正在加载面试题…" : "Loading interviews…"}/>}
    {loadError && <div role="alert"><p>{zh ? "面试题加载失败，请稍后重试。" : "Unable to load interviews. Please retry."}</p><button type="button" onClick={() => setReload(value => value + 1)}>{zh ? "重试" : "Retry"}</button></div>}
    <div className={styles.companies} role="group" aria-label={zh ? "筛选公司" : "Filter by company"}>
      <button type="button" aria-pressed={!company} onClick={() => { setCompany(""); setGroup(""); }}>{zh ? "全部公司" : "All companies"}<span>{interviews.length}</span></button>
      {companies.map(([name, en]) => <button type="button" key={name} aria-pressed={company === name} onClick={() => { setCompany(name); setGroup(""); }}><span className={`${styles.companyMark} ${styles.tone0}`}>{en.slice(0, 1)}</span>{zh ? name : en}<span>{interviews.filter(item => item.company === name).length}</span></button>)}
    </div>
    <div className={styles.toolbar}>
      <label className={styles.search}><Icon name="search"/><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={zh ? "搜索公司、岗位或面试题" : "Search company, role or question"} aria-label={zh ? "搜索公司面试真题" : "Search interview questions"}/></label>
      <select value={role} onChange={event => { setRole(event.target.value); setGroup(""); }} aria-label={zh ? "筛选岗位" : "Filter by role"}><option value="">{zh ? "全部岗位" : "All roles"}</option>{roles.map(value => <option key={value} value={value}>{value}</option>)}</select>
      <span className={styles.resultCount} role="status">{rows.length} {zh ? "场面试" : "interviews"}</span>
    </div>
    {active ? <div className={styles.workspace}>
      <aside className={styles.list} aria-label={zh ? "面试记录" : "Interview records"}>
        {rows.map(item => <button type="button" className={styles.record} key={item.id} aria-pressed={active.id === item.id} onClick={() => { setSelected(item.id); setGroup(""); }}>
          <span className={styles.recordTop}><strong>{zh ? item.company : item.companyEn}</strong><span className={styles.real}>{zh ? "真题" : "Interview"}</span></span>
          <span className={styles.role}>{item.role}</span>
          <span className={styles.recordMeta}>{item.round}<span>·</span>{item.questions.length} {zh ? "道题" : "questions"}</span>
          <span className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</span>
        </button>)}
      </aside>
      <article className={styles.detail} key={active.id} aria-label={`${active.company} ${active.role}`}>
        <header className={styles.detailHead}>
          <div className={styles.detailLabel}><Icon name="company"/><span>{zh ? active.company : active.companyEn}</span><span> / </span><span>{active.round}</span><span>·</span><span>{active.duration}</span></div>
          <h2>{active.role}</h2><p>{active.summary}</p>
          {active.answerNote && <p className={styles.answerNotice}>{zh ? active.answerNote : "These are supplementary reference answers, not the interviewee’s original responses. Adapt project details to your own experience."}</p>}
          {active.questions.some(question => !question.answer) && <p className={styles.answerNotice}>{zh ? "当前为面试题目，参考答案待补充。" : "Questions are available; reference answers will be added later."}</p>}
        </header>
        <div className={styles.groupBar} role="group" aria-label={zh ? "题目分类" : "Question categories"}>
          <button type="button" aria-pressed={!selectedGroup} onClick={() => setGroup("")}>{zh ? "全部题目" : "All questions"}<span>{active.questions.length}</span></button>
          {groups.map(value => <button type="button" key={value} aria-pressed={selectedGroup === value} onClick={() => setGroup(value)}>{value}<span>{active.questions.filter(question => question.group === value).length}</span></button>)}
        </div>
        <div className={styles.visibleCount} role="status">{zh ? `显示 ${visibleQuestions.length} 道题目` : `${visibleQuestions.length} questions shown`}</div>
        <div className={styles.questionList}>
          {topics.map(topic => <section key={topic} aria-label={topic}>
            <h3 className={styles.topicHeading}>{topic}</h3>
            {displayedQuestions.filter(question => question.topic === topic).map(question => <section className={styles.question} key={question.id}>
              <div className={styles.questionTitle}><span>{String(question.number).padStart(2, "0")}</span><h4>{question.title}</h4></div>
              {question.answer ? <details className={styles.answer}>
                <summary>{zh ? "查看参考答案" : "Show reference answer"}<Icon name="down"/></summary>
                <div className={styles.answerBody}><Markdown value={question.answer}/>{question.oral && <div className={styles.oral}><h5>{zh ? "面试时怎么说" : "Explain it in an interview"}</h5><Markdown value={question.oral}/></div>}{question.pitfalls && <div className={styles.pitfalls}><h5>{zh ? "注意事项" : "Common pitfalls"}</h5><Markdown value={question.pitfalls}/></div>}</div>
              </details> : <p className={styles.pending}>{zh ? "答案待补充" : "Answer pending"}</p>}
              <AiAnswer interviewId={active.id} questionId={question.id} onSaved={value => { clearDataCache(); setSavedAnswers(current => ({ ...current, [`${active.id}:${question.id}`]: value })); }}/>
            </section>)}
          </section>)}
          {!visibleQuestions.length && <div className={styles.empty}><h3>{zh ? "当前分类下没有匹配的题目" : "No questions match this category"}</h3><button type="button" onClick={() => { setQuery(""); setGroup(""); }}>{zh ? "显示全部题目" : "Show all questions"}</button></div>}
        </div>
      </article>
    </div> : (loading || loadError) ? null : <div className={styles.empty}><Icon name="search"/><h2>{zh ? "没有匹配的面试记录" : "No matching interviews"}</h2><p>{zh ? "试试其他公司、岗位或关键词。" : "Try another company, role or keyword."}</p><button type="button" onClick={reset}>{zh ? "清除筛选" : "Clear filters"}</button></div>}
  </section>;
}
