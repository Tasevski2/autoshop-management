import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { fetchParts, createPart, updatePart, deletePart } from '../api'
import type { PartsCatalogInsert, PartsCatalogUpdate } from '../types'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useParts(params: {
  page?: number
  search?: string
}) {
  return useQuery({
    queryKey: QUERY_KEYS.partsCatalog.list(params),
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.partsCatalog.all })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.parts.options })
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.partsCatalog.all })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.parts.options })
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.partsCatalog.all })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.parts.options })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
