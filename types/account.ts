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

export interface BudgetProfile {
  id: string;
  userId: string;
  companyLogoUrl: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyCnpj: string | null;
  validityDays: number | null;
  fontColor: string | null;
  backgroundColor: string | null;
  gridColor: string | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetBudgetProfileResponse {
  profile: BudgetProfile | null;
}

export interface UpdateBudgetProfilePayload {
  companyLogoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCnpj?: string;
  validityDays?: number;
  fontColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  templateId?: string;
}
