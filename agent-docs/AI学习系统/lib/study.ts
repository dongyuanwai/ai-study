import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { getQuestion, getQuestions } from "./bank";
import type { Attempt, Evaluation, Question, ReviewState, StudySession } from "./types";

type SessionRow = {
  id: string; mode: StudySession["mode"]; topic_id: string | null;
  question_ids: string; current_index: number; created_at: string; completed_at: string | null;
};
type AttemptRow = {
  id: string; session_id: string; question_id: string; question_index: number;
  answer: string; created_at: string; evaluation: string; final_score: number | null;
};
type ReviewRow = { question_id: string; score: number; streak: number; due_at: string; updated_at: string };

function sessionFromRow(row: SessionRow): StudySession {
  return {
    id: row.id, mode: row.mode, topicId: row.topic_id,
    questionIds: JSON.parse(row.question_ids) as string[],
    currentIndex: row.current_index, createdAt: row.created_at, completedAt: row.completed_at,
  };
}

function attemptFromRow(row: AttemptRow): Attempt {
  return {
    id: row.id, sessionId: row.session_id, questionId: row.question_id,
    questionIndex: row.question_index, answer: row.answer, createdAt: row.created_at,
    evaluation: JSON.parse(row.evaluation) as Evaluation, finalScore: row.final_score,
  };
}

function reviewFromRow(row: ReviewRow): ReviewState {
  return { questionId: row.question_id, score: row.score, streak: row.streak, dueAt: row.due_at, updatedAt: row.updated_at };
}

export function getReviewStates(): Map<string, ReviewState> {
  const rows = getDb().prepare("SELECT * FROM review_states").all() as ReviewRow[];
  return new Map(rows.map(row => [row.question_id, reviewFromRow(row)]));
}

export function getDueQuestions(topicId?: string): Question[] {
  const now = new Date().toISOString();
  const states = getReviewStates();
  return getQuestions()
    .filter(question => !topicId || question.topicId === topicId)
    .filter(question => { const review = states.get(question.id); return review && review.dueAt <= now; })
    .sort((a, b) => states.get(a.id)!.dueAt.localeCompare(states.get(b.id)!.dueAt));
}

export function getDashboard() {
  const questions = getQuestions();
  const states = getReviewStates();
  const due = getDueQuestions();
  const completed = [...states.values()].filter(state => state.score >= 4 && state.streak >= 2).length;
  const recent = getRecentAttempts(4);
  return { total: questions.length, base: questions.length - questions.filter(q => q.difficulty === "latest").length,
    latest: questions.filter(q => q.difficulty === "latest").length, attempted: states.size,
    mastered: completed, due: due.length, recent };
}

export function getSession(id: string): StudySession | null {
  const row = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
  return row ? sessionFromRow(row) : null;
}

export function getCurrentAttempt(session: StudySession): Attempt | null {
  const row = getDb().prepare("SELECT * FROM attempts WHERE session_id = ? AND question_index = ?")
    .get(session.id, session.currentIndex) as AttemptRow | undefined;
  return row ? attemptFromRow(row) : null;
}

export function getAttempt(id: string): Attempt | null {
  const row = getDb().prepare("SELECT * FROM attempts WHERE id = ?").get(id) as AttemptRow | undefined;
  return row ? attemptFromRow(row) : null;
}

export function pickQuestions(mode: StudySession["mode"], topicId: string | null, difficulty: string, count: number): Question[] {
  const questions = getQuestions().filter(question => {
    if (mode === "latest") return question.difficulty === "latest";
    if (mode === "review") return true;
    return question.topicId === topicId && (difficulty === "all" || question.difficulty === difficulty);
  });
  const states = getReviewStates();
  const now = new Date().toISOString();
  const due = questions.filter(question => states.get(question.id)?.dueAt && states.get(question.id)!.dueAt <= now)
    .sort((a, b) => states.get(a.id)!.dueAt.localeCompare(states.get(b.id)!.dueAt));
  if (mode === "review") return due.slice(0, count);
  const unseen = questions.filter(question => !states.has(question.id));
  const later = questions.filter(question => states.has(question.id) && states.get(question.id)!.dueAt > now)
    .sort((a, b) => states.get(a.id)!.dueAt.localeCompare(states.get(b.id)!.dueAt));
  return [...due, ...unseen, ...later].slice(0, count);
}

