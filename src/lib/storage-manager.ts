import { supabase } from '@/lib/supabase'

const STORAGE_BUCKET = 'service-images'
const STORAGE_LIMIT_BYTES = 900 * 1024 * 1024 // 900MB

export async function ensureStorageSpace(requiredBytes: number): Promise<void> {
  const { data, error } = await supabase
    .from('service_images')
    .select('id, storage_path, file_size, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return

  let totalUsage = data.reduce((sum, img) => sum + (img.file_size ?? 0), 0)

  if (totalUsage + requiredBytes <= STORAGE_LIMIT_BYTES) return

  const toDelete: { id: string; storagePath: string }[] = []

  for (const img of data) {
    if (totalUsage + requiredBytes <= STORAGE_LIMIT_BYTES) break
    toDelete.push({ id: img.id, storagePath: img.storage_path })
    totalUsage -= img.file_size ?? 0
  }

  if (toDelete.length === 0) return

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(toDelete.map((d) => d.storagePath))
  if (storageError) throw storageError

  const { error: dbError } = await supabase
    .from('service_images')
    .delete()
    .in('id', toDelete.map((d) => d.id))
  if (dbError) throw dbError
}
