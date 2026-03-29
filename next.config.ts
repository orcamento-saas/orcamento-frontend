import type { NextConfig } from "next";

/**
 * Proxy da API no mesmo domínio do front (Vercel → backend Railway).
 * Evita CORS + preflight (OPTIONS) no navegador em cada rota autenticada.
 *
 * Vercel: defina BACKEND_PROXY_TARGET=https://seu-backend.up.railway.app (sem barra final)
 * e NEXT_PUBLIC_API_URL=/api/backend no build.
 */
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Reduz alguns reloads durante desenvolvimento
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  async rewrites() {
    if (!backendProxyTarget) {
      return [];
    }
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
