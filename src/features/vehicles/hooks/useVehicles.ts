import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
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

export function useVehicles({ page = 0, search }: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['vehicles', 'list', { page, search }],
    queryFn: () => fetchVehicles({ page, search }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id],
    queryFn: () => fetchVehicle(id!),
    enabled: !!id,
  })
}

export function useVehicleServices(vehicleId: string, page = 0) {
  return useQuery({
    queryKey: ['services', 'by-vehicle', vehicleId, { page }],
    queryFn: () => fetchVehicleServices(vehicleId, { page }),
    placeholderData: (prev) => prev,
  })
}

export function useVehicleReminders(vehicleId: string) {
  return useQuery({
    queryKey: ['reminders', 'by-vehicle', vehicleId],
    queryFn: () => fetchVehicleReminders(vehicleId),
  })
}

export function useVehiclePhotos(vehicleId: string) {
  return useQuery({
    queryKey: ['photos', 'by-vehicle', vehicleId],
    queryFn: () => fetchVehiclePhotos(vehicleId),
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate(`/vehicles/${vehicle.id}`)
    },
  })
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: VehicleUpdate) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate(`/vehicles/${id}`)
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['services', 'by-vehicle', id] })
      queryClient.invalidateQueries({ queryKey: ['reminders', 'by-vehicle', id] })
      queryClient.invalidateQueries({ queryKey: ['photos', 'by-vehicle', id] })
      navigate('/vehicles')
    },
  })
}

export function useCreateReminder(vehicleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReminderInsert) => createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminders', 'by-vehicle', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reminders'] })
    },
  })
}

export function useUpdateReminder(vehicleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReminderUpdate }) => updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminders', 'by-vehicle', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reminders'] })
    },
  })
}

export function useCustomerOptions(search: string) {
  return useQuery({
    queryKey: ['customers', 'options', search],
    queryFn: () => fetchCustomerOptions(search),
    enabled: search.length >= 2,
  })
}
