import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Reduz alguns reloads durante desenvolvimento
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  }
};

export default nextConfig;
