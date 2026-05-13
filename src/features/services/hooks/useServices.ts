import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchServices,
  fetchService,
  fetchServiceParts,
  fetchServiceTotals,
  fetchServiceImages,
  fetchServicePayments,
  createService,
  updateService,
  deleteService,
  replaceServiceParts,
  bulkCreateServiceParts,
  deleteServiceImage,
  uploadServiceImage,
  createPayment,
  deletePayment,
  fetchVehicleOptions,
  fetchPartOptions,
  upsertCatalogParts,
} from '@/features/services/api'
import type { ServiceInsert, ServiceUpdate, ServicePartInsert, ServiceStatus, PaymentInsert } from '@/features/services/types'

export function useServices({
  page = 0,
  search,
  status,
  dateFrom,
  dateTo,
}: {
  page?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  return useQuery({
    queryKey: ['services', 'list', { page, search, status, dateFrom, dateTo }],
    queryFn: () => fetchServices({ page, search, status, dateFrom, dateTo }),
    placeholderData: (prev) => prev,
  })
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ['services', 'detail', id],
    queryFn: () => fetchService(id!),
    enabled: !!id,
  })
}

export function useServiceParts(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service-parts', 'by-service', serviceId],
    queryFn: () => fetchServiceParts(serviceId!),
    enabled: !!serviceId,
  })
}

export function useServiceTotals(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service-totals', serviceId],
    queryFn: () => fetchServiceTotals(serviceId!),
    enabled: !!serviceId,
  })
}

export function useServiceImages(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service-images', 'by-service', serviceId],
    queryFn: () => fetchServiceImages(serviceId!),
    enabled: !!serviceId,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      service,
      parts,
    }: {
      service: ServiceInsert
      parts: Omit<ServicePartInsert, 'service_id'>[]
    }) => {
      const created = await createService(service)
      if (parts.length > 0) {
        await bulkCreateServiceParts(
          parts.map((p) => ({ ...p, service_id: created.id }))
        )
      }
      return { created, parts }
    },
    onSuccess: ({ created, parts }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'in-progress'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      upsertCatalogParts(parts).then(() => {
        queryClient.invalidateQueries({ queryKey: ['parts'] })
      })
      navigate(`/services/${created.id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateService(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      service,
      parts,
    }: {
      service: ServiceUpdate
      parts: Omit<ServicePartInsert, 'service_id'>[]
    }) => {
      const [updated] = await Promise.all([
        updateService(id, service),
        replaceServiceParts(id, parts),
      ])
      return { updated, parts }
    },
    onSuccess: ({ parts }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-parts', 'by-service', id] })
      queryClient.invalidateQueries({ queryKey: ['service-totals', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'in-progress'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      upsertCatalogParts(parts).then(() => {
        queryClient.invalidateQueries({ queryKey: ['parts'] })
      })
      navigate(`/services/${id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateServiceStatus(id: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (status: ServiceStatus) => updateService(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['services', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'in-progress'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-parts', 'by-service', id] })
      queryClient.invalidateQueries({ queryKey: ['service-images', 'by-service', id] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'by-service', id] })
      queryClient.invalidateQueries({ queryKey: ['service-totals', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'in-progress'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/services')
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUploadServiceImage(serviceId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (file: File) => uploadServiceImage(serviceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-images', 'by-service', serviceId] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteServiceImage(serviceId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      deleteServiceImage(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-images', 'by-service', serviceId] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useServicePayments(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'by-service', serviceId],
    queryFn: () => fetchServicePayments(serviceId!),
    enabled: !!serviceId,
  })
}

export function useCreatePayment(serviceId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'by-service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['service-totals', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeletePayment(serviceId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'by-service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['service-totals', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unpaid'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useVehicleOptions(search: string) {
  return useQuery({
    queryKey: ['vehicles', 'options', search],
    queryFn: () => fetchVehicleOptions(search),
    enabled: search.length >= 2,
  })
}

export function usePartOptions(search: string) {
  const query = useInfiniteQuery({
    queryKey: ['parts', 'options', search],
    queryFn: ({ pageParam }) => fetchPartOptions(search, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page < last.totalPages - 1 ? last.page + 1 : undefined),
  })

  return {
    options: query.data?.pages.flatMap((p) => p.data) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}
