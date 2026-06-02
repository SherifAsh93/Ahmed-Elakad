import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "ahmedelakad.com",
        pathname: "/media/**",
      },
    ],
    unoptimized: false,
  },
  experimental: {},
};

export default nextConfig;
