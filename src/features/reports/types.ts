// ─── RPC result types ────────────────────────────────────────

export interface FinancialSummary {
  totalRevenue: number
  partsCost: number
  operatingExpenses: number
  netProfit: number
  margin: number
  totalCollected: number
  uncollected: number
}

export interface TimeBucketRevenue {
  label: string
  date: string
  partsRevenue: number
  labor: number
}

export interface ExpenseCategoryItem {
  category: string
  amount: number
  percentage: number
}

export interface PaymentMethodItem {
  method: string
  amount: number
  percentage: number
}

export interface DailyBreakdownRow {
  date: string
  label: string
  serviceCount: number
  revenue: number
  partsCost: number
  operatingExpenses: number
  net: number
  collected: number
}

export interface MonthlyTrendPoint {
  label: string
  month: string
  avgRevenuePerDay: number
}

export interface CustomerSummary {
  activeCount: number
  newCount: number
  avgInvoice: number
}

export interface CustomerRankingRow {
  customer_id: string
  full_name: string
  phone: string | null
  services_count: number
  total_revenue: number
  profit: number
  collected: number
  owes: number
  total_count: number
}

export type CustomerSortColumn =
  | 'full_name'
  | 'services_count'
  | 'total_revenue'
  | 'profit'
  | 'collected'
  | 'owes'

export interface ServicesSummary {
  totalServices: number
  avgPartsPerService: number
  avgLabor: number
}

export interface BrandCount {
  brand: string
  count: number
}

export interface YearRangeCount {
  range: string
  count: number
}

export interface WeekdayAverage {
  day: string
  dayIndex: number
  avgServices: number
}

export interface PartRankingRow {
  part_name: string
  qty_sold: number
  buy_cost_total: number
  sell_total: number
  profit: number
  total_count: number
}

export type PartSortColumn =
  | 'part_name'
  | 'qty_sold'
  | 'buy_cost_total'
  | 'sell_total'
  | 'profit'

export type DatePreset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'allTime'
export type TimeBucketType = 'daily' | 'weekly' | 'monthly'
export type SortDirection = 'asc' | 'desc'
