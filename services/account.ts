import { apiGet, apiPatch } from "@/lib/api";
import type { AccountSummary } from "@/types/account";

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
