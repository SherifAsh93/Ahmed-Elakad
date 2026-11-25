/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // Disable Turbopack for stable Webpack build
  },
}

module.exports = nextConfig