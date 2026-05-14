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
import { QUERY_KEYS } from '@/lib/query-keys'

// ── Brands ──

export function useBrands() {
  return useQuery({
    queryKey: QUERY_KEYS.vehicleBrands.all,
    queryFn: fetchBrands,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (brand: VehicleBrandInsert) => createBrand(brand),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicleBrands.all }),
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicleBrands.all }),
    onError: () => { toast.error(t('common.error')) },
  })
}

// ── Models ──

export function useModels(brandId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicleModels.byBrand(brandId),
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicleModels.byBrand(brandId) })
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicleModels.byBrand(brandId) })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
