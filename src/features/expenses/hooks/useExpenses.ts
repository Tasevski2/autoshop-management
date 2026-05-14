import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchExpenses,
  fetchExpenseTotals,
  fetchExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/features/expenses/api'
import type { ExpenseInsert, ExpenseUpdate, ExpenseCategory } from '@/features/expenses/types'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useExpenses({
  page = 0,
  category,
  dateFrom,
  dateTo,
}: {
  page?: number
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.list({ page, category, dateFrom, dateTo }),
    queryFn: () => fetchExpenses({ page, category, dateFrom, dateTo }),
    placeholderData: (prev) => prev,
  })
}

export function useExpenseTotals({
  category,
  dateFrom,
  dateTo,
}: {
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.totals({ category, dateFrom, dateTo }),
    queryFn: () => fetchExpenseTotals({ category, dateFrom, dateTo }),
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.detail(id),
    queryFn: () => fetchExpense(id!),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: ExpenseInsert) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ExpenseUpdate }) =>
      updateExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
