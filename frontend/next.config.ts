import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  basePath: "/landing-bay-rl",
};

export default nextConfig;
