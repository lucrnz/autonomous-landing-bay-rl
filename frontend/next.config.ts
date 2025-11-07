import type { NextConfig } from "next";
const basePath = "/landing-bay-rl";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: `${basePath}/`,
  },
};

export default nextConfig;
