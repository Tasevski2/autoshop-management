import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  return useMutation({
    mutationFn: (brand: VehicleBrandInsert) => createBrand(brand),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle-brands'] }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle-brands'] }),
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
  return useMutation({
    mutationFn: (model: VehicleModelInsert) => createModel(model),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-models', brandId] })
    },
  })
}

export function useDeleteModel(brandId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-models', brandId] })
    },
  })
}
