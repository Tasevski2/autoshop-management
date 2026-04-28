import type { Database } from '@/types/database'

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentMethod = Database['public']['Enums']['payment_method']
