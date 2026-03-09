import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type {
  Budget,
  PublicBudgetView,
  CreateBudgetBody,
  SignBudgetBody,
  BudgetListResponse,
} from "@/types/budget";

const BUDGETS = "budgets";
const PUBLIC_BUDGET = "public/budget";

export async function getBudgets(
  token: string,
  params?: { status?: "DRAFT" | "SENT" | "SIGNED"; page?: number; limit?: number }
): Promise<BudgetListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiGet<BudgetListResponse>(`${BUDGETS}${q ? `?${q}` : ""}`, token);
}

export async function getBudget(id: string, token: string): Promise<Budget> {
  return apiGet<Budget>(`${BUDGETS}/${id}`, token);
}

export async function createBudget(
  body: CreateBudgetBody,
  token: string
): Promise<Budget> {
  return apiPost<Budget>(BUDGETS, body, token);
}

export async function deleteBudget(id: string, token: string): Promise<void> {
  return apiDelete(`${BUDGETS}/${id}`, token);
}

export async function generatePdf(id: string, token: string): Promise<Budget> {
  return apiPost<Budget>(`${BUDGETS}/${id}/generate-pdf`, {}, token);
}

export async function updateBudgetExecuted(
  id: string,
  executed: boolean,
  token: string
): Promise<Budget> {
  return apiPost<Budget>(`${BUDGETS}/${id}/executed`, { executed }, token);
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
