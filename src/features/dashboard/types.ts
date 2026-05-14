export interface DashboardStats {
  inProgressCount: number
  totalUnpaid: number
  todayRevenue: number
  todayExpenses: number
}

export interface InProgressService {
  id: string
  service_date: string
  notes: string | null
  service_total: number
  total_paid: number
  balance_due: number
  vehicle: {
    plate_number: string
    brand: string
    model: string | null
    customer: {
      full_name: string
      phone: string | null
    } | null
  } | null
}

import type { ServiceStatus } from '@/lib/enums'

export interface UnpaidService {
  id: string
  service_date: string
  status: ServiceStatus
  service_total: number
  total_paid: number
  balance_due: number
  vehicle: {
    plate_number: string
    brand: string
    model: string | null
    customer: {
      full_name: string
    } | null
  } | null
}

export interface DueReminder {
  id: string
  due_date: string
  note: string | null
  vehicles: {
    id: string
    plate_number: string
    brand: string
    model: string | null
    customers: {
      id: string
      full_name: string
      phone: string | null
    } | null
  } | null
}
