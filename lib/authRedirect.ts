/**
 * Destino padrão após login quando não há query `next`.
 * Query `next` só aceita caminhos relativos seguros (evita open redirect).
 */

export const DEFAULT_POST_LOGIN_PATH = "/dashboard";

/** Rota comum após autenticar quando o usuário veio do fluxo de planos. */
export const PLANS_POST_AUTH_PATH = "/plans";

/** Caminho interno seguro para usar em `next`. */
export function getSafeNextPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://")) return null;
  if (/[\s<>"'`|\\^]/.test(s)) return null;
  return s;
}

/** Monta `/login?...` com `mode` e/ou `next` opcionais. */
export function buildLoginUrl(options: {
  mode?: "register" | "forgot";
  next?: string | null;
} = {}): string {
  const q = new URLSearchParams();
  if (options.mode) q.set("mode", options.mode);
  const n = getSafeNextPath(options.next ?? undefined);
  if (n) q.set("next", n);
  const s = q.toString();
  return s ? `/login?${s}` : "/login";
}
