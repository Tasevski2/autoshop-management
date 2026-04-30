import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { compressImage } from '@/lib/image-compression'
import { ensureStorageSpace } from '@/lib/storage-manager'
import type { ServiceInsert, ServiceUpdate, ServicePartInsert, ServiceStatus, PaymentInsert } from './types'

const PAGE_SIZE = 20

export async function fetchServices({
  page = 0,
  search,
  status,
  dateFrom,
  dateTo,
}: {
  page?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  let query = supabase
    .from('services')
    .select(`
      *,
      vehicles!services_vehicle_id_fkey (plate_number, brand, model, customers (full_name))
    `, { count: 'exact' })

  if (status) {
    query = query.eq('status', status as ServiceStatus)
  }
  if (dateFrom) {
    query = query.gte('service_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('service_date', dateTo)
  }

  // Search on nested fields (plate, brand, model, customer name) by finding
  // matching vehicle IDs server-side first, then filtering the main query.
  const trimmed = search?.trim()
  if (trimmed && trimmed.length >= 2) {
    // Find vehicles matching by plate/brand/model
    const { data: vehicleMatches } = await supabase
      .from('vehicles')
      .select('id')
      .or(`plate_number.ilike.%${sanitizeFilterValue(trimmed)}%,brand.ilike.%${sanitizeFilterValue(trimmed)}%,model.ilike.%${sanitizeFilterValue(trimmed)}%`)

    // Find customers matching by name, then get their vehicle IDs
    const { data: customerMatches } = await supabase
      .from('customers')
      .select('vehicles(id)')
      .ilike('full_name', `%${sanitizeFilterValue(trimmed)}%`)

    const vehicleIds = new Set<string>()
    for (const v of vehicleMatches ?? []) vehicleIds.add(v.id)
    for (const c of customerMatches ?? []) {
      for (const v of (c.vehicles as { id: string }[]) ?? []) vehicleIds.add(v.id)
    }

    if (vehicleIds.size === 0) {
      return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }
    }
    query = query.in('vehicle_id', Array.from(vehicleIds))
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('service_date', { ascending: false })
    .range(from, to)

  if (error) throw error

  const filtered = data ?? []

  // Fetch totals for all services in this page
  const serviceIds = filtered.map((s) => s.id)
  let totalsMap = new Map<string, { service_total: number | null; balance_due: number | null }>()
  if (serviceIds.length > 0) {
    const { data: totals, error: tError } = await supabase
      .from('service_totals')
      .select('service_id, service_total, balance_due')
      .in('service_id', serviceIds)
    if (tError) throw tError
    totalsMap = new Map(totals.map((t) => [t.service_id!, t]))
  }

  return {
    data: filtered.map((s) => ({
      ...s,
      service_total: totalsMap.get(s.id)?.service_total ?? null,
      balance_due: totalsMap.get(s.id)?.balance_due ?? null,
    })),
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export async function fetchService(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      vehicles!services_vehicle_id_fkey (id, plate_number, brand, model, engine_capacity, engine_designation, customer_id, customers (id, full_name, phone))
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchServiceParts(serviceId: string) {
  const { data, error } = await supabase
    .from('service_parts')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function fetchServiceTotals(serviceId: string) {
  const { data, error } = await supabase
    .from('service_totals')
    .select('*')
    .eq('service_id', serviceId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchServiceImages(serviceId: string) {
  const { data, error } = await supabase
    .from('service_images')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createService(service: ServiceInsert) {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateService(id: string, updates: ServiceUpdate) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createServicePart(part: ServicePartInsert) {
  const { data, error } = await supabase
    .from('service_parts')
    .insert(part)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function bulkCreateServiceParts(parts: ServicePartInsert[]) {
  if (parts.length === 0) return []
  const { data, error } = await supabase
    .from('service_parts')
    .insert(parts)
    .select()
  if (error) throw error
  return data
}

export async function updateServicePart(id: string, updates: Partial<ServicePartInsert>) {
  const { data, error } = await supabase
    .from('service_parts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteServicePart(id: string) {
  const { error } = await supabase
    .from('service_parts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function replaceServiceParts(serviceId: string, parts: Omit<ServicePartInsert, 'service_id'>[]) {
  // Delete existing parts
  const { error: delError } = await supabase
    .from('service_parts')
    .delete()
    .eq('service_id', serviceId)
  if (delError) throw delError

  if (parts.length === 0) return []

  // Insert new parts
  const { data, error } = await supabase
    .from('service_parts')
    .insert(parts.map((p) => ({ ...p, service_id: serviceId })))
    .select()
  if (error) throw error
  return data
}

export async function uploadServiceImage(serviceId: string, file: File) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const compressed = await compressImage(file)
  await ensureStorageSpace(compressed.size)

  const ext = compressed.name.split('.').pop()
  const storagePath = `${user.id}/${serviceId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('service-images')
    .upload(storagePath, compressed)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('service_images')
    .insert({
      service_id: serviceId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: compressed.size,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteServiceImage(id: string, storagePath: string) {
  const { error: storageError } = await supabase.storage
    .from('service-images')
    .remove([storagePath])
  if (storageError) throw storageError

  const { error } = await supabase
    .from('service_images')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteService(id: string) {
  // Fetch image paths before CASCADE deletes the rows
  const { data: images } = await supabase
    .from('service_images')
    .select('storage_path')
    .eq('service_id', id)

  // Delete service first (CASCADE removes service_parts, service_images rows)
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
  if (error) throw error

  // Clean up storage files (best-effort — DB rows are already gone)
  if (images && images.length > 0) {
    await supabase.storage
      .from('service-images')
      .remove(images.map((img) => img.storage_path))
  }
}

export async function fetchServicePayments(serviceId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('service_id', serviceId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data
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

export async function fetchVehicleOptions(search: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, plate_number, brand, model, engine_capacity, engine_designation, customer_id, customers (full_name)')
    .or(`plate_number.ilike.%${sanitizeFilterValue(search)}%,brand.ilike.%${sanitizeFilterValue(search)}%,model.ilike.%${sanitizeFilterValue(search)}%`)
    .order('plate_number')
    .limit(10)
  if (error) throw error
  return data
}

export async function upsertCatalogParts(
  parts: { name: string; buy_price?: number; sell_price?: number; catalog_part_id?: string | null }[]
) {
  const newParts = parts.filter((p) => !p.catalog_part_id && p.name.trim())
  if (newParts.length === 0) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const names = newParts.map((p) => p.name.trim())
  const { data: existing } = await supabase
    .from('parts_catalog')
    .select('id, name, buy_price, sell_price')
    .in('name', names)

  const existingMap = new Map((existing ?? []).map((e) => [e.name, e]))

  const toInsert = newParts
    .filter((p) => !existingMap.has(p.name.trim()))
    .map((p) => ({
      name: p.name.trim(),
      buy_price: p.buy_price ?? 0,
      sell_price: p.sell_price ?? 0,
      user_id: user.id,
    }))

  const toUpdate = newParts
    .filter((p) => {
      const ex = existingMap.get(p.name.trim())
      if (!ex) return false
      return ex.buy_price !== (p.buy_price ?? 0) || ex.sell_price !== (p.sell_price ?? 0)
    })
    .map((p) => {
      const ex = existingMap.get(p.name.trim())!
      return { id: ex.id, buy_price: p.buy_price ?? 0, sell_price: p.sell_price ?? 0 }
    })

  await Promise.all([
    toInsert.length > 0 ? supabase.from('parts_catalog').insert(toInsert) : null,
    ...toUpdate.map((u) =>
      supabase.from('parts_catalog').update({ buy_price: u.buy_price, sell_price: u.sell_price }).eq('id', u.id)
    ),
  ])
}

export async function fetchPartOptions(search: string) {
  let query = supabase
    .from('parts_catalog')
    .select('id, name, buy_price, sell_price')
    .eq('is_active', true)
    .order('name')
    .limit(10)

  if (search) {
    query = query.ilike('name', `%${sanitizeFilterValue(search)}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
