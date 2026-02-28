const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface ApiError {
  message: string;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
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
  return data as T;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: "GET", token });
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  return request<void>(path, { method: "DELETE", token });
}
