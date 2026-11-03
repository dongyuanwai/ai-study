import type { NextConfig } from "next";
import { resolve } from "node:path";

// Sibling question-bank Markdown files, relative to this app (Vercel Root
// Directory `agent-docs/AI学习系统`). `readFileSync` builds those paths at
// runtime, so the tracer cannot see them unless they are listed here.
// `/**` matches every server route, including `/` and nested dynamic routes.
const bankFiles = ["../AI大模型面试题库-*.md"];

const nextConfig: NextConfig = {
  // Allow tracing to leave this app folder and reach the sibling Markdown.
  // On Vercel the lambda root is the repository, and the launcher chdirs to
  // this app, so those files land at `process.cwd()/..` — the path `lib/bank.ts` reads.
  outputFileTracingRoot: resolve(__dirname, ".."),
  outputFileTracingIncludes: {
    "/**": bankFiles,
  },
};

export default nextConfig;
