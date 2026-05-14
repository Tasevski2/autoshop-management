import { QueryClient } from '@tanstack/react-query'
import { QUERY_STALE_MS } from '@/lib/constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
