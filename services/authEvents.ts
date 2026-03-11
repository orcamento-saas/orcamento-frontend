import { apiPost } from "@/lib/api";

export async function trackLoginEvent(token: string): Promise<void> {
  await apiPost<void>("auth/events/login", {}, token);
}

export async function trackLogoutEvent(token: string): Promise<void> {
  await apiPost<void>("auth/logout", {}, token);
}
