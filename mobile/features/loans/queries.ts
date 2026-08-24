import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelLoan,
  createLoan,
  getLoan,
  getLoanSchedule,
  getLoans,
  getPayments,
  registerPayment,
  reversePayment,
  type CreateLoanPayload,
  type LoanFilters,
  type RegisterPaymentPayload,
} from '@/features/loans/api';
import { randomUUID } from '@/utils/uuid';

export const loanKeys = {
  list: (filters: Omit<LoanFilters, 'page'>) => ['loans', 'list', filters] as const,
  detail: (loanId: string) => ['loans', 'detail', loanId] as const,
  schedule: (loanId: string) => ['loans', 'schedule', loanId] as const,
};

export function useLoans(filters: Omit<LoanFilters, 'page'> = {}) {
  return useQuery({ queryKey: loanKeys.list(filters), queryFn: () => getLoans(filters) });
}

export function useInfiniteLoans(filters: Omit<LoanFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['loans', 'infinite', filters] as const,
    queryFn: ({ pageParam }) => getLoans({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useLoan(loanId: string) {
  return useQuery({
    queryKey: loanKeys.detail(loanId),
    queryFn: () => getLoan(loanId),
    enabled: loanId.length > 0,
  });
}

export function useLoanSchedule(loanId: string) {
  return useQuery({
    queryKey: loanKeys.schedule(loanId),
    queryFn: () => getLoanSchedule(loanId),
    enabled: loanId.length > 0,
  });
}

function useInvalidateLoans() {
  const queryClient = useQueryClient();
  return (loanId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['loans'] });
    if (loanId) {
      void queryClient.invalidateQueries({ queryKey: loanKeys.schedule(loanId) });
    }
  };
}

export function useCreateLoan() {
  const invalidate = useInvalidateLoans();
  return useMutation({
    mutationFn: (payload: CreateLoanPayload) => createLoan(payload),
    onSuccess: () => invalidate(),
  });
}

export function usePayments(loanId: string) {
  return useQuery({
    queryKey: ['payments', loanId] as const,
    queryFn: () => getPayments(loanId),
    enabled: loanId.length > 0,
  });
}

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: string; payload: RegisterPaymentPayload }) =>
      registerPayment(loanId, payload, randomUUID()),
    // Financial mutation: invalidate everything the backend recalculated
    // (API.md SS88). The authoritative result comes back in the response.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReversePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, paymentId, reason }: { loanId: string; paymentId: string; reason: string }) =>
      reversePayment(loanId, paymentId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelLoan() {
  const invalidate = useInvalidateLoans();
  return useMutation({
    mutationFn: cancelLoan,
    onSuccess: (_loan, loanId) => invalidate(loanId),
  });
}
