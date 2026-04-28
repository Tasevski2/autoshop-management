import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import type { VehicleInsert, VehicleUpdate, ReminderInsert, ReminderUpdate } from './types'

const PAGE_SIZE = 20

export async function fetchVehicles({
  page = 0,
  search,
}: {
  page?: number
  search?: string
} = {}) {
  let query = supabase
    .from('vehicles')
    .select(`
      *,
      customers (full_name),
      last_service:services!last_service_id (service_date)
    `, { count: 'exact' })

  const trimmed = search?.trim()
  if (trimmed && trimmed.length >= 2) {
    const safe = sanitizeFilterValue(trimmed)
    query = query.or(`plate_number.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`)
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('plate_number')
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

export async function fetchVehicle(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      customers (id, full_name, phone)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

const DETAIL_PAGE_SIZE = 10

export async function fetchVehicleServices(vehicleId: string, { page = 0 }: { page?: number } = {}) {
  const from = page * DETAIL_PAGE_SIZE
  const to = from + DETAIL_PAGE_SIZE - 1

  const { data: services, error, count } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })
    .range(from, to)
  if (error) throw error

  const serviceIds = (services ?? []).map((s) => s.id)
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
    data: (services ?? []).map((s) => ({
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

export async function fetchVehicleReminders(vehicleId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true)
    .order('due_date')
  if (error) throw error
  return data
}

export async function fetchVehiclePhotos(vehicleId: string) {
  const { data, error } = await supabase
    .from('service_images')
    .select(`
      *,
      services!inner (service_date)
    `)
    .eq('services.vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVehicle(vehicle: VehicleInsert) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVehicle(id: string, updates: VehicleUpdate) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
  if (error) throw error
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

export async function fetchCustomerOptions(search: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .or(`full_name.ilike.%${sanitizeFilterValue(search)}%,phone.ilike.%${sanitizeFilterValue(search)}%`)
    .order('full_name')
    .limit(10)
  if (error) throw error
  return data
}
