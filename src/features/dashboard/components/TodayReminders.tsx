import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Bell, Phone } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDueReminders } from '../hooks/useDashboard'
import { MS_PER_DAY } from '@/lib/constants'

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - due.getTime()) / MS_PER_DAY)
}

export default function TodayReminders() {
  const { t } = useTranslation()
  const { data: reminders, isLoading } = useDueReminders()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t('dashboard.todayReminders')}
          {reminders && reminders.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{reminders.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !reminders || reminders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('dashboard.noReminders')}
          </p>
        ) : (
          reminders.map((r) => {
            const days = daysOverdue(r.due_date)
            return (
              <div key={r.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {r.vehicles?.customers?.full_name ?? t('reminders.noCustomer')}
                  </span>
                  <div className="flex items-center gap-1">
                    {r.vehicles?.customers?.phone && (
                      <a
                        href={`tel:${r.vehicles.customers.phone}`}
                        className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                    {days > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {t('dashboard.overdueDays', { count: days })}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {t('dashboard.today')}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.vehicles?.plate_number} — {r.vehicles?.brand} {r.vehicles?.model ?? ''}
                </p>
                {r.note && (
                  <p className="text-xs truncate">{r.note}</p>
                )}
              </div>
            )
          })
        )}
      </CardContent>
      {reminders && reminders.length > 0 && (
        <CardFooter>
          <Link to="/reminders" className="text-sm text-muted-foreground hover:text-foreground">
            {t('dashboard.allReminders')} &rarr;
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
