import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API traffic is proxied at request time via src/app/api/[...path]/route.ts
  // so BACKEND_URL is read from Vercel env on each request (not baked at build).
};

export default nextConfig;
