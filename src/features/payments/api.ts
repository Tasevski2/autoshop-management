import { supabase } from '@/lib/supabase'
import type { PaymentInsert } from './types'

const PAGE_SIZE = 20

export async function fetchPayments({
  page = 0,
  dateFrom,
  dateTo,
}: {
  page?: number
  dateFrom?: string
  dateTo?: string
} = {}) {
  let query = supabase
    .from('payments')
    .select(`
      *,
      services (
        id,
        service_date,
        status,
        vehicles!services_vehicle_id_fkey (plate_number, brand, model, customers (full_name))
      )
    `, { count: 'exact' })

  if (dateFrom) {
    query = query.gte('payment_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('payment_date', dateTo)
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('payment_date', { ascending: false })
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

export async function fetchVehicleServicesWithTotals(vehicleId: string) {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, service_date, status, notes')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })
  if (error) throw error

  const ids = services.map((s) => s.id)
  if (ids.length === 0) return []

  const { data: totals, error: tErr } = await supabase
    .from('service_totals')
    .select('service_id, service_total, balance_due, total_paid')
    .in('service_id', ids)
  if (tErr) throw tErr

  const totalsMap = new Map(totals.map((t) => [t.service_id!, t]))

  return services.map((s) => ({
    ...s,
    service_total: totalsMap.get(s.id)?.service_total ?? 0,
    balance_due: totalsMap.get(s.id)?.balance_due ?? 0,
    total_paid: totalsMap.get(s.id)?.total_paid ?? 0,
  }))
}

export async function createPayment(payment: PaymentInsert) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePayment(id: string) {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
  if (error) throw error
}
