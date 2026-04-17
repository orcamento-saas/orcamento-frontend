import { apiGet, apiPatch } from "@/lib/api";
import type {
  AccountSummary,
  GetBudgetProfileResponse,
  UpdateBudgetProfilePayload,
} from "@/types/account";

export async function getCurrentAccount(token: string): Promise<AccountSummary> {
  return apiGet<AccountSummary>("me", token, false);
}

export type UpdateProfilePayload = {
  name?: string;
  /** String vazia remove o telefone no backend. */
  phone?: string;
};

export async function updateProfile(
  token: string,
  body: UpdateProfilePayload
): Promise<AccountSummary> {
  return apiPatch<AccountSummary>("me", body, token);
}

export async function getBudgetProfile(token: string): Promise<GetBudgetProfileResponse> {
  return apiGet<GetBudgetProfileResponse>("me/budget-profile", token, false);
}

export async function updateBudgetProfile(
  token: string,
  body: UpdateBudgetProfilePayload
): Promise<GetBudgetProfileResponse> {
  return apiPatch<GetBudgetProfileResponse>("me/budget-profile", body, token);
}
