import type { Database } from '@/types/database'

export type VehicleBrand = Database['public']['Tables']['vehicle_brands']['Row']
export type VehicleBrandInsert = Database['public']['Tables']['vehicle_brands']['Insert']

export type VehicleModel = Database['public']['Tables']['vehicle_models']['Row']
export type VehicleModelInsert = Database['public']['Tables']['vehicle_models']['Insert']

export type UserProfile = Database['public']['Tables']['users']['Row']
export type UserProfileUpdate = Database['public']['Tables']['users']['Update']
