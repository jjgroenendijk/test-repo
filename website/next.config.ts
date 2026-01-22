import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: '/test-repo',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
