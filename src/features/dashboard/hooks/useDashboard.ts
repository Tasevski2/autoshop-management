import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchInProgressServices,
  fetchDueReminders,
  fetchUnpaidServices,
} from '../api'
import { QUERY_KEYS } from '@/lib/query-keys'
import { DASHBOARD_REFETCH_MS } from '@/lib/constants'

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: fetchDashboardStats,
    refetchInterval: DASHBOARD_REFETCH_MS,
  })
}

export function useInProgressServices() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.inProgress,
    queryFn: fetchInProgressServices,
    refetchInterval: DASHBOARD_REFETCH_MS,
  })
}

export function useDueReminders() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.reminders,
    queryFn: fetchDueReminders,
    refetchInterval: DASHBOARD_REFETCH_MS,
  })
}

export function useUnpaidServices() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.unpaid,
    queryFn: fetchUnpaidServices,
    refetchInterval: DASHBOARD_REFETCH_MS,
  })
}
