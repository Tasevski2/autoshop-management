import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  fetchPayments,
  fetchVehicleServicesWithTotals,
  createPayment,
  deletePayment,
} from '@/features/payments/api'
import type { PaymentInsert } from '@/features/payments/types'

export function usePayments({
  page = 0,
  dateFrom,
  dateTo,
}: {
  page?: number
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: ['payments', 'list', { page, dateFrom, dateTo }],
    queryFn: () => fetchPayments({ page, dateFrom, dateTo }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicleServicesWithTotals(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['services', 'by-vehicle-with-totals', vehicleId],
    queryFn: () => fetchVehicleServicesWithTotals(vehicleId!),
    enabled: !!vehicleId,
  })
}

export function useCreatePaymentFromForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'by-service', variables.service_id] })
      queryClient.invalidateQueries({ queryKey: ['service-totals', variables.service_id] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate(-1)
    },
  })
}

export function useDeletePaymentFromList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-totals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
