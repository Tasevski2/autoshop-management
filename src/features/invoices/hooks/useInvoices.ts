import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  fetchInvoiceData,
  fetchExistingInvoice,
  getNextInvoiceNumber,
  consumeNextInvoiceNumber,
  createInvoiceRecord,
  updateInvoiceRecord,
  deleteInvoiceRecord,
  fetchInvoices,
} from '@/features/invoices/api'
import type { InvoiceInsert } from '@/features/invoices/types'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useInvoiceData(serviceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.data(serviceId),
    queryFn: () => fetchInvoiceData(serviceId),
    enabled: !!serviceId,
  })
}

export function useExistingInvoice(serviceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.existing(serviceId),
    queryFn: () => fetchExistingInvoice(serviceId),
    enabled: !!serviceId,
  })
}

export function useSaveInvoice() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      existingId,
      invoice,
    }: {
      existingId: string | null
      invoice: InvoiceInsert
    }) => {
      if (existingId) {
        return updateInvoiceRecord(existingId, invoice)
      }
      // Consume (increment) the invoice number counter on first save
      await consumeNextInvoiceNumber()
      return createInvoiceRecord(invoice)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.all })
      toast.success(t('common.saved'))
    },
    onError: () => {
      toast.error(t('common.error'))
    },
  })
}

export function useNextInvoiceNumber(serviceId: string, hasExistingInvoice: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.nextNumber(serviceId),
    queryFn: getNextInvoiceNumber,
    enabled: !hasExistingInvoice,
    staleTime: Infinity,
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteInvoiceRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all })
    },
    onError: () => {
      toast.error(t('common.error'))
    },
  })
}

export function useInvoices({
  page = 0,
  dateFrom,
  dateTo,
}: {
  page?: number
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.list({ page, dateFrom, dateTo }),
    queryFn: () => fetchInvoices({ page, dateFrom, dateTo }),
    placeholderData: (prev) => prev,
  })
}
