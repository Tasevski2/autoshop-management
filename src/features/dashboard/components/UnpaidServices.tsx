import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CircleDollarSign, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnpaidServices } from '../hooks/useDashboard'

export default function UnpaidServices() {
  const { t } = useTranslation()
  const { data: services, isLoading } = useUnpaidServices()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4" />
          {t('dashboard.unpaidServices')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !services || services.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('dashboard.allPaid')}
          </p>
        ) : (
          services.map((s) => (
            <div key={s.id} className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.vehicle?.customer?.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.vehicle?.plate_number} — {s.service_date}
                  </p>
                </div>
                <Button variant="ghost" size="icon-xs" asChild>
                  <Link to={`/services/${s.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {s.service_total.toLocaleString()} / {s.total_paid.toLocaleString()}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {t('dashboard.owes')} {s.balance_due.toLocaleString()} {t('dashboard.currency')}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
