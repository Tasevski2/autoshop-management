import { supabase } from '@/lib/supabase'
import { toLocalDateStr } from '@/lib/dates'
import type { DashboardStats, InProgressService, UnpaidService } from './types'

function getToday() {
  return toLocalDateStr()
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = getToday()

  const [inProgress, unpaidResult, revenueResult, expensesResult] = await Promise.all([
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    supabase.rpc('get_total_unpaid'),
    supabase.rpc('get_today_revenue', { p_date: today }),
    supabase.rpc('get_today_expenses', { p_date: today }),
  ])

  if (inProgress.error) throw inProgress.error
  if (unpaidResult.error) throw unpaidResult.error
  if (revenueResult.error) throw revenueResult.error
  if (expensesResult.error) throw expensesResult.error

  return {
    inProgressCount: inProgress.count ?? 0,
    totalUnpaid: Number(unpaidResult.data ?? 0),
    todayRevenue: Number(revenueResult.data ?? 0),
    todayExpenses: Number(expensesResult.data ?? 0),
  }
}

export async function fetchInProgressServices(): Promise<InProgressService[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      id, service_date, notes,
      vehicles!services_vehicle_id_fkey (plate_number, brand, model, customers (full_name, phone))
    `)
    .eq('status', 'in_progress')
    .order('service_date', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const ids = data.map((s) => s.id)
  const { data: totals, error: tErr } = await supabase
    .from('service_totals')
    .select('service_id, service_total, total_paid, balance_due')
    .in('service_id', ids)
  if (tErr) throw tErr

  const totalsMap = new Map(totals.map((t) => [t.service_id!, t]))

  return data.map((s) => {
    const v = s.vehicles as { plate_number: string; brand: string; model: string | null; customers: { full_name: string; phone: string | null } | null } | null
    const t = totalsMap.get(s.id)

    return {
      id: s.id,
      service_date: s.service_date,
      notes: s.notes,
      service_total: t?.service_total ?? 0,
      total_paid: t?.total_paid ?? 0,
      balance_due: t?.balance_due ?? 0,
      vehicle: v ? {
        plate_number: v.plate_number,
        brand: v.brand,
        model: v.model,
        customer: v.customers ? { full_name: v.customers.full_name, phone: v.customers.phone } : null,
      } : null,
    }
  })
}

export async function fetchDueReminders() {
  const today = getToday()

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      vehicles (id, plate_number, brand, model, customers (id, full_name, phone))
    `)
    .eq('is_active', true)
    .lte('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchUnpaidServices(): Promise<UnpaidService[]> {
  const { data: totals, error: tErr } = await supabase
    .from('service_totals')
    .select('service_id, service_total, total_paid, balance_due')
    .gt('balance_due', 0)
    .limit(10)

  if (tErr) throw tErr
  if (!totals || totals.length === 0) return []

  const ids = totals.map((t) => t.service_id!)

  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id, service_date, status,
      vehicles!services_vehicle_id_fkey (plate_number, brand, model, customers (full_name))
    `)
    .in('id', ids)
    .order('service_date', { ascending: true })
    .limit(10)

  if (error) throw error
  if (!services) return []

  const totalsMap = new Map(totals.map((t) => [t.service_id!, t]))

  return services.map((s) => {
    const v = s.vehicles as { plate_number: string; brand: string; model: string | null; customers: { full_name: string } | null } | null
    const t = totalsMap.get(s.id)
    return {
      id: s.id,
      service_date: s.service_date,
      status: s.status,
      service_total: t?.service_total ?? 0,
      total_paid: t?.total_paid ?? 0,
      balance_due: t?.balance_due ?? 0,
      vehicle: v ? {
        plate_number: v.plate_number,
        brand: v.brand,
        model: v.model,
        customer: v.customers ? { full_name: v.customers.full_name } : null,
      } : null,
    }
  })
}
