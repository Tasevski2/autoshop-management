import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExpenses,
  fetchExpenseTotals,
  fetchExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/features/expenses/api'
import type { ExpenseInsert, ExpenseUpdate, ExpenseCategory } from '@/features/expenses/types'

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
    queryKey: ['expenses', 'list', { page, category, dateFrom, dateTo }],
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
    queryKey: ['expenses', 'totals', { category, dateFrom, dateTo }],
    queryFn: () => fetchExpenseTotals({ category, dateFrom, dateTo }),
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expenses', 'detail', id],
    queryFn: () => fetchExpense(id!),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseInsert) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ExpenseUpdate }) =>
      updateExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
