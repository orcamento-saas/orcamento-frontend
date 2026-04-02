import type { UserPlan } from "@/types/account";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  plan: UserPlan;
  isAdmin: boolean;
  suspended: boolean;
  suspendedReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  budgetsCount: number;
}

export interface AdminUsersListResponse {
  data: AdminUserListItem[];
  total: number;
}

export interface AdminUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  plan?: UserPlan;
  suspended?: boolean;
}

export type SystemEventType =
  | "LOGIN_SUCCESS"
  | "LOGOUT_SUCCESS"
  | "BUDGET_CREATED"
  | "BUDGET_SIGNED"
  | "ADMIN_USER_PLAN_UPDATED"
  | "ADMIN_USER_SUSPENDED"
  | "ADMIN_USER_UNSUSPENDED"
  | "SYSTEM_ERROR"
  | "ASAAS_BILLING_WEBHOOK"
  | "USER_PRO_SUBSCRIPTION_CANCELLED";

export type SystemEventSeverity = "INFO" | "WARN" | "ERROR";

export interface AdminSystemEventItem {
  id: string;
  type: SystemEventType;
  severity: SystemEventSeverity;
  actorUserId: string | null;
  targetUserId: string | null;
  budgetId: string | null;
  route: string | null;
  method: string | null;
  statusCode: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  message: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export interface AdminSystemEventsListResponse {
  data: AdminSystemEventItem[];
  total: number;
}

export interface AdminSystemEventsFilters {
  page?: number;
  limit?: number;
  type?: SystemEventType;
  severity?: SystemEventSeverity;
  search?: string;
}
