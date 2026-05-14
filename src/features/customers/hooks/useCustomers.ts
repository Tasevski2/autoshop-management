import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchCustomers,
  fetchCustomer,
  fetchCustomerVehicles,
  fetchCustomerServices,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/features/customers/api'
import type { CustomerInsert, CustomerUpdate } from '@/features/customers/types'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useCustomers({ page = 0, search }: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.customers.list({ page, search }),
    queryFn: () => fetchCustomers({ page, search }),
    placeholderData: (prev) => prev,
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.customers.detail(id),
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  })
}

export function useCustomerVehicles(customerId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.byCustomer(customerId),
    queryFn: () => fetchCustomerVehicles(customerId),
  })
}

export function useCustomerServices(customerId: string, page = 0) {
  return useQuery({
    queryKey: QUERY_KEYS.services.byCustomer(customerId, { page }),
    queryFn: () => fetchCustomerServices(customerId, { page }),
    placeholderData: (prev) => prev,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: Omit<CustomerInsert, 'user_id'>) => createCustomer(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
      navigate(`/customers/${customer.id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: CustomerUpdate) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all })
      navigate(`/customers/${id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.byCustomer(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all })
      navigate('/customers')
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