export function createSession(mode: StudySession["mode"], topicId: string | null, difficulty = "all", count = 5): StudySession | null {
  const chosen = pickQuestions(mode, topicId, difficulty, count);
  if (!chosen.length) return null;
  const session: StudySession = {
    id: randomUUID(), mode, topicId, questionIds: chosen.map(question => question.id),
    currentIndex: 0, createdAt: new Date().toISOString(), completedAt: null,
  };
  getDb().prepare("INSERT INTO sessions (id, mode, topic_id, question_ids, current_index, created_at) VALUES (?, ?, ?, ?, 0, ?)")
    .run(session.id, session.mode, session.topicId, JSON.stringify(session.questionIds), session.createdAt);
  return session;
}

export function saveAttempt(session: StudySession, answer: string): Attempt {
  const questionId = session.questionIds[session.currentIndex];
  if (!questionId || !getQuestion(questionId)) throw new Error("练习已经结束");
  const existing = getCurrentAttempt(session);
  if (existing) return existing;
  const attempt: Attempt = {
    id: randomUUID(), sessionId: session.id, questionId, questionIndex: session.currentIndex,
    answer, createdAt: new Date().toISOString(), finalScore: null,
    evaluation: { mode: "reference", score: null, covered: [], missing: [], incorrect: [],
      explanation: "回答已保存，正在准备讲解。", suggestedAnswer: "", followUp: "" },
  };
  getDb().prepare("INSERT INTO attempts (id, session_id, question_id, question_index, answer, created_at, evaluation) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(attempt.id, attempt.sessionId, attempt.questionId, attempt.questionIndex, attempt.answer,
      attempt.createdAt, JSON.stringify(attempt.evaluation));
  return attempt;
}

export function saveEvaluation(attemptId: string, evaluation: Evaluation): Attempt {
  const db = getDb();
  db.prepare("UPDATE attempts SET evaluation = ? WHERE id = ? AND final_score IS NULL").run(JSON.stringify(evaluation), attemptId);
  const attempt = getAttempt(attemptId);
  if (!attempt) throw new Error("作答记录不存在");
  return attempt;
}

const intervals = [1, 1, 1, 3, 7, 21];
export function rateAttempt(sessionId: string, attemptId: string, score: number): StudySession {
  if (!Number.isInteger(score) || score < 0 || score > 5) throw new Error("掌握度必须是 0–5 分");
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const session = getSession(sessionId);
    const attempt = getAttempt(attemptId);
    if (!session || !attempt || attempt.sessionId !== sessionId || attempt.questionIndex !== session.currentIndex || attempt.finalScore !== null) {
      throw new Error("该作答已完成或不属于当前题目");
    }
    const previous = getReviewStates().get(attempt.questionId);
    const now = new Date();
    const dueAt = new Date(now.getTime() + intervals[score] * 86_400_000).toISOString();
    const streak = score >= 4 ? (previous?.streak ?? 0) + 1 : 0;
    db.prepare("UPDATE attempts SET final_score = ? WHERE id = ?").run(score, attemptId);
    db.prepare(`INSERT INTO review_states (question_id, score, streak, due_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(question_id) DO UPDATE SET score=excluded.score, streak=excluded.streak,
        due_at=excluded.due_at, updated_at=excluded.updated_at`)
      .run(attempt.questionId, score, streak, dueAt, now.toISOString());
    const nextIndex = session.currentIndex + 1;
    db.prepare("UPDATE sessions SET current_index = ?, completed_at = ? WHERE id = ?")
      .run(nextIndex, nextIndex >= session.questionIds.length ? now.toISOString() : null, session.id);
    db.exec("COMMIT");
    return getSession(sessionId)!;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getRecentAttempts(limit = 30): Attempt[] {
  const rows = getDb().prepare("SELECT * FROM attempts ORDER BY created_at DESC LIMIT ?").all(limit) as AttemptRow[];
  return rows.map(attemptFromRow);
}

export function getSessionAttempts(sessionId: string): Attempt[] {
  const rows = getDb().prepare("SELECT * FROM attempts WHERE session_id = ? ORDER BY question_index")
    .all(sessionId) as AttemptRow[];
  return rows.map(attemptFromRow);
}
