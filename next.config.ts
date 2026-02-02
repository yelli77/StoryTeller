import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.proxy.runpod.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
