export interface LoanDto {
  id: string;
  client_id: string;
  client_name: string;
  principal: string;
  outstanding_principal: string;
  scheduled_interest: string;
  outstanding_interest: string;
  collected_interest: string;
  scheduled_late_fees: string;
  outstanding_late_fees: string;
  collected_late_fees: string;
  total_outstanding: string;
  interest_rate: string;
  interest_period: string;
  amortization_type: 'FIXED_PRINCIPAL' | 'FRENCH';
  payment_frequency: string;
  number_of_installments: number;
  first_due_date: string;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  guarantee: string | null;
  notes: string | null;
  created_at: string;
}

export interface LoanListDto {
  items: LoanDto[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface InstallmentDto {
  id: string;
  installment_number: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  late_fee_due: string;
  total_due: string;
  principal_paid: string;
  interest_paid: string;
  late_fee_paid: string;
  remaining_balance: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface LoanScheduleDto {
  loan_id: string;
  business_date: string;
  installments: InstallmentDto[];
}

export interface PaymentAllocationDto {
  late_fee: string;
  interest: string;
  principal: string;
  credit: string;
}

export interface PaymentDto {
  id: string;
  loan_id: string;
  client_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  status: 'POSTED' | 'REVERSED';
  allocation: PaymentAllocationDto;
  created_at: string;
}

export interface PaymentListDto {
  items: PaymentDto[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}
