import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Car, Phone, ChevronRight, Clock, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInProgressServices } from '../hooks/useDashboard'
import { MS_PER_DAY, DAYS_IN_SHOP_WARNING } from '@/lib/constants'

function daysInShop(serviceDate: string): number {
  const start = new Date(serviceDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY)
}

export default function CarsInShop() {
  const { t } = useTranslation()
  const { data: services, isLoading } = useInProgressServices()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          {t('dashboard.carsInShop')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !services || services.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Car className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>{t('dashboard.noCarsInShop')}</p>
          </div>
        ) : (
          services.map((s) => {
            const days = daysInShop(s.service_date)
            return (
              <Link
                key={s.id}
                to={`/services/${s.id}`}
                className="block rounded-lg border p-4 space-y-3 transition-colors hover:bg-muted/50"
              >
                {/* Header: plate + brand/model + navigate */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-wide">
                      {s.vehicle?.plate_number ?? '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.vehicle ? `${s.vehicle.brand} ${s.vehicle.model ?? ''}`.trim() : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={days >= DAYS_IN_SHOP_WARNING ? 'destructive' : 'secondary'} className="shrink-0">
                      <Clock className="mr-1 h-3 w-3" />
                      {days === 0
                        ? t('dashboard.today')
                        : t('dashboard.daysInShop', { count: days })}
                    </Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>

                {/* Customer info row */}
                {s.vehicle?.customer && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {s.vehicle.customer.full_name}
                    </span>
                    {s.vehicle.customer.phone && (
                      <a
                        href={`tel:${s.vehicle.customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {s.vehicle.customer.phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Payment breakdown */}
                <div className="space-y-0.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('dashboard.totalCost')}</span>
                    <span className="font-medium">{s.service_total.toLocaleString()} {t('dashboard.currency')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('dashboard.paid')}</span>
                    <span className="text-green-600 dark:text-green-400">{s.total_paid.toLocaleString()} {t('dashboard.currency')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('dashboard.toPay')}</span>
                    <span className={`font-semibold ${s.balance_due > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {s.balance_due.toLocaleString()} {t('dashboard.currency')}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
