import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDashboardStats } from '../hooks/useDashboard'

export default function TodaySummary() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useDashboardStats()

  const received = stats?.todayRevenue ?? 0
  const spent = stats?.todayExpenses ?? 0
  const net = received - spent

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.todaySummary')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 animate-pulse rounded bg-muted" />
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t('dashboard.received')}</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {received.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('dashboard.spent')}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {spent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('dashboard.net')}</p>
              <p className={`text-lg font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {net >= 0 ? '+' : ''}{net.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
