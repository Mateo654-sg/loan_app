import { apiRequest } from '@/services/api/client';
import type {
  CategoryDto,
  ContributionDto,
  FinanceSummaryDto,
  GoalDto,
  TransactionDto,
  TransactionListDto,
} from '@/features/finance/types';

// ---------- Categories ----------

export interface CategoryFilters {
  type?: 'INCOME' | 'EXPENSE';
  is_active?: boolean;
}

export function getCategories(filters: CategoryFilters = {}): Promise<CategoryDto[]> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
  const query = params.toString();

  return apiRequest<CategoryDto[]>(`/categories${query ? `?${query}` : ''}`);
}

export function createCategory(payload: { name: string; type: string }): Promise<CategoryDto> {
  return apiRequest<CategoryDto>('/categories', { method: 'POST', body: payload });
}

export function deactivateCategory(categoryId: string): Promise<CategoryDto> {
  return apiRequest<CategoryDto>(`/categories/${categoryId}/deactivate`, { method: 'POST' });
}

// ---------- Transactions ----------

export interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE';
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export function getTransactions(filters: TransactionFilters = {}): Promise<TransactionListDto> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  params.set('page', String(filters.page ?? 1));
  params.set('page_size', String(filters.page_size ?? 20));

  return apiRequest<TransactionListDto>(`/transactions?${params.toString()}`);
}

export interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  category_id: string;
  transaction_date: string;
  description?: string | null;
  payment_method?: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER' | null;
  notes?: string | null;
}

export function createTransaction(payload: CreateTransactionPayload): Promise<TransactionDto> {
  return apiRequest<TransactionDto>('/transactions', { method: 'POST', body: payload });
}

export function cancelTransaction(transactionId: string): Promise<TransactionDto> {
  return apiRequest<TransactionDto>(`/transactions/${transactionId}/cancel`, { method: 'POST' });
}

// ---------- Summary ----------

export function getFinanceSummary(): Promise<FinanceSummaryDto> {
  return apiRequest<FinanceSummaryDto>('/finance/summary');
}

// ---------- Goals ----------

export function getGoals(status?: string): Promise<GoalDto[]> {
  return apiRequest<GoalDto[]>(`/goals${status ? `?status=${status}` : ''}`);
}

export function createGoal(payload: {
  name: string;
  target_amount: string;
  target_date?: string | null;
}): Promise<GoalDto> {
  return apiRequest<GoalDto>('/goals', { method: 'POST', body: payload });
}

export function addContribution(
  goalId: string,
  payload: { amount: string; contribution_date: string; description?: string | null },
): Promise<ContributionDto> {
  return apiRequest<ContributionDto>(`/goals/${goalId}/contributions`, {
    method: 'POST',
    body: payload,
  });
}
