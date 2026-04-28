import type { Database } from '@/types/database'

export type PartsCatalog = Database['public']['Tables']['parts_catalog']['Row']
export type PartsCatalogInsert = Database['public']['Tables']['parts_catalog']['Insert']
export type PartsCatalogUpdate = Database['public']['Tables']['parts_catalog']['Update']
