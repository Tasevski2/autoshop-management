import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Wrench, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardStats } from '../hooks/useDashboard'

export default function StatCards() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useDashboardStats()

  const cards = [
    {
      label: t('dashboard.inShop'),
      value: stats?.inProgressCount ?? 0,
      format: (v: number) => `${v} ${t('dashboard.vehicles')}`,
      icon: Wrench,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      to: '/services?status=in_progress',
    },
    {
      label: t('dashboard.unpaid'),
      value: stats?.totalUnpaid ?? 0,
      format: (v: number) => `${v.toLocaleString()} ${t('dashboard.currency')}`,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950',
      to: '/services?status=completed',
    },
    {
      label: t('dashboard.revenueToday'),
      value: stats?.todayRevenue ?? 0,
      format: (v: number) => `${v.toLocaleString()} ${t('dashboard.currency')}`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      to: '/payments',
    },
    {
      label: t('dashboard.expensesToday'),
      value: stats?.todayExpenses ?? 0,
      format: (v: number) => `${v.toLocaleString()} ${t('dashboard.currency')}`,
      icon: TrendingDown,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
      to: '/expenses',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link key={card.label} to={card.to}>
          <Card size="sm" className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                {isLoading ? (
                  <div className="h-5 w-16 animate-pulse rounded bg-muted mt-0.5" />
                ) : (
                  <p className="text-base font-semibold truncate">{card.format(card.value)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
