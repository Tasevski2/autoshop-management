import { format, startOfWeek, startOfMonth, startOfYear, differenceInCalendarDays } from 'date-fns'
import type { TimeBucketType, MonthlyTrendPoint } from './types'

// ─── Number Formatting ────────────────────────────────────────
export function formatMoney(n: number): string {
  return n.toLocaleString('mk-MK')
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

// ─── Date Helpers (date-fns for timezone safety) ─────────────

export function getDatePresetRange(preset: string): [string, string] {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  switch (preset) {
    case 'today':
      return [today, today]
    case 'thisWeek':
      return [format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), today]
    case 'thisMonth':
      return [format(startOfMonth(now), 'yyyy-MM-dd'), today]
    case 'thisYear':
      return [format(startOfYear(now), 'yyyy-MM-dd'), today]
    case 'allTime':
      return ['2026-01-01', today]
    default:
      return [today, today]
  }
}

export function daysBetween(dateFrom: string, dateTo: string): number {
  return differenceInCalendarDays(new Date(dateTo), new Date(dateFrom)) + 1
}

// ─── Time Bucket Logic ────────────────────────────────────────

export function detectBucketType(dateFrom: string, dateTo: string): TimeBucketType {
  const days = daysBetween(dateFrom, dateTo)
  if (days <= 31) return 'daily'
  if (days <= 84) return 'weekly'
  return 'monthly'
}

export const MK_DAY_NAMES = ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб'] as const
export const MK_MONTH_NAMES = ['Јан', 'Фев', 'Мар', 'Апр', 'Мај', 'Јун', 'Јул', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'] as const

export function getBucketLabel(key: string, bucketType: TimeBucketType): string {

  switch (bucketType) {
    case 'daily': {
      const d = new Date(key)
      return `${MK_DAY_NAMES[d.getDay()]} ${key.slice(8, 10)}.${key.slice(5, 7)}`
    }
    case 'weekly':
      return `${key.slice(8, 10)}.${key.slice(5, 7)}`
    case 'monthly': {
      const monthIdx = parseInt(key.slice(5, 7), 10) - 1
      return MK_MONTH_NAMES[monthIdx]
    }
  }
}

// ─── Linear Regression ────────────────────────────────────────

export function linearRegression(points: MonthlyTrendPoint[]): { slope: number; intercept: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.avgRevenuePerDay ?? 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += points[i].avgRevenuePerDay
    sumXY += i * points[i].avgRevenuePerDay
    sumXX += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}
