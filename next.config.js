/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    domains: ["i.pravatar.cc", "images.unsplash.com"]
  }
};

module.exports = nextConfig;
