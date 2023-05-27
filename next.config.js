/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "api.k-app.cloud"],
    deviceSizes: [576, 768, 992, 1200, 1400], // Bootstrap breakpoints
  }
}

module.exports = nextConfig
