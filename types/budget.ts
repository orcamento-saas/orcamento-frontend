export type BudgetStatus = "DRAFT" | "SENT" | "SIGNED";

export interface BudgetItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface BudgetCard {
  id: string;
  title: string;
  value: number;
  status: BudgetStatus;
  executed: boolean;
  executedAt: string | null;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  signedAt: string | null;
  createdAt: string;
  documentDate: string | null;
  clientName: string | null;
  /** ISO 8601 — data/hora agendada para execução do serviço */
  serviceScheduledAt: string | null;
}

export interface Budget {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  value: number;
  status: BudgetStatus;
  executed: boolean;
  executedAt?: string | null;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  createdAt: string;
  companyLogoUrl?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyCnpj?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  documentDate?: string | null;
  validityDate?: string | null;
  validityDays?: number | null;
  observation?: string | null;
  items?: BudgetItem[] | null;
  fontColor?: string | null;
  backgroundColor?: string | null;
  gridColor?: string | null;
  templateId?: string | null;
  /** ISO 8601 — agendamento da execução do serviço */
  serviceScheduledAt?: string | null;
}

export interface PublicBudgetView {
  id: string;
  title: string;
  description: string | null;
  value: number;
  status: BudgetStatus;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  createdAt: string;
  documentDate?: string | null;
  clientName?: string | null;
  fontColor?: string | null;
  backgroundColor?: string | null;
  gridColor?: string | null;
  templateId?: string | null;
}

export interface CreateBudgetBody {
  title: string;
  description?: string;
  value: number;
  companyLogoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCnpj?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  documentDate?: string;
  validityDays?: number;
  validityDate?: string;
  observation?: string;
  items?: BudgetItem[];
  fontColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  templateId?: string;
}

export interface BudgetPreviewHtmlBody {
  title?: string;
  description?: string;
  value?: number;
  companyLogoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCnpj?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  documentDate?: string;
  validityDays?: number;
  validityDate?: string;
  observation?: string;
  items?: BudgetItem[];
  fontColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  templateId?: string;
}

export interface BudgetPreviewHtmlResponse {
  html: string;
}

export interface SignBudgetBody {
  clientName: string;
  clientEmail?: string;
  signatureImageBase64: string;
}

export interface BudgetListResponse {
  data: Budget[];
  total: number;
}

export interface BudgetCardListResponse {
  data: BudgetCard[];
  total: number;
}

export interface NotificationItem {
  budgetId: string;
  title: string;
  clientName: string | null;
  value: number;
  signedPdfUrl: string | null;
  signedAt: string;
}

export interface NotificationsSummaryResponse {
  unseenCount: number;
  items: NotificationItem[];
}
