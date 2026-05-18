import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  AdminDoubtsFilters,
  AdminDoubtsListResponse,
  UserDoubtItem,
} from "@/types/doubts";

const PUBLIC_DOUBTS = "public/doubts";
const DOUBTS = "doubts";
const ADMIN_DOUBTS = "admin/doubts";

export async function submitPublicDoubt(input: {
  name: string;
  email: string;
  message: string;
}): Promise<UserDoubtItem> {
  return apiPost<UserDoubtItem>(PUBLIC_DOUBTS, input);
}

export async function submitAuthenticatedDoubt(
  message: string,
  token: string
): Promise<UserDoubtItem> {
  return apiPost<UserDoubtItem>(DOUBTS, { message }, token);
}

export async function listAdminDoubts(
  token: string,
  filters: AdminDoubtsFilters = {}
): Promise<AdminDoubtsListResponse> {
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
  if (typeof filters.answered === "boolean") {
    searchParams.set("answered", String(filters.answered));
  }
  if (filters.startDate) {
    searchParams.set("startDate", filters.startDate);
  }
  if (filters.endDate) {
    searchParams.set("endDate", filters.endDate);
  }

  const query = searchParams.toString();
  return apiGet<AdminDoubtsListResponse>(
    `${ADMIN_DOUBTS}${query ? `?${query}` : ""}`,
    token,
    false
  );
}

export async function updateAdminDoubtAnswered(
  id: string,
  answered: boolean,
  token: string
): Promise<UserDoubtItem> {
  return apiPatch<UserDoubtItem>(`${ADMIN_DOUBTS}/${id}`, { answered }, token);
}

export async function deleteAdminDoubt(id: string, token: string): Promise<void> {
  return apiDelete(`${ADMIN_DOUBTS}/${id}`, token);
}

export async function deleteAdminDoubtsBulk(
  ids: string[],
  token: string
): Promise<{ deletedCount: number }> {
  return apiPost<{ deletedCount: number }>(`${ADMIN_DOUBTS}/delete-bulk`, { ids }, token);
}
