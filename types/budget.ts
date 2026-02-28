export type BudgetStatus = "DRAFT" | "SENT" | "SIGNED";

export interface Budget {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  templateType: string;
  value: number;
  status: BudgetStatus;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  createdAt: string;
}

export interface PublicBudgetView {
  id: string;
  title: string;
  description: string | null;
  templateType: string;
  value: number;
  status: BudgetStatus;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  createdAt: string;
}

export interface CreateBudgetBody {
  title: string;
  description?: string;
  templateType: string;
  value: number;
}

export interface SignBudgetBody {
  clientName: string;
  clientEmail: string;
  signatureImageBase64: string;
}

export interface BudgetListResponse {
  data: Budget[];
  total: number;
}
