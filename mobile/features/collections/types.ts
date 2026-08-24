export interface CollectionItemDto {
  installment_id: string;
  loan_id: string;
  client_id: string;
  client_name: string;
  installment_number: number;
  due_date: string;
  days_overdue: number;
  classification: 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING' | 'PAID';
  installment_status: string;
  principal_outstanding: string;
  interest_outstanding: string;
  late_fee_projected: string;
  total_paid: string;
  total_outstanding: string;
}

export interface TodaySummaryDto {
  expected_today: string;
  collected_today: string;
  pending_today: string;
  overdue: string;
}

export interface TodayCollectionsDto {
  business_date: string;
  summary: TodaySummaryDto;
  items: CollectionItemDto[];
}

export type CollectionsFilter =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'OVERDUE'
  | 'UPCOMING'
  | 'ALL';

export interface CollectionsListDto {
  business_date: string;
  filter: CollectionsFilter;
  items: CollectionItemDto[];
}
