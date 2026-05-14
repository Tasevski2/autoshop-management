import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { fetchUserProfile, updateUserProfile } from '@/features/settings/api'
import type { UserProfileUpdate } from '@/features/settings/types'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useUserProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.user.profile,
    queryFn: fetchUserProfile,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (updates: UserProfileUpdate) => updateUserProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all })
      toast.success(t('common.saved'))
    },
    onError: () => {
      toast.error(t('common.error'))
    },
  })
}
