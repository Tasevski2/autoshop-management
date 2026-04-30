import { useTranslation } from 'react-i18next'
import { Users, Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import CustomerRankingsTable from './CustomerRankingsTable'
import { useCustomerSummary } from '../hooks/useReports'
import { formatMoney } from '../utils'

interface Props {
  dateFrom: string
  dateTo: string
}

export default function CustomersTab({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()

  const { data: summary, isLoading } = useCustomerSummary(dateFrom, dateTo)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} size="sm">
              <CardContent>
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!summary || summary.activeCount === 0) {
    return <p className="text-center text-muted-foreground py-12">{t('reports.noData')}</p>
  }

  const cards = [
    {
      label: t('reports.customers.active'),
      value: summary.activeCount.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: t('reports.customers.avgInvoice'),
      value: `${formatMoney(summary.avgInvoice)} ден.`,
      icon: Receipt,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card) => (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CustomerRankingsTable dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  )
}
