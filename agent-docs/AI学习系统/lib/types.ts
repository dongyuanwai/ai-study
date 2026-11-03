export type Difficulty = "easy" | "medium" | "hard" | "latest";

export type Answer = {
  core: string;
  oral: string;
  pitfalls: string;
};

export type Question = {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  topicId: string;
  originalCategory: string;
  tags: string[];
  answer: Answer;
  sourceUrl?: string;
  publishedAt?: string;
  verifiedAt?: string;
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  count: number;
  accent: string;
};

export type Evaluation = {
  mode: "ai" | "reference";
  score: number | null;
  covered: string[];
  missing: string[];
  incorrect: string[];
  explanation: string;
  suggestedAnswer: string;
  followUp: string;
  model?: string;
  error?: string;
};

export type StudySession = {
  id: string;
  mode: "topic" | "review" | "latest";
  topicId: string | null;
  questionIds: string[];
  currentIndex: number;
  createdAt: string;
  completedAt: string | null;
};

export type Attempt = {
  id: string;
  sessionId: string;
  questionId: string;
  questionIndex: number;
  answer: string;
  createdAt: string;
  evaluation: Evaluation;
  finalScore: number | null;
};

export type ReviewState = {
  questionId: string;
  score: number;
  streak: number;
  dueAt: string;
  updatedAt: string;
};
