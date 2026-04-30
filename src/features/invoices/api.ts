import { supabase } from '@/lib/supabase'
import type { InvoiceInsert } from './types'

const PAGE_SIZE = 20

export async function fetchInvoiceData(serviceId: string) {
  const [{ data: { user } }, serviceResult, partsResult, totalsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('services')
      .select(`
        *,
        vehicles!services_vehicle_id_fkey (
          id, plate_number, brand, model,
          customer_id,
          customers (id, full_name, phone, email, customer_type, address, city, tax_number)
        )
      `)
      .eq('id', serviceId)
      .single(),
    supabase
      .from('service_parts')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at'),
    supabase
      .from('service_totals')
      .select('*')
      .eq('service_id', serviceId)
      .maybeSingle(),
  ])

  if (!user) throw new Error('Not authenticated')
  if (serviceResult.error) throw serviceResult.error
  if (partsResult.error) throw partsResult.error

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profileError) throw profileError

  return {
    service: serviceResult.data,
    parts: partsResult.data ?? [],
    totals: totalsResult.data,
    profile,
  }
}

export async function fetchExistingInvoice(serviceId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('service_id', serviceId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getNextInvoiceNumber() {
  const { data, error } = await supabase.rpc('get_next_invoice_number')
  if (error) throw error
  return data as string
}

export async function consumeNextInvoiceNumber() {
  const { data, error } = await supabase.rpc('consume_next_invoice_number')
  if (error) throw error
  return data as string
}

export async function createInvoiceRecord(invoice: InvoiceInsert) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInvoiceRecord(id: string, updates: Partial<InvoiceInsert>) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInvoiceRecord(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchInvoices({
  page = 0,
  dateFrom,
  dateTo,
}: {
  page?: number
  dateFrom?: string
  dateTo?: string
} = {}) {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      services!invoices_service_id_fkey (
        id,
        service_date,
        labor_cost,
        vehicles!services_vehicle_id_fkey (
          plate_number, brand, model,
          customers (full_name)
        )
      )
    `, { count: 'exact' })

  if (dateFrom) query = query.gte('issued_at', dateFrom)
  if (dateTo) query = query.lte('issued_at', dateTo + 'T23:59:59')

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('issued_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Fetch service totals for all invoices
  const serviceIds = (data ?? []).map((inv) => (inv.services as { id: string })?.id).filter(Boolean)
  let totalsMap = new Map<string, number>()
  if (serviceIds.length > 0) {
    const { data: totals } = await supabase
      .from('service_totals')
      .select('service_id, service_total')
      .in('service_id', serviceIds)
    if (totals) {
      totalsMap = new Map(totals.map((t) => [t.service_id!, t.service_total ?? 0]))
    }
  }

  return {
    data: (data ?? []).map((inv) => ({
      ...inv,
      service_total: totalsMap.get((inv.services as { id: string })?.id) ?? null,
    })),
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}
