const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Cache simples para requests GET
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

export interface ApiError {
  message: string;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; useCache?: boolean } = {}
): Promise<T> {
  const { token, useCache = false, ...init } = options;
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  
  // Cache para requests GET
  if (useCache && init.method === "GET") {
    const cacheKey = `${url}${token ? `_${token.substring(0, 10)}` : ''}`;
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
  }
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) {
    return undefined as T;
  }
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    const err: ApiError = {
      message: (data as { message?: string }).message ?? res.statusText ?? "Erro na requisição",
      status: res.status,
    };
    throw err;
  }
  
  // Salvar no cache se GET e useCache ativo
  if (useCache && init.method === "GET") {
    const cacheKey = `${url}${token ? `_${token.substring(0, 10)}` : ''}`;
    requestCache.set(cacheKey, { data, timestamp: Date.now() });
  }
  
  return data as T;
}

export async function apiGet<T>(path: string, token?: string, useCache = true): Promise<T> {
  return request<T>(path, { method: "GET", token, useCache });
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  return request<void>(path, { method: "DELETE", token });
}
