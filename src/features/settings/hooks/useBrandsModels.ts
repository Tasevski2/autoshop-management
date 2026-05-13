import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchBrands,
  createBrand,
  deleteBrand,
  fetchModels,
  createModel,
  deleteModel,
} from '../api'
import type { VehicleBrandInsert, VehicleModelInsert } from '../types'

// ── Brands ──

export function useBrands() {
  return useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: fetchBrands,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (brand: VehicleBrandInsert) => createBrand(brand),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle-brands'] }),
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle-brands'] }),
    onError: () => { toast.error(t('common.error')) },
  })
}

// ── Models ──

export function useModels(brandId: string | null) {
  return useQuery({
    queryKey: ['vehicle-models', brandId],
    queryFn: () => fetchModels(brandId!),
    enabled: !!brandId,
  })
}

export function useCreateModel(brandId: string | null) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (model: VehicleModelInsert) => createModel(model),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-models', brandId] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteModel(brandId: string | null) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-models', brandId] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
