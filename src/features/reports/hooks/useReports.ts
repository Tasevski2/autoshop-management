import { useQuery } from '@tanstack/react-query'
import {
  fetchFinancialSummary,
  fetchRevenueByBucket,
  fetchExpensesByCategory,
  fetchPaymentsByMethod,
  fetchDailyBreakdown,
  fetchWeekdayRevenue,
  fetchCustomerSummary,
  fetchCustomerRankings,
  fetchServicesSummary,
  fetchBrandDistribution,
  fetchYearDistribution,
  fetchWeekdayUtilization,
  fetchPartRankings,
} from '../api'
import type { CustomerSortColumn, PartSortColumn, SortDirection } from '../types'
import { REPORTS_STALE_MS } from '../constants'
import { QUERY_KEYS } from '@/lib/query-keys'
import { PAGE_SIZE } from '@/lib/constants'

// ─── Financial Tab hooks ──────────────────────────────────────

export function useFinancialSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.financialSummary(dateFrom, dateTo),
    queryFn: () => fetchFinancialSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useRevenueByBucket(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.revenueByBucket(dateFrom, dateTo),
    queryFn: () => fetchRevenueByBucket(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useExpensesByCategory(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.expensesByCategory(dateFrom, dateTo),
    queryFn: () => fetchExpensesByCategory(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function usePaymentsByMethod(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.paymentsByMethod(dateFrom, dateTo),
    queryFn: () => fetchPaymentsByMethod(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useDailyBreakdown(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.dailyBreakdown(dateFrom, dateTo),
    queryFn: () => fetchDailyBreakdown(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

// ─── Weekday Revenue ─────────────────────────────────────────

export function useWeekdayRevenue(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.weekdayRevenue(dateFrom, dateTo),
    queryFn: () => fetchWeekdayRevenue(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

// ─── Customers Tab hooks ──────────────────────────────────────

export function useCustomerSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.customerSummary(dateFrom, dateTo),
    queryFn: () => fetchCustomerSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useCustomerRankings(
  dateFrom: string,
  dateTo: string,
  sortColumn: CustomerSortColumn,
  sortDirection: SortDirection,
  page: number,
  pageSize: number = PAGE_SIZE
) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.customerRankings(dateFrom, dateTo, sortColumn, sortDirection, page, pageSize),
    queryFn: () => fetchCustomerRankings({ dateFrom, dateTo, sortColumn, sortDirection, page, pageSize }),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

// ─── Services Tab hooks ──────────────────────────────────────

export function useServicesSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.servicesSummary(dateFrom, dateTo),
    queryFn: () => fetchServicesSummary(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useBrandDistribution(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.brandDistribution(dateFrom, dateTo),
    queryFn: () => fetchBrandDistribution(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useYearDistribution(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.yearDistribution(dateFrom, dateTo),
    queryFn: () => fetchYearDistribution(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useWeekdayUtilization(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.weekdayUtilization(dateFrom, dateTo),
    queryFn: () => fetchWeekdayUtilization(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

// ─── Part rankings (server-side sorted & paginated) ──────────

export function usePartRankings(
  dateFrom: string,
  dateTo: string,
  sortColumn: PartSortColumn,
  sortDirection: SortDirection,
  page: number,
  pageSize: number = PAGE_SIZE
) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.partRankings(dateFrom, dateTo, sortColumn, sortDirection, page, pageSize),
    queryFn: () => fetchPartRankings({ dateFrom, dateTo, sortColumn, sortDirection, page, pageSize }),
    enabled: !!dateFrom && !!dateTo,
    staleTime: REPORTS_STALE_MS,
    placeholderData: (prev) => prev,
  })
}
