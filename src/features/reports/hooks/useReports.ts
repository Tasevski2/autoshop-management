import { useQuery } from '@tanstack/react-query'
import {
  fetchFinancialSummary,
  fetchRevenueByBucket,
  fetchExpensesByCategory,
  fetchPaymentsByMethod,
  fetchDailyBreakdown,
  fetchRevenueTrend,
  fetchCustomerSummary,
  fetchCustomerRankings,
  fetchServicesSummary,
  fetchBrandDistribution,
  fetchYearDistribution,
  fetchWeekdayUtilization,
  fetchPartRankings,
} from '../api'
import type { CustomerSortColumn, PartSortColumn } from '../types'

const STALE_TIME = 2 * 60 * 1000 // 2 minutes — reports are analytical

// ─── Financial Tab hooks ──────────────────────────────────────

export function useFinancialSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'financial-summary', dateFrom, dateTo],
    queryFn: () => fetchFinancialSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useRevenueByBucket(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'revenue-by-bucket', dateFrom, dateTo],
    queryFn: () => fetchRevenueByBucket(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useExpensesByCategory(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'expenses-by-category', dateFrom, dateTo],
    queryFn: () => fetchExpensesByCategory(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function usePaymentsByMethod(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'payments-by-method', dateFrom, dateTo],
    queryFn: () => fetchPaymentsByMethod(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useDailyBreakdown(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'daily-breakdown', dateFrom, dateTo],
    queryFn: () => fetchDailyBreakdown(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

// ─── Revenue Trend ────────────────────────────────────────────

export function useRevenueTrend() {
  return useQuery({
    queryKey: ['reports', 'trend'],
    queryFn: fetchRevenueTrend,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Customers Tab hooks ──────────────────────────────────────

export function useCustomerSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'customer-summary', dateFrom, dateTo],
    queryFn: () => fetchCustomerSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useCustomerRankings(
  dateFrom: string,
  dateTo: string,
  sortColumn: CustomerSortColumn,
  sortDirection: 'asc' | 'desc',
  page: number,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['reports', 'customer-rankings', dateFrom, dateTo, sortColumn, sortDirection, page, pageSize],
    queryFn: () => fetchCustomerRankings({ dateFrom, dateTo, sortColumn, sortDirection, page, pageSize }),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

// ─── Services Tab hooks ──────────────────────────────────────

export function useServicesSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'services-summary', dateFrom, dateTo],
    queryFn: () => fetchServicesSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useBrandDistribution(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'brand-distribution', dateFrom, dateTo],
    queryFn: () => fetchBrandDistribution(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useYearDistribution(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'year-distribution', dateFrom, dateTo],
    queryFn: () => fetchYearDistribution(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

export function useWeekdayUtilization(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'weekday-utilization', dateFrom, dateTo],
    queryFn: () => fetchWeekdayUtilization(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}

// ─── Part rankings (server-side sorted & paginated) ──────────

export function usePartRankings(
  dateFrom: string,
  dateTo: string,
  sortColumn: PartSortColumn,
  sortDirection: 'asc' | 'desc',
  page: number,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['reports', 'part-rankings', dateFrom, dateTo, sortColumn, sortDirection, page, pageSize],
    queryFn: () => fetchPartRankings({ dateFrom, dateTo, sortColumn, sortDirection, page, pageSize }),
    enabled: !!dateFrom && !!dateTo,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  })
}
