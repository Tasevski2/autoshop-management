import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUndismissedNotifications,
  dismissNotification,
  dismissAllNotifications,
} from '@/features/notifications/api'

const NOTIFICATIONS_KEY = ['notifications', 'undismissed'] as const

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
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

  return useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDismissAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dismissAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
