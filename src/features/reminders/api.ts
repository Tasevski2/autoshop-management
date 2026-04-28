import { supabase } from '@/lib/supabase'
import type { ReminderUpdate } from './types'
import type { ReminderInsert } from '@/features/vehicles/types'

const PAGE_SIZE = 20

export async function fetchAllReminders({ active, page = 0 }: { active: boolean; page?: number }) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('reminders')
    .select(`
      *,
      vehicles (id, plate_number, brand, model, customer_id, customers (id, full_name, phone))
    `, { count: 'exact' })
    .eq('is_active', active)
    .order('due_date', { ascending: active })
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

export async function fetchReminder(id: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      vehicles (id, plate_number, brand, model)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createReminder(reminder: ReminderInsert) {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminder)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReminder(id: string, updates: ReminderUpdate) {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
