import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { MIN_SEARCH_LENGTH } from '@/lib/constants'

const PAGE_SIZE = 10

async function searchCustomers(query: string, page: number) {
  const safe = sanitizeFilterValue(query)
  const pattern = `%${safe}%`
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('customers')
    .select('id, full_name, phone', { count: 'exact' })
    .or(`full_name.ilike.${pattern},phone.ilike.${pattern}`)
    .order('full_name')
    .range(from, to)
  if (error) throw error
  return { data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

async function searchVehicles(query: string, page: number) {
  const safe = sanitizeFilterValue(query)
  const pattern = `%${safe}%`
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('vehicles')
    .select('id, plate_number, brand, model, engine_capacity, engine_designation, customer_id, customers(full_name)', { count: 'exact' })
    .or(`plate_number.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern}`)
    .order('plate_number')
    .range(from, to)
  if (error) throw error
  return { data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

async function searchServices(query: string, page: number) {
  const safe = sanitizeFilterValue(query)
  const pattern = `%${safe}%`
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('services')
    .select('id, notes, service_date, status, vehicle_id, vehicles!services_vehicle_id_fkey(plate_number)', { count: 'exact' })
    .ilike('notes', pattern)
    .order('service_date', { ascending: false })
    .range(from, to)
  if (error) throw error
  return { data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

export function useGlobalSearch(query: string) {
  const enabled = query.length >= MIN_SEARCH_LENGTH

  const customersQuery = useInfiniteQuery({
    queryKey: ['search', 'customers', query],
    queryFn: ({ pageParam }) => searchCustomers(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page < last.totalPages - 1 ? last.page + 1 : undefined),
    enabled,
  })
  const vehiclesQuery = useInfiniteQuery({
    queryKey: ['search', 'vehicles', query],
    queryFn: ({ pageParam }) => searchVehicles(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page < last.totalPages - 1 ? last.page + 1 : undefined),
    enabled,
  })
  const servicesQuery = useInfiniteQuery({
    queryKey: ['search', 'services', query],
    queryFn: ({ pageParam }) => searchServices(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page < last.totalPages - 1 ? last.page + 1 : undefined),
    enabled,
  })

  const customers = customersQuery.data?.pages.flatMap((p) => p.data) ?? []
  const vehicles = vehiclesQuery.data?.pages.flatMap((p) => p.data) ?? []
  const services = servicesQuery.data?.pages.flatMap((p) => p.data) ?? []

  const customersTotal = customersQuery.data?.pages[0]?.count ?? 0
  const vehiclesTotal = vehiclesQuery.data?.pages[0]?.count ?? 0
  const servicesTotal = servicesQuery.data?.pages[0]?.count ?? 0

  return {
    customers,
    vehicles,
    services,
    customersTotal,
    vehiclesTotal,
    servicesTotal,
    fetchNextCustomers: customersQuery.fetchNextPage,
    fetchNextVehicles: vehiclesQuery.fetchNextPage,
    fetchNextServices: servicesQuery.fetchNextPage,
    hasNextCustomers: customersQuery.hasNextPage,
    hasNextVehicles: vehiclesQuery.hasNextPage,
    hasNextServices: servicesQuery.hasNextPage,
    isFetchingNext: customersQuery.isFetchingNextPage || vehiclesQuery.isFetchingNextPage || servicesQuery.isFetchingNextPage,
    isLoading: customersQuery.isLoading || vehiclesQuery.isLoading || servicesQuery.isLoading,
    hasResults: customersTotal + vehiclesTotal + servicesTotal > 0,
  }
}
