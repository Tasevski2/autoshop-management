import { supabase } from '@/lib/supabase'
import type {
  FinancialSummary,
  TimeBucketRevenue,
  ExpenseCategoryItem,
  PaymentMethodItem,
  DailyBreakdownRow,
  MonthlyTrendPoint,
  CustomerSummary,
  CustomerRankingRow,
  CustomerSortColumn,
  ServicesSummary,
  BrandCount,
  YearRangeCount,
  WeekdayAverage,
  PartRankingRow,
  PartSortColumn,
} from './types'
import { detectBucketType, getBucketLabel } from './utils'

// ─── Financial Tab RPCs ──────────────────────────────────────

export async function fetchFinancialSummary(
  dateFrom: string,
  dateTo: string
): Promise<FinancialSummary> {
  const { data, error } = await supabase.rpc('get_financial_summary', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data || data.length === 0) {
    return { totalRevenue: 0, partsCost: 0, partsProfit: 0, operatingExpenses: 0, netProfit: 0, margin: 0, totalCollected: 0, uncollected: 0 }
  }

  const r = data[0]
  return {
    totalRevenue: Number(r.total_revenue),
    partsCost: Number(r.parts_cost),
    partsProfit: Number(r.parts_profit),
    operatingExpenses: Number(r.operating_expenses),
    netProfit: Number(r.net_profit),
    margin: Number(r.margin),
    totalCollected: Number(r.total_collected),
    uncollected: Number(r.uncollected),
  }
}

export async function fetchRevenueByBucket(
  dateFrom: string,
  dateTo: string
): Promise<TimeBucketRevenue[]> {
  const { data, error } = await supabase.rpc('get_revenue_by_bucket', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data) return []

  const bucketType = detectBucketType(dateFrom, dateTo)
  return data.map((r) => {
    const dateStr = String(r.bucket_date)
    return {
      label: getBucketLabel(dateStr, bucketType),
      date: dateStr,
      partsRevenue: Number(r.parts_revenue),
      labor: Number(r.labor),
    }
  })
}

export async function fetchExpensesByCategory(
  dateFrom: string,
  dateTo: string
): Promise<ExpenseCategoryItem[]> {
  const { data, error } = await supabase.rpc('get_expenses_by_category', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data || data.length === 0) return []

  const grandTotal = data.reduce((sum, r) => sum + Number(r.amount), 0)
  return data.map((r) => ({
    category: String(r.category),
    amount: Number(r.amount),
    percentage: grandTotal > 0 ? (Number(r.amount) / grandTotal) * 100 : 0,
  }))
}

export async function fetchPaymentsByMethod(
  dateFrom: string,
  dateTo: string
): Promise<PaymentMethodItem[]> {
  const { data, error } = await supabase.rpc('get_payments_by_method', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data || data.length === 0) return []

  const grandTotal = data.reduce((sum, r) => sum + Number(r.amount), 0)
  return data.map((r) => ({
    method: String(r.method),
    amount: Number(r.amount),
    percentage: grandTotal > 0 ? (Number(r.amount) / grandTotal) * 100 : 0,
  }))
}

export async function fetchDailyBreakdown(
  dateFrom: string,
  dateTo: string
): Promise<DailyBreakdownRow[]> {
  const { data, error } = await supabase.rpc('get_daily_breakdown', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data) return []

  const bucketType = detectBucketType(dateFrom, dateTo)
  return data.map((r) => {
    const dateStr = String(r.bucket_date)
    return {
      date: dateStr,
      label: getBucketLabel(dateStr, bucketType),
      serviceCount: Number(r.service_count),
      revenue: Number(r.revenue),
      partsCost: Number(r.parts_cost),
      operatingExpenses: Number(r.operating_expenses),
      net: Number(r.net),
      collected: Number(r.collected),
    }
  })
}

// ─── Revenue Trend RPC ───────────────────────────────────────

