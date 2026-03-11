import { apiGet } from "@/lib/api";
import type { AccountSummary } from "@/types/account";

export async function getCurrentAccount(token: string): Promise<AccountSummary> {
  return apiGet<AccountSummary>("me", token, false);
}
