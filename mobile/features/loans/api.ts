import { apiRequest } from '@/services/api/client';
import type {
  LoanDto,
  LoanListDto,
  LoanScheduleDto,
  PaymentDto,
  PaymentListDto,
} from '@/features/loans/types';

export interface LoanFilters {
  status?: string;
  client_id?: string;
  page?: number;
  page_size?: number;
}

export function getLoans(filters: LoanFilters = {}): Promise<LoanListDto> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.client_id) params.set('client_id', filters.client_id);
  params.set('page', String(filters.page ?? 1));
  params.set('page_size', String(filters.page_size ?? 20));

  return apiRequest<LoanListDto>(`/loans?${params.toString()}`);
}

export interface CreateLoanPayload {
  client_id: string;
  principal: string;
  start_date: string;
  interest_rate: string;
  interest_period: string;
  amortization_type: 'FIXED_PRINCIPAL' | 'FRENCH';
  payment_frequency: string;
  number_of_installments: number;
  first_due_date: string;
  late_fee_configuration?: {
    enabled: boolean;
    type?: string;
    value?: string;
    grace_period_days?: number;
  } | null;
}

export function createLoan(payload: CreateLoanPayload): Promise<LoanDto> {
  return apiRequest<LoanDto>('/loans', { method: 'POST', body: payload });
}

export function getLoan(loanId: string): Promise<LoanDto> {
  return apiRequest<LoanDto>(`/loans/${loanId}`);
}

export function getLoanSchedule(loanId: string): Promise<LoanScheduleDto> {
  return apiRequest<LoanScheduleDto>(`/loans/${loanId}/schedule`);
}

export function cancelLoan(loanId: string): Promise<LoanDto> {
  return apiRequest<LoanDto>(`/loans/${loanId}/cancel`, { method: 'POST' });
}

// ---------- Payments (Phase 7) ----------

export interface RegisterPaymentPayload {
  amount: string;
  payment_date: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
  reference?: string | null;
  notes?: string | null;
}

export function registerPayment(
  loanId: string,
  payload: RegisterPaymentPayload,
  idempotencyKey?: string,
): Promise<PaymentDto> {
  return apiRequest<PaymentDto>(`/loans/${loanId}/payments`, {
    method: 'POST',
    body: payload,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function getPayments(
  loanId: string,
  page = 1,
  pageSize = 20,
): Promise<PaymentListDto> {
  return apiRequest<PaymentListDto>(
    `/loans/${loanId}/payments?page=${page}&page_size=${pageSize}`,
  );
}

export function reversePayment(
  loanId: string,
  paymentId: string,
  reason: string,
): Promise<PaymentDto> {
  return apiRequest<PaymentDto>(`/loans/${loanId}/payments/${paymentId}/reverse`, {
    method: 'POST',
    body: { reason },
  });
}
