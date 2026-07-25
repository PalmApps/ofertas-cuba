import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ofertas-cuba/shared", "@ofertas-cuba/db"],
};

export default nextConfig;
