export interface ClientDto {
  id: string;
  full_name: string;
  document_number: string | null;
  phone: string | null;
  alternative_phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface ClientListDto {
  items: ClientDto[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

/**
 * Loan-derived metrics are returned by the backend as zeros until the loan
 * domain exists (Phase 6+); they must never be computed client-side.
 */
export interface ClientSummaryDto {
  client_id: string;
  active_loans: number;
  total_capital_lent: string;
  outstanding_capital: string;
  total_receivable: string;
  total_overdue: string;
}

export interface ReferenceDto {
  id: string;
  client_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  relationship: string | null;
  notes: string | null;
  is_active: boolean;
}
