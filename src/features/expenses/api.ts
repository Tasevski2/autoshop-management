import { supabase } from '@/lib/supabase'
import type { ExpenseInsert, ExpenseUpdate, ExpenseCategory } from './types'
import { PAGE_SIZE } from '@/lib/constants'

export async function fetchExpenses({
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
  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' })

  if (category) {
    query = query.eq('category', category)
  }
  if (dateFrom) {
    query = query.gte('expense_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('expense_date', dateTo)
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('expense_date', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export async function fetchExpenseTotals({
  category,
  dateFrom,
  dateTo,
}: {
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
} = {}) {
  const { data, error } = await supabase.rpc('get_expense_totals', {
    p_category: category,
    p_date_from: dateFrom,
    p_date_to: dateTo,
  })

  if (error) throw error

  const byCategory = new Map<string, number>()
  let total = 0
  for (const row of data ?? []) {
    const amount = Number(row.total)
    total += amount
    byCategory.set(row.category, amount)
  }

  return { total, byCategory }
}

export async function fetchExpense(id: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createExpense(expense: ExpenseInsert) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, updates: ExpenseUpdate) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  if (error) throw error
}
