import { Constants } from '@/types/database'
import type { Database } from '@/types/database'

// ── Enum types (derived from Supabase schema) ───────────────────────
export type ServiceStatus = Database['public']['Enums']['service_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type ExpenseCategory = Database['public']['Enums']['expense_category']
export type NotificationType = Database['public']['Enums']['notification_type']
export type CustomerType = 'person' | 'company'

// ── Enum value arrays (from auto-generated Constants) ───────────────
export const SERVICE_STATUSES = Constants.public.Enums.service_status
export const PAYMENT_METHODS = Constants.public.Enums.payment_method
export const EXPENSE_CATEGORIES = Constants.public.Enums.expense_category
export const NOTIFICATION_TYPES = Constants.public.Enums.notification_type
export const CUSTOMER_TYPES: readonly CustomerType[] = ['person', 'company'] as const
export const ENGINE_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const

// ── Named single-value constants for direct comparisons ─────────────

export const CUSTOMER_TYPE = {
  PERSON: 'person' as CustomerType,
  COMPANY: 'company' as CustomerType,
} as const

export const SERVICE_STATUS = {
  IN_PROGRESS: 'in_progress' as ServiceStatus,
  COMPLETED: 'completed' as ServiceStatus,
  INVOICED: 'invoiced' as ServiceStatus,
  PAID: 'paid' as ServiceStatus,
  PARTIALLY_PAID: 'partially_paid' as ServiceStatus,
  CANCELLED: 'cancelled' as ServiceStatus,
} as const

export const PAYMENT_METHOD = {
  CASH: 'cash' as PaymentMethod,
  CARD: 'card' as PaymentMethod,
  TRANSFER: 'transfer' as PaymentMethod,
} as const

export const NOTIFICATION_TYPE = {
  UPCOMING_SERVICE: 'upcoming_service' as NotificationType,
  UNPAID_INVOICE: 'unpaid_invoice' as NotificationType,
} as const

export const EXPENSE_CATEGORY = {
  OTHER: 'other' as ExpenseCategory,
  RENT: 'rent' as ExpenseCategory,
  UTILITIES: 'utilities' as ExpenseCategory,
  TOOLS: 'tools' as ExpenseCategory,
  SALARY: 'salary' as ExpenseCategory,
  SUPPLIES: 'supplies' as ExpenseCategory,
  MAINTENANCE: 'maintenance' as ExpenseCategory,
  INSURANCE: 'insurance' as ExpenseCategory,
  TAXES: 'taxes' as ExpenseCategory,
} as const

// ── Badge variant mappings ──────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export function serviceStatusVariant(status: ServiceStatus): BadgeVariant {
  switch (status) {
    case 'paid':
      return 'default'
    case 'completed':
    case 'invoiced':
    case 'partially_paid':
      return 'secondary'
    case 'in_progress':
      return 'outline'
    case 'cancelled':
      return 'destructive'
  }
}

export function notificationTypeVariant(type: NotificationType): BadgeVariant {
  switch (type) {
    case 'unpaid_invoice':
      return 'destructive'
    case 'upcoming_service':
      return 'default'
    default:
      return 'secondary'
  }
}

// ── Expense category colors ─────────────────────────────────────────

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  tools: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  salary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  supplies: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  insurance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  taxes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
}
