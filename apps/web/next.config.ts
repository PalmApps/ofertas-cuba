import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ofertas-cuba/shared",
    "@ofertas-cuba/db",
    "@ofertas-cuba/bot",
    "@ofertas-cuba/scraper",
  ],
  serverExternalPackages: ["telegram"],
};

export default nextConfig;
