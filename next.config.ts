import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.CAREEROPS_BUILD_DIR || ".next",
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
