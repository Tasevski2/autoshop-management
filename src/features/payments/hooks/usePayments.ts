import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchPayments,
  fetchVehicleServicesWithTotals,
  createPayment,
  deletePayment,
} from '@/features/payments/api'
import type { PaymentInsert } from '@/features/payments/types'
import { QUERY_KEYS } from '@/lib/query-keys'

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
    queryKey: QUERY_KEYS.payments.list({ page, dateFrom, dateTo }),
    queryFn: () => fetchPayments({ page, dateFrom, dateTo }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicleServicesWithTotals(vehicleId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.services.byVehicleWithTotals(vehicleId),
    queryFn: () => fetchVehicleServicesWithTotals(vehicleId!),
    enabled: !!vehicleId,
  })
}

export function useCreatePaymentFromForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.byService(variables.service_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceTotals.detail(variables.service_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.unpaid })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
      navigate(-1)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeletePaymentFromList() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceTotals.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.unpaid })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
