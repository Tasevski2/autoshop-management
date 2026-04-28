import type { PostgrestError } from '@supabase/supabase-js'

const PAGE_SIZE = 1000
const BATCH_SIZE = 500

type SupabaseResult<T> = { data: T[] | null; error: PostgrestError | null }

/**
 * Fetch all rows from a Supabase query by paginating through results.
 * Avoids the default 1000-row cap.
 *
 * Usage:
 *   const data = await fetchAllRows<MyType>((range) =>
 *     supabase.from('table').select('*').gte('date', from).range(range.from, range.to)
 *   )
 */
export async function fetchAllRows<T>(
  queryFn: (range: { from: number; to: number }) => PromiseLike<SupabaseResult<T>>
): Promise<T[]> {
  const allData: T[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await queryFn({ from: offset, to: offset + PAGE_SIZE - 1 })
    if (error) throw error
    if (!data || data.length === 0) break
    allData.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return allData
}

/**
 * Batch a .in() query to avoid Supabase's row limit and URL length issues.
 * Splits IDs into chunks and merges all results.
 *
 * Usage:
 *   const data = await fetchInBatches<MyType>(serviceIds, (batch) =>
 *     supabase.from('service_totals').select('*').in('service_id', batch)
 *   )
 */
export async function fetchInBatches<T>(
  ids: string[],
  queryFn: (batch: string[]) => PromiseLike<SupabaseResult<T>>
): Promise<T[]> {
  if (ids.length === 0) return []
  const allData: T[] = []
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    const { data, error } = await queryFn(batch)
    if (error) throw error
    if (data) allData.push(...data)
  }
  return allData
}
