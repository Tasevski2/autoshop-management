import type { Database } from '@/types/database'

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceStatus = Database['public']['Enums']['service_status']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']
export type ReminderUpdate = Database['public']['Tables']['reminders']['Update']
export type ServiceImage = Database['public']['Tables']['service_images']['Row']

export type Customer = Database['public']['Tables']['customers']['Row']
