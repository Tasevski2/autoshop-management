import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { fetchAllReminders, fetchReminder, createReminder, updateReminder } from '@/features/reminders/api'
import type { ReminderUpdate } from '@/features/reminders/types'
import type { ReminderInsert } from '@/features/vehicles/types'

export function useReminders(active: boolean, page = 0) {
  return useQuery({
    queryKey: ['reminders', 'all', { active, page }],
    queryFn: () => fetchAllReminders({ active, page }),
    placeholderData: (prev) => prev,
  })
}

export function useReminder(id: string | undefined) {
  return useQuery({
    queryKey: ['reminders', 'detail', id],
    queryFn: () => fetchReminder(id!),
    enabled: !!id,
  })
}

export function useUpdateReminderFromPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ReminderUpdate }) =>
      updateReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reminders'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useCreateReminderFromPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: ReminderInsert) => createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reminders'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDeactivateReminder() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ReminderUpdate }) =>
      updateReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reminders'] })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
