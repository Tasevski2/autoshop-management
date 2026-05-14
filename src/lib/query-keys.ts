/**
 * Centralized TanStack Query key definitions.
 *
 * Dashboard keys are shared across multiple feature hook files (services,
 * payments, expenses, reminders, vehicles). A single source of truth prevents
 * silent cache-invalidation bugs from key typos.
 */
export const QUERY_KEYS = {
  customers: {
    all: ['customers'] as const,
    list: (params: { page: number; search?: string }) =>
      ['customers', 'list', params] as const,
    detail: (id: string | undefined) =>
      ['customers', 'detail', id] as const,
    options: (search: string) =>
      ['customers', 'options', search] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
    inProgress: ['dashboard', 'in-progress'] as const,
    reminders: ['dashboard', 'reminders'] as const,
    unpaid: ['dashboard', 'unpaid'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (params: { page: number; category?: string; dateFrom?: string; dateTo?: string }) =>
      ['expenses', 'list', params] as const,
    totals: (params: { category?: string; dateFrom?: string; dateTo?: string }) =>
      ['expenses', 'totals', params] as const,
    detail: (id: string | undefined) =>
      ['expenses', 'detail', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (params: { page: number; dateFrom?: string; dateTo?: string }) =>
      ['invoices', 'list', params] as const,
    data: (serviceId: string) =>
      ['invoices', 'data', serviceId] as const,
    existing: (serviceId: string) =>
      ['invoices', 'existing', serviceId] as const,
    nextNumber: (serviceId: string) =>
      ['invoices', 'nextNumber', serviceId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    undismissed: ['notifications', 'undismissed'] as const,
  },
  parts: {
    all: ['parts'] as const,
    options: ['parts', 'options'] as const,
  },
  partsCatalog: {
    all: ['parts-catalog'] as const,
    list: (params: { page?: number; search?: string }) =>
      ['parts-catalog', 'list', params] as const,
  },
  payments: {
    all: ['payments'] as const,
    list: (params: { page: number; dateFrom?: string; dateTo?: string }) =>
      ['payments', 'list', params] as const,
    byService: (serviceId: string) =>
      ['payments', 'by-service', serviceId] as const,
  },
  photos: {
    byVehicle: (vehicleId: string) =>
      ['photos', 'by-vehicle', vehicleId] as const,
  },
  reminders: {
    all: ['reminders'] as const,
    list: (params: { active: boolean; page: number }) =>
      ['reminders', 'all', params] as const,
    detail: (id: string | undefined) =>
      ['reminders', 'detail', id] as const,
    byVehicle: (vehicleId: string) =>
      ['reminders', 'by-vehicle', vehicleId] as const,
  },
  reports: {
    all: ['reports'] as const,
    financialSummary: (dateFrom: string, dateTo: string) =>
      ['reports', 'financial-summary', dateFrom, dateTo] as const,
    revenueByBucket: (dateFrom: string, dateTo: string) =>
      ['reports', 'revenue-by-bucket', dateFrom, dateTo] as const,
    expensesByCategory: (dateFrom: string, dateTo: string) =>
      ['reports', 'expenses-by-category', dateFrom, dateTo] as const,
    paymentsByMethod: (dateFrom: string, dateTo: string) =>
      ['reports', 'payments-by-method', dateFrom, dateTo] as const,
    dailyBreakdown: (dateFrom: string, dateTo: string) =>
      ['reports', 'daily-breakdown', dateFrom, dateTo] as const,
    trend: ['reports', 'trend'] as const,
    customerSummary: (dateFrom: string, dateTo: string) =>
      ['reports', 'customer-summary', dateFrom, dateTo] as const,
    customerRankings: (dateFrom: string, dateTo: string, sortColumn: string, sortDirection: string, page: number, pageSize: number) =>
      ['reports', 'customer-rankings', dateFrom, dateTo, sortColumn, sortDirection, page, pageSize] as const,
    servicesSummary: (dateFrom: string, dateTo: string) =>
      ['reports', 'services-summary', dateFrom, dateTo] as const,
    brandDistribution: (dateFrom: string, dateTo: string) =>
      ['reports', 'brand-distribution', dateFrom, dateTo] as const,
    yearDistribution: (dateFrom: string, dateTo: string) =>
      ['reports', 'year-distribution', dateFrom, dateTo] as const,
    weekdayUtilization: (dateFrom: string, dateTo: string) =>
      ['reports', 'weekday-utilization', dateFrom, dateTo] as const,
    partRankings: (dateFrom: string, dateTo: string, sortColumn: string, sortDirection: string, page: number, pageSize: number) =>
      ['reports', 'part-rankings', dateFrom, dateTo, sortColumn, sortDirection, page, pageSize] as const,
  },
  serviceImages: {
    byService: (serviceId: string) =>
      ['service-images', 'by-service', serviceId] as const,
  },
  serviceParts: {
    byService: (serviceId: string) =>
      ['service-parts', 'by-service', serviceId] as const,
  },
  services: {
    all: ['services'] as const,
    list: (params: { page: number; search?: string; status?: string; dateFrom?: string; dateTo?: string }) =>
      ['services', 'list', params] as const,
    detail: (id: string | undefined) =>
      ['services', 'detail', id] as const,
    byCustomer: (customerId: string, params: { page: number }) =>
      ['services', 'by-customer', customerId, params] as const,
    byVehicle: (vehicleId: string, params: { page: number }) =>
      ['services', 'by-vehicle', vehicleId, params] as const,
    byVehicleWithTotals: (vehicleId: string | undefined) =>
      ['services', 'by-vehicle-with-totals', vehicleId] as const,
  },
  serviceTotals: {
    all: ['service-totals'] as const,
    detail: (serviceId: string) =>
      ['service-totals', serviceId] as const,
  },
  user: {
    all: ['user'] as const,
    profile: ['user', 'profile'] as const,
  },
  vehicleBrands: {
    all: ['vehicle-brands'] as const,
  },
  vehicleModels: {
    byBrand: (brandId: string | null) =>
      ['vehicle-models', brandId] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: (params: { page: number; search?: string }) =>
      ['vehicles', 'list', params] as const,
    detail: (id: string | undefined) =>
      ['vehicles', 'detail', id] as const,
    byCustomer: (customerId: string) =>
      ['vehicles', 'by-customer', customerId] as const,
    options: (search: string) =>
      ['vehicles', 'options', search] as const,
  },
} as const
