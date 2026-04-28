import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchInProgressServices,
  fetchDueReminders,
  fetchUnpaidServices,
} from '../api'

const REFETCH_INTERVAL = 5 * 60 * 1000

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useInProgressServices() {
  return useQuery({
    queryKey: ['dashboard', 'in-progress'],
    queryFn: fetchInProgressServices,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useDueReminders() {
  return useQuery({
    queryKey: ['dashboard', 'reminders'],
    queryFn: fetchDueReminders,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useUnpaidServices() {
  return useQuery({
    queryKey: ['dashboard', 'unpaid'],
    queryFn: fetchUnpaidServices,
    refetchInterval: REFETCH_INTERVAL,
  })
}
