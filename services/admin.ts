import { apiGet, apiPatch } from "@/lib/api";
import type { UserPlan } from "@/types/account";
import type {
  AdminSystemEventsFilters,
  AdminSystemEventsListResponse,
  AdminUserListItem,
  AdminUsersFilters,
  AdminUsersListResponse,
} from "@/types/admin";

const ADMIN_USERS = "admin/users";
const ADMIN_EVENTS = "admin/events";

export async function listAdminUsers(
  token: string,
  filters: AdminUsersFilters = {}
): Promise<AdminUsersListResponse> {
  const searchParams = new URLSearchParams();

  if (filters.page != null) {
    searchParams.set("page", String(filters.page));
  }
  if (filters.limit != null) {
    searchParams.set("limit", String(filters.limit));
  }
  if (filters.search) {
    searchParams.set("search", filters.search);
  }
  if (filters.plan) {
    searchParams.set("plan", filters.plan);
  }
  if (typeof filters.suspended === "boolean") {
    searchParams.set("suspended", String(filters.suspended));
  }

  const query = searchParams.toString();
  return apiGet<AdminUsersListResponse>(
    `${ADMIN_USERS}${query ? `?${query}` : ""}`,
    token,
    false
  );
}

export async function updateAdminUserPlan(
  userId: string,
  plan: UserPlan,
  token: string,
  reason?: string
): Promise<AdminUserListItem> {
  return apiPatch<AdminUserListItem>(`${ADMIN_USERS}/${userId}/plan`, { plan, reason }, token);
}

export async function updateAdminUserSuspension(
  userId: string,
  suspended: boolean,
  token: string,
  reason?: string
): Promise<AdminUserListItem> {
  return apiPatch<AdminUserListItem>(
    `${ADMIN_USERS}/${userId}/suspension`,
    { suspended, reason },
    token
  );
}

export async function listAdminEvents(
  token: string,
  filters: AdminSystemEventsFilters = {}
): Promise<AdminSystemEventsListResponse> {
  const searchParams = new URLSearchParams();

  if (filters.page != null) {
    searchParams.set("page", String(filters.page));
  }
  if (filters.limit != null) {
    searchParams.set("limit", String(filters.limit));
  }
  if (filters.type) {
    searchParams.set("type", filters.type);
  }
  if (filters.severity) {
    searchParams.set("severity", filters.severity);
  }
  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  const query = searchParams.toString();
  return apiGet<AdminSystemEventsListResponse>(
    `${ADMIN_EVENTS}${query ? `?${query}` : ""}`,
    token,
    false
  );
}
