import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

function resolveContentDir(): string {
  const monorepoContent = path.resolve(__dirname, "../../content");
  const localContent = path.resolve(__dirname, "./content");
  if (fs.existsSync(path.join(monorepoContent, "songs.json"))) {
    return monorepoContent;
  }
  return localContent;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@content": resolveContentDir(),
    };
    return config;
  },
};

export default nextConfig;
