import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type {
  Budget,
  PublicBudgetView,
  CreateBudgetBody,
  SignBudgetBody,
  BudgetListResponse,
  NotificationsSummaryResponse,
  BudgetPreviewHtmlBody,
  BudgetPreviewHtmlResponse,
  BudgetCardListResponse,
  DashboardSummaryResponse,
} from "@/types/budget";

const BUDGETS = "budgets";
const PUBLIC_BUDGET = "public/budget";

// Dedupe de requests em voo para evitar GET /budgets duplicado
const inFlight = new Map<string, Promise<unknown>>();
// Cache curto por path para sobreviver a refresh de token
const localCache = new Map<string, { data: unknown; timestamp: number }>();
const LOCAL_CACHE_MS = 30000;

function invalidateBudgetsCache(): void {
  for (const key of localCache.keys()) {
    if (key.startsWith("GET:budgets")) {
      localCache.delete(key);
    }
  }
  for (const key of inFlight.keys()) {
    if (key.startsWith("GET:budgets")) {
      inFlight.delete(key);
    }
  }
}

export async function getBudgets(
  token: string,
  params?: {
    status?: "DRAFT" | "SENT" | "SIGNED";
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<BudgetListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.startDate) sp.set("startDate", params.startDate);
  if (params?.endDate) sp.set("endDate", params.endDate);
  const q = sp.toString();
  const path = `${BUDGETS}${q ? `?${q}` : ""}`;
  const key = `GET:${path}`;

  const cached = localCache.get(key);
  if (cached && Date.now() - cached.timestamp < LOCAL_CACHE_MS) {
    return cached.data as BudgetListResponse;
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<BudgetListResponse>;
  }
  const req = apiGet<BudgetListResponse>(path, token)
    .then((data) => {
      localCache.set(key, { data, timestamp: Date.now() });
      return data;
    });
  inFlight.set(key, req);
  req.finally(() => inFlight.delete(key));
  return req;
}

export async function getBudgetCards(
  token: string,
  params?: { status?: "DRAFT" | "SENT" | "SIGNED"; page?: number; limit?: number }
): Promise<BudgetCardListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const path = `${BUDGETS}/cards${q ? `?${q}` : ""}`;
  const key = `GET:${path}`;

  const cached = localCache.get(key);
  if (cached && Date.now() - cached.timestamp < LOCAL_CACHE_MS) {
    return cached.data as BudgetCardListResponse;
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<BudgetCardListResponse>;
  }

  const req = apiGet<BudgetCardListResponse>(path, token).then((data) => {
    localCache.set(key, { data, timestamp: Date.now() });
    return data;
  });

  inFlight.set(key, req);
  req.finally(() => inFlight.delete(key));
  return req;
}

export async function getBudget(id: string, token: string): Promise<Budget> {
  return apiGet<Budget>(`${BUDGETS}/${id}`, token);
}

export async function createBudget(
  body: CreateBudgetBody,
  token: string
): Promise<Budget> {
  const created = await apiPost<Budget>(BUDGETS, body, token);
  invalidateBudgetsCache();
  return created;
}

export async function deleteBudget(id: string, token: string): Promise<void> {
  await apiDelete(`${BUDGETS}/${id}`, token);
  invalidateBudgetsCache();
}

export async function generatePdf(id: string, token: string): Promise<Budget> {
  const updated = await apiPost<Budget>(`${BUDGETS}/${id}/generate-pdf`, {}, token);
  invalidateBudgetsCache();
  return updated;
}

export async function updateBudgetExecuted(
  id: string,
  executed: boolean,
  token: string
): Promise<Budget> {
  const updated = await apiPost<Budget>(`${BUDGETS}/${id}/executed`, { executed }, token);
  invalidateBudgetsCache();
  return updated;
}

export async function updateBudgetSchedule(
  id: string,
  body: { serviceScheduledAt: string | null },
  token: string
): Promise<Budget> {
  const updated = await apiPost<Budget>(`${BUDGETS}/${id}/schedule`, body, token);
  invalidateBudgetsCache();
  return updated;
}

export async function getPublicBudget(id: string): Promise<PublicBudgetView> {
  return apiGet<PublicBudgetView>(`${PUBLIC_BUDGET}/${id}`);
}

export async function signBudget(
  id: string,
  body: SignBudgetBody
): Promise<PublicBudgetView> {
  return apiPost<PublicBudgetView>(`${PUBLIC_BUDGET}/${id}/sign`, body);
}

export async function getNotificationsSummary(
  token: string
): Promise<NotificationsSummaryResponse> {
  return apiGet<NotificationsSummaryResponse>(`${BUDGETS}/notifications`, token, false);
}

export async function getDashboardSummary(
  token: string,
  params: { startDate: string; endDate: string }
): Promise<DashboardSummaryResponse> {
  const sp = new URLSearchParams();
  sp.set("startDate", params.startDate);
  sp.set("endDate", params.endDate);
  return apiGet<DashboardSummaryResponse>(`${BUDGETS}/dashboard-summary?${sp.toString()}`, token);
}

export async function markNotificationsSeen(token: string): Promise<void> {
  await apiPost<void>(`${BUDGETS}/notifications/seen`, {}, token);
  invalidateBudgetsCache();
}

export async function getBudgetPreviewHtml(
  body: BudgetPreviewHtmlBody
): Promise<BudgetPreviewHtmlResponse> {
  return apiPost<BudgetPreviewHtmlResponse>("public/layouts/preview-html", body);
}
