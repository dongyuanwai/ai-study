"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getQuestion, getTopic } from "@/lib/bank";
import { evaluateAnswer } from "@/lib/evaluate";
import { createSession, getCurrentAttempt, getSession, rateAttempt, saveAttempt, saveEvaluation } from "@/lib/study";
import type { Answer, Attempt } from "@/lib/types";

export type SubmittedFeedback = { attempt: Attempt; reference: Answer };

export async function startSessionAction(formData: FormData): Promise<void> {
  const requestedMode = String(formData.get("mode") ?? "topic");
  const mode = requestedMode === "review" || requestedMode === "latest" ? requestedMode : "topic";
  const topicId = mode === "topic" ? String(formData.get("topicId") ?? "") : null;
  const difficulty = String(formData.get("difficulty") ?? "all");
  if (mode === "topic" && (!topicId || !getTopic(topicId))) throw new Error("请选择有效的学习模块");
  if (!["all", "easy", "medium", "hard"].includes(difficulty)) throw new Error("题目难度无效");
  const session = createSession(mode, topicId, difficulty, 5);
  if (!session) redirect(mode === "review" ? "/review?empty=1" : "/topics");
  redirect(`/practice/${session.id}`);
}

export async function submitAnswerAction(sessionId: string, rawAnswer: string): Promise<SubmittedFeedback> {
  const session = getSession(sessionId);
  if (!session || session.completedAt) throw new Error("练习已结束或不存在");
  const question = getQuestion(session.questionIds[session.currentIndex]);
  if (!question) throw new Error("题目不存在");
  const answer = rawAnswer.trim();
  if (!answer || answer.length > 8000) throw new Error("请填写 1–8000 字的回答");
  const existing = getCurrentAttempt(session);
  if (existing?.evaluation.suggestedAnswer) return { attempt: existing, reference: question.answer };
  const attempt = existing ?? saveAttempt(session, answer);
  const evaluation = await evaluateAnswer(question, attempt.answer);
  return { attempt: saveEvaluation(attempt.id, evaluation), reference: question.answer };
}

export async function rateAttemptAction(sessionId: string, attemptId: string, score: number): Promise<number> {
  const session = rateAttempt(sessionId, attemptId, score);
  revalidatePath("/");
  revalidatePath("/review");
  revalidatePath("/history");
  revalidatePath(`/practice/${sessionId}`);
  return session.currentIndex;
}
