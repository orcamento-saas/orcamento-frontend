export type UserPlan = "FREE" | "PRO";

export interface AccountSummary {
  id: string;
  email: string;
  name?: string;
  plan: UserPlan;
  isAdmin: boolean;
  suspended: boolean;
}
