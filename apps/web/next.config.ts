import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@content": path.resolve(__dirname, "../../content"),
    };
    return config;
  },
};

export default nextConfig;
