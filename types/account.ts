export type UserPlan = "FREE" | "PRO";

export interface AccountSummary {
  id: string;
  email: string;
  name?: string;
  /** Telefone informado no cadastro (persistido no backend) */
  phone?: string | null;
  plan: UserPlan;
  isAdmin: boolean;
  suspended: boolean;
}
