import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep build tracing inside this monorepo package. The parent user directory
  // contains an unrelated lockfile that is not readable in the workspace sandbox.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
