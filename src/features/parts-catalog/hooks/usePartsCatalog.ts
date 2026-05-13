import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { fetchParts, createPart, updatePart, deletePart } from '../api'
import type { PartsCatalogInsert, PartsCatalogUpdate } from '../types'

export function useParts(params: {
  page?: number
  search?: string
}) {
  return useQuery({
    queryKey: ['parts-catalog', 'list', params],
    queryFn: () => fetchParts(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreatePart() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (part: PartsCatalogInsert) => createPart(part),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts-catalog'] })
      qc.invalidateQueries({ queryKey: ['parts', 'options'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdatePart() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PartsCatalogUpdate }) =>
      updatePart(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts-catalog'] })
      qc.invalidateQueries({ queryKey: ['parts', 'options'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeletePart() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deletePart(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts-catalog'] })
      qc.invalidateQueries({ queryKey: ['parts', 'options'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
