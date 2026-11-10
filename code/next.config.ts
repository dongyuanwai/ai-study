import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  trailingSlash: true,
  outputFileTracingIncludes: { "/*": ["./src/data/*.json"] },
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  async redirects() {
    return [{ source: "/", destination: "/en/", permanent: true }];
  },
};
export default config;
