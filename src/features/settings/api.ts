import { supabase } from '@/lib/supabase'
import type { VehicleBrandInsert, VehicleModelInsert, UserProfileUpdate } from './types'

// ── User Profile (invoice settings) ──

export async function fetchUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}

export async function updateUserProfile(updates: UserProfileUpdate) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

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
