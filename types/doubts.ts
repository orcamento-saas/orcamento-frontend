export interface UserDoubtItem {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  answered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDoubtsListResponse {
  data: UserDoubtItem[];
  total: number;
}

export type AnsweredFilter = "ALL" | "ANSWERED" | "UNANSWERED";

export interface AdminDoubtsFilters {
  page?: number;
  limit?: number;
  search?: string;
  answered?: boolean;
  startDate?: string;
  endDate?: string;
}
