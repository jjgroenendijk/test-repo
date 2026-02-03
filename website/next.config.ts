import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: '/test-repo',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
