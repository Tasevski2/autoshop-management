import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import type { PartsCatalogInsert, PartsCatalogUpdate } from './types'
import { PAGE_SIZE } from '@/lib/constants'

export async function fetchParts({
  page = 0,
  search,
}: {
  page?: number
  search?: string
}) {
  let query = supabase
    .from('parts_catalog')
    .select('*', { count: 'exact' })
    .order('name')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (search) {
    query = query.ilike('name', `%${sanitizeFilterValue(search)}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export async function createPart(part: PartsCatalogInsert) {
  const { data, error } = await supabase
    .from('parts_catalog')
    .insert(part)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePart(id: string, updates: PartsCatalogUpdate) {
  const { data, error } = await supabase
    .from('parts_catalog')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePart(id: string) {
  const { error } = await supabase
    .from('parts_catalog')
    .delete()
    .eq('id', id)
  if (error) throw error
}
