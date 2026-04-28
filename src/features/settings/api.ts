import { supabase } from '@/lib/supabase'
import type { VehicleBrandInsert, VehicleModelInsert } from './types'

// ── Brands ──

export async function fetchBrands() {
  const { data, error } = await supabase
    .from('vehicle_brands')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createBrand(brand: VehicleBrandInsert) {
  const { data, error } = await supabase
    .from('vehicle_brands')
    .insert(brand)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBrand(id: string) {
  const { error } = await supabase
    .from('vehicle_brands')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Models ──

export async function fetchModels(brandId: string) {
  const { data, error } = await supabase
    .from('vehicle_models')
    .select('*')
    .eq('brand_id', brandId)
    .order('name')
  if (error) throw error
  return data
}

export async function createModel(model: VehicleModelInsert) {
  const { data, error } = await supabase
    .from('vehicle_models')
    .insert(model)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteModel(id: string) {
  const { error } = await supabase
    .from('vehicle_models')
    .delete()
    .eq('id', id)
  if (error) throw error
}
