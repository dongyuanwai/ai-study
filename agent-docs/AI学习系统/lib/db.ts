import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const cache = globalThis as typeof globalThis & { __aiLearningDb?: DatabaseSync };

// Local dev writes data/learning.sqlite under the app directory. On Vercel the
// launcher chdirs to /var/task/agent-docs/AI学习系统, and that tree is read-only.
// data/ is also absent from the traced function bundle. mkdirSync(recursive)
// then fails with ENOENT on .../data (a non-recursive mkdir would be EROFS),
// which is what crashes `/`. /tmp is the writable location. AI_DB_PATH still
// overrides either default when set to a writable file.
function dbFilename(): string {
  if (process.env.AI_DB_PATH) return resolve(process.env.AI_DB_PATH);
  if (process.env.VERCEL) return resolve(tmpdir(), "ai-learning", "learning.sqlite");
  return resolve(process.cwd(), "data", "learning.sqlite");
}

export function getDb(): DatabaseSync {
  if (cache.__aiLearningDb) return cache.__aiLearningDb;
  const filename = dbFilename();
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