export async function fetchRevenueTrend(): Promise<MonthlyTrendPoint[]> {
  const { data, error } = await supabase.rpc('get_revenue_trend')

  if (error) throw error
  if (!data || data.length === 0) return []

  const monthNames = ['Јан', 'Фев', 'Мар', 'Апр', 'Мај', 'Јун', 'Јул', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']

  return data.map((r) => {
    const monthKey = String(r.month)
    const monthIdx = parseInt(monthKey.slice(5, 7), 10) - 1
    const totalRevenue = Number(r.total_revenue)
    const distinctDays = Number(r.distinct_days)
    return {
      label: `${monthNames[monthIdx]} ${monthKey.slice(0, 4)}`,
      month: monthKey,
      avgRevenuePerDay: distinctDays > 0 ? Math.round(totalRevenue / distinctDays) : 0,
    }
  })
}

// ─── Customers Tab RPCs ──────────────────────────────────────

export async function fetchCustomerSummary(
  dateFrom: string,
  dateTo: string
): Promise<CustomerSummary> {
  const { data, error } = await supabase.rpc('get_customer_summary', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data || data.length === 0) {
    return { activeCount: 0, newCount: 0, avgInvoice: 0 }
  }

  const r = data[0]
  return {
    activeCount: Number(r.active_count),
    newCount: Number(r.new_count),
    avgInvoice: Number(r.avg_invoice),
  }
}

export async function fetchCustomerRankings(params: {
  dateFrom: string
  dateTo: string
  sortColumn: CustomerSortColumn
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: number
}): Promise<{ rows: CustomerRankingRow[]; totalCount: number }> {
  const { data, error } = await supabase.rpc('get_customer_rankings', {
    p_date_from: params.dateFrom,
    p_date_to: params.dateTo,
    p_sort_column: params.sortColumn,
    p_sort_direction: params.sortDirection,
    p_page: params.page,
    p_page_size: params.pageSize,
  })

  if (error) throw error
  if (!data || data.length === 0) return { rows: [], totalCount: 0 }

  const totalCount = Number(data[0].total_count)
  const rows: CustomerRankingRow[] = data.map((r) => ({
    customer_id: r.customer_id as string,
    full_name: r.full_name as string,
    phone: (r.phone as string) ?? null,
    services_count: Number(r.services_count),
    total_revenue: Number(r.total_revenue),
    profit: Number(r.profit),
    collected: Number(r.collected),
    owes: Number(r.owes),
    total_count: Number(r.total_count),
  }))

  return { rows, totalCount }
}

// ─── Services Tab RPCs ───────────────────────────────────────

export async function fetchServicesSummary(
  dateFrom: string,
  dateTo: string
): Promise<ServicesSummary> {
  const { data, error } = await supabase.rpc('get_services_summary', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data || data.length === 0) {
    return { totalServices: 0, avgPartsPerService: 0, avgLabor: 0 }
  }

  const r = data[0]
  return {
    totalServices: Number(r.total_services),
    avgPartsPerService: Number(r.avg_parts_per_service),
    avgLabor: Number(r.avg_labor),
  }
}

export async function fetchBrandDistribution(
  dateFrom: string,
  dateTo: string
): Promise<BrandCount[]> {
  const { data, error } = await supabase.rpc('get_brand_distribution', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  return (data ?? []).map((r) => ({
    brand: String(r.brand),
    count: Number(r.count),
  }))
}

export async function fetchYearDistribution(
  dateFrom: string,
  dateTo: string
): Promise<YearRangeCount[]> {
  const { data, error } = await supabase.rpc('get_year_distribution', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  return (data ?? []).map((r) => ({
    range: String(r.year_range),
    count: Number(r.count),
  }))
}

export async function fetchWeekdayUtilization(
  dateFrom: string,
  dateTo: string
): Promise<WeekdayAverage[]> {
  const { data, error } = await supabase.rpc('get_weekday_utilization', {
    p_from: dateFrom,
    p_to: dateTo,
  })

  if (error) throw error
  if (!data) return []

  const dayNames = ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб']

  // Return Mon–Sat first, then Sunday only if it has services
  const result: WeekdayAverage[] = []
  for (let i = 1; i <= 6; i++) {
    const row = data.find((r) => Number(r.day_index) === i)
    const svcCount = row ? Number(row.service_count) : 0
    const occurrences = row ? Number(row.weekday_occurrences) : 0
    result.push({
      day: dayNames[i],
      dayIndex: i,
      avgServices: occurrences > 0 ? Math.round((svcCount / occurrences) * 10) / 10 : 0,
    })
  }

  const sunday = data.find((r) => Number(r.day_index) === 0)
  if (sunday && Number(sunday.service_count) > 0) {
    const occurrences = Number(sunday.weekday_occurrences)
    result.push({
      day: dayNames[0],
      dayIndex: 0,
      avgServices: occurrences > 0
        ? Math.round((Number(sunday.service_count) / occurrences) * 10) / 10
        : 0,
    })
  }

  return result
}

// ─── Part rankings (server-side sorted & paginated) ──────────

export async function fetchPartRankings(params: {
  dateFrom: string
  dateTo: string
  sortColumn: PartSortColumn
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: number
}): Promise<{ rows: PartRankingRow[]; totalCount: number }> {
  const { data, error } = await supabase.rpc('get_part_rankings', {
    p_date_from: params.dateFrom,
    p_date_to: params.dateTo,
    p_sort_column: params.sortColumn,
    p_sort_direction: params.sortDirection,
    p_page: params.page,
    p_page_size: params.pageSize,
  })

  if (error) throw error
  if (!data || data.length === 0) return { rows: [], totalCount: 0 }

  const totalCount = Number(data[0].total_count)
  const rows: PartRankingRow[] = data.map((r) => ({
    part_name: r.part_name as string,
    qty_sold: Number(r.qty_sold),
    buy_cost_total: Number(r.buy_cost_total),
    sell_total: Number(r.sell_total),
    profit: Number(r.profit),
    total_count: Number(r.total_count),
  }))

  return { rows, totalCount }
}
