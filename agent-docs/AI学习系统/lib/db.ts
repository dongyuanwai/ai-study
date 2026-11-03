import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const cache = globalThis as typeof globalThis & { __aiLearningDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (cache.__aiLearningDb) return cache.__aiLearningDb;
  const filename = process.env.AI_DB_PATH
    ? resolve(process.env.AI_DB_PATH)
    : resolve(process.cwd(), "data", "learning.sqlite");
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      topic_id TEXT,
      question_ids TEXT NOT NULL,
      current_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      question_id TEXT NOT NULL,
      question_index INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL,
      evaluation TEXT NOT NULL,
      final_score INTEGER,
      UNIQUE(session_id, question_index)
    );
    CREATE TABLE IF NOT EXISTS review_states (
      question_id TEXT PRIMARY KEY,
      score INTEGER NOT NULL,
      streak INTEGER NOT NULL,
      due_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS review_due_idx ON review_states(due_at);
    CREATE INDEX IF NOT EXISTS attempt_created_idx ON attempts(created_at DESC);
  `);
  cache.__aiLearningDb = db;
  return db;
}
