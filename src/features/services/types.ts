import type { Database } from '@/types/database'

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export type ServicePart = Database['public']['Tables']['service_parts']['Row']
export type ServicePartInsert = Database['public']['Tables']['service_parts']['Insert']
export type ServicePartUpdate = Database['public']['Tables']['service_parts']['Update']

export type ServiceImage = Database['public']['Tables']['service_images']['Row']
export type ServiceImageInsert = Database['public']['Tables']['service_images']['Insert']

export type ServiceStatus = Database['public']['Enums']['service_status']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentMethod = Database['public']['Enums']['payment_method']

export type PartsCatalog = Database['public']['Tables']['parts_catalog']['Row']
