import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  addContribution,
  cancelTransaction,
  createCategory,
  createGoal,
  createTransaction,
  deactivateCategory,
  getCategories,
  getFinanceSummary,
  getGoals,
  getTransactions,
  type CategoryFilters,
  type CreateTransactionPayload,
  type TransactionFilters,
} from '@/features/finance/api';

// Query keys are centralized so mutations can invalidate precisely
// (API.md §88 — invalidate affected data after financial mutations).

export const financeKeys = {
  categories: (filters?: CategoryFilters) => ['categories', filters ?? {}] as const,
  transactions: (filters?: TransactionFilters) => ['transactions', filters ?? {}] as const,
  summary: () => ['finance-summary'] as const,
  goals: () => ['goals'] as const,
};

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: financeKeys.categories(filters),
    queryFn: () => getCategories(filters),
  });
}

export function useTransactions(filters: Omit<TransactionFilters, 'page'> = {}) {
  return useQuery({
    queryKey: financeKeys.transactions(filters),
    queryFn: () => getTransactions(filters),
  });
}

/** Paginated transaction list with "load more" support (API.md §55–56). */
export function useInfiniteTransactions(filters: Omit<TransactionFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters] as const,
    queryFn: ({ pageParam }) => getTransactions({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: financeKeys.summary(),
    queryFn: getFinanceSummary,
  });
}

export function useGoals() {
  return useQuery({ queryKey: financeKeys.goals(), queryFn: () => getGoals() });
}

function useInvalidateFinance() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['goals'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: invalidate,
  });
}

export function useDeactivateCategory() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: deactivateCategory,
    onSuccess: invalidate,
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => createTransaction(payload),
    onSuccess: invalidate,
  });
}

export function useCancelTransaction() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: cancelTransaction,
    onSuccess: invalidate,
  });
}

export function useCreateGoal() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: invalidate,
  });
}

export function useAddContribution() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      contribution_date,
    }: {
      goalId: string;
      amount: string;
      contribution_date: string;
    }) => addContribution(goalId, { amount, contribution_date }),
    onSuccess: invalidate,
  });
}
