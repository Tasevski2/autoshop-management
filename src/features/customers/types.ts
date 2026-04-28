import type { Database } from '@/types/database'

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type ServiceStatus = Database['public']['Enums']['service_status']

export type VehicleWithLastService = Vehicle & {
  services: Pick<Service, 'service_date'>[]
}

export type ServiceWithVehicleAndTotals = Service & {
  vehicles: Pick<Vehicle, 'plate_number' | 'brand' | 'model'> | null
  service_totals: {
    service_total: number | null
    balance_due: number | null
  }[]
}
