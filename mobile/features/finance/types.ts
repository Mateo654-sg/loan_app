export interface CategoryDto {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  is_active: boolean;
}

export interface PaginationMetaDto {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface TransactionDto {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  /** Backend-serialized monetary value, e.g. "85000.00" (never a float). */
  amount: string;
  category_id: string;
  transaction_date: string;
  description: string | null;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER' | null;
  notes: string | null;
  status: 'ACTIVE' | 'CANCELLED';
  created_at: string;
}

export interface TransactionListDto {
  items: TransactionDto[];
  pagination: PaginationMetaDto;
}

export interface FinanceSummaryDto {
  currency: string;
  total_income: string;
  total_expenses: string;
  balance: string;
}

export interface GoalDto {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  remaining_amount: string;
  progress_percent: number;
  target_date: string | null;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface ContributionDto {
  id: string;
  goal_id: string;
  amount: string;
  contribution_date: string;
  description: string | null;
  status: 'ACTIVE' | 'CANCELLED';
}
