import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 20

export async function fetchUndismissedNotifications({ page = 0 }: { page?: number } = {}) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
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

export async function dismissNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('id', id)
  if (error) throw error
}

export async function dismissAllNotifications() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('is_dismissed', false)
  if (error) throw error
}
