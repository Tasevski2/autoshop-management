import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Bell, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useNotifications,
  useDismissNotification,
  useDismissAllNotifications,
} from '@/features/notifications/hooks/useNotifications'
import type { Database } from '@/types/database'

type NotificationType = Database['public']['Enums']['notification_type']

function typeVariant(type: NotificationType) {
  switch (type) {
    case 'unpaid_invoice':
      return 'destructive' as const
    case 'upcoming_service':
      return 'default' as const
    default:
      return 'secondary' as const
  }
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { notifications, totalCount, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications()
  const dismiss = useDismissNotification()
  const dismissAll = useDismissAllNotifications()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleClick = (notification: (typeof notifications)[number]) => {
    if (notification.type === 'upcoming_service' && notification.reminder_id) {
      navigate('/reminders')
    } else if (notification.type === 'unpaid_invoice') {
      navigate('/invoices')
    } else {
      navigate('/')
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">{t('notifications.title')}</h3>
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={() => dismissAll.mutate()}
            >
              {t('notifications.dismissAll')}
            </Button>
          )}
        </div>

        <Separator />

        {totalCount === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t('notifications.empty')}
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="max-h-80 overflow-y-auto"
            onScroll={handleScroll}
          >
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 border-b last:border-0 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <button
                  onClick={() => handleClick(n)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {n.title}
                    </span>
                    <Badge variant={typeVariant(n.type)} className="text-[10px] px-1.5 py-0 shrink-0">
                      {t(`notifications.${n.type}`)}
                    </Badge>
                  </div>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {n.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {timeAgo(n.created_at, t)}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    dismiss.mutate(n.id)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
