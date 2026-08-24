import type { GoalDto } from '@/features/finance/types';

export interface FinanceOverviewDto {
  currency: string;
  balance: string;
  monthly_income: string;
  monthly_expenses: string;
}

export interface LoansOverviewDto {
  total_capital_lent: string;
  outstanding_capital: string;
  generated_interest: string;
  collected_interest: string;
  today_collections_expected: string;
  today_collections_pending: string;
  total_receivable: string;
  total_overdue: string;
}

export interface DashboardDto {
  business_date: string;
  finance: FinanceOverviewDto;
  loans: LoansOverviewDto;
  goals: GoalDto[];
}
