import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
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

export function useCustomers({ page = 0, search }: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['customers', 'list', { page, search }],
    queryFn: () => fetchCustomers({ page, search }),
    placeholderData: (prev) => prev,
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  })
}

export function useCustomerVehicles(customerId: string) {
  return useQuery({
    queryKey: ['vehicles', 'by-customer', customerId],
    queryFn: () => fetchCustomerVehicles(customerId),
  })
}

export function useCustomerServices(customerId: string, page = 0) {
  return useQuery({
    queryKey: ['services', 'by-customer', customerId, { page }],
    queryFn: () => fetchCustomerServices(customerId, { page }),
    placeholderData: (prev) => prev,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: Omit<CustomerInsert, 'user_id'>) => createCustomer(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate(`/customers/${customer.id}`)
    },
  })
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CustomerUpdate) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate(`/customers/${id}`)
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'by-customer', id] })
      queryClient.invalidateQueries({ queryKey: ['services', 'by-customer', id] })
      navigate('/customers')
    },
  })
}
