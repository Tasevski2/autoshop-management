import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import type { CustomerInsert, CustomerUpdate } from './types'
import { PAGE_SIZE, DETAIL_PAGE_SIZE } from '@/lib/constants'

export async function fetchCustomers({
  page = 0,
  search,
}: {
  page?: number
  search?: string
} = {}) {
  let query = supabase
    .from('customers')
    .select(`
      *,
      vehicles (id)
    `, { count: 'exact' })

  const trimmed = search?.trim()
  if (trimmed && trimmed.length >= 2) {
    const safe = sanitizeFilterValue(trimmed)
    query = query.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('full_name')
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

export async function fetchCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchCustomerVehicles(customerId: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      last_service:services!last_service_id (service_date)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}


export async function fetchCustomerServices(customerId: string, { page = 0 }: { page?: number } = {}) {
  const { data: vehicles, error: vError } = await supabase
    .from('vehicles')
    .select('id')
    .eq('customer_id', customerId)
  if (vError) throw vError

  const vehicleIds = vehicles.map((v) => v.id)
  if (vehicleIds.length === 0) return { data: [], count: 0, page, pageSize: DETAIL_PAGE_SIZE, totalPages: 0 }

  const from = page * DETAIL_PAGE_SIZE
  const to = from + DETAIL_PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('services')
    .select(`
      *,
      vehicles!services_vehicle_id_fkey (plate_number, brand, model)
    `, { count: 'exact' })
    .in('vehicle_id', vehicleIds)
    .order('service_date', { ascending: false })
    .range(from, to)
  if (error) throw error

  const serviceIds = (data ?? []).map((s) => s.id)
  let totalsMap = new Map<string, { service_total: number | null; balance_due: number | null }>()
  if (serviceIds.length > 0) {
    const { data: totals, error: tErr } = await supabase
      .from('service_totals')
      .select('service_id, service_total, balance_due')
      .in('service_id', serviceIds)
    if (tErr) throw tErr
    totalsMap = new Map(totals.map((t) => [t.service_id!, t]))
  }

  return {
    data: (data ?? []).map((s) => ({
      ...s,
      service_total: totalsMap.get(s.id)?.service_total ?? null,
      balance_due: totalsMap.get(s.id)?.balance_due ?? null,
    })),
    count: count ?? 0,
    page,
    pageSize: DETAIL_PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / DETAIL_PAGE_SIZE),
  }
}

export async function createCustomer(customer: Omit<CustomerInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomer(id: string, updates: CustomerUpdate) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  if (error) throw error
}
