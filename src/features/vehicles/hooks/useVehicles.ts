import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchVehicles,
  fetchVehicle,
  fetchVehicleServices,
  fetchVehicleReminders,
  fetchVehiclePhotos,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  createReminder,
  updateReminder,
  fetchCustomerOptions,
} from '@/features/vehicles/api'
import type { VehicleInsert, VehicleUpdate, ReminderInsert, ReminderUpdate } from '@/features/vehicles/types'
import { QUERY_KEYS } from '@/lib/query-keys'
import { MIN_SEARCH_LENGTH } from '@/lib/constants'

export function useVehicles({ page = 0, search }: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.list({ page, search }),
    queryFn: () => fetchVehicles({ page, search }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.detail(id),
    queryFn: () => fetchVehicle(id!),
    enabled: !!id,
  })
}

export function useVehicleServices(vehicleId: string, page = 0) {
  return useQuery({
    queryKey: QUERY_KEYS.services.byVehicle(vehicleId, { page }),
    queryFn: () => fetchVehicleServices(vehicleId, { page }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicleReminders(vehicleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reminders.byVehicle(vehicleId),
    queryFn: () => fetchVehicleReminders(vehicleId),
  })
}

export function useVehiclePhotos(vehicleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.photos.byVehicle(vehicleId),
    queryFn: () => fetchVehiclePhotos(vehicleId),
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      navigate(`/vehicles/${vehicle.id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: VehicleUpdate) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      navigate(`/vehicles/${id}`)
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders.byVehicle(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photos.byVehicle(id) })
      navigate('/vehicles')
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useCreateReminder(vehicleId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: ReminderInsert) => createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders.byVehicle(vehicleId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.reminders })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useUpdateReminder(vehicleId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReminderUpdate }) => updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders.byVehicle(vehicleId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.reminders })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useCustomerOptions(search: string) {
  return useQuery({
    queryKey: QUERY_KEYS.customers.options(search),
    queryFn: () => fetchCustomerOptions(search),
    enabled: search.length >= MIN_SEARCH_LENGTH,
  })
}
