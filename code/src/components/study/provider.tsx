"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Mark = "learned" | "review";
type Progress = { learned: string[]; review: string[] };
type StudyContext = Progress & { ready: boolean; toggle: (id: string, mark: Mark) => void };
const Context = createContext<StudyContext | null>(null);
const storageKey = "ai-study-progress-v1";
const validIds = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^(easy|medium|hard)-\d+$/.test(id)))].slice(0, 370) : [];

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>({ learned: [], review: [] });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || "null"); if (saved && typeof saved === "object") setProgress({ learned: validIds(saved.learned), review: validIds(saved.review) }); } catch { /* 存储不可用时保留当前会话状态。 */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* 不阻断阅读和练习。 */ } } }, [progress, ready]);
  function toggle(id: string, mark: Mark) {
    setProgress(current => {
      const other = mark === "learned" ? "review" : "learned";
      return { ...current, [mark]: current[mark].includes(id) ? current[mark].filter(value => value !== id) : [...current[mark], id], [other]: current[other].filter(value => value !== id) };
    });
  }
  return <Context.Provider value={{ ...progress, ready, toggle }}>{children}</Context.Provider>;
}
export function useStudy() { const context = useContext(Context); if (!context) throw new Error("学习组件需要放在 StudyProvider 内"); return context; }
