import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/media/**",
      },
    ],
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
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days — optimized images cached on disk
    deviceSizes: [640, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 64, 128, 256, 384, 500],
    qualities: [75, 85], // 75 for standard images, 85 for hero/banners
    unoptimized: false,
  },
  experimental: {},
};

export default nextConfig;
