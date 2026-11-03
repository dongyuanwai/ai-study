import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  // The question bank is read from the sibling Markdown files at runtime.
  outputFileTracingRoot: resolve(__dirname, ".."),
};

export default nextConfig;
