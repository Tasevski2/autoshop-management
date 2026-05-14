import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  fetchUndismissedNotifications,
  dismissNotification,
  dismissAllNotifications,
} from '@/features/notifications/api'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications.undismissed,
    queryFn: ({ pageParam = 0 }) => fetchUndismissedNotifications({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages - 1 ? lastPage.page + 1 : undefined,
  })

  const notifications = query.data?.pages.flatMap((p) => p.data) ?? []
  const totalCount = query.data?.pages[0]?.count ?? 0

  return {
    ...query,
    notifications,
    totalCount,
  }
}

export function useDismissNotification() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}

export function useDismissAllNotifications() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: dismissAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all })
    },
    onError: () => { toast.error(t('common.error')) },
  })
}
