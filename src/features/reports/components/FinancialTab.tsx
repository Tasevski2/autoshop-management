import { useTranslation } from 'react-i18next'
import { DollarSign, Package, TrendingUp, Building2, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import RevenueChart from './RevenueChart'
import ExpensesPaymentsRow from './ExpensesPaymentsRow'
import RevenueTrendChart from './RevenueTrendChart'
import DailyBreakdownTable from './DailyBreakdownTable'
import {
  useFinancialSummary,
  useRevenueByBucket,
  useExpensesByCategory,
  usePaymentsByMethod,
  useDailyBreakdown,
} from '../hooks/useReports'
import { formatMoney } from '../utils'

interface Props {
  dateFrom: string
  dateTo: string
}

export default function FinancialTab({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()

  const { data: summary, isLoading: loadingSummary } = useFinancialSummary(dateFrom, dateTo)
  const { data: revenueByTime, isLoading: loadingRevenue } = useRevenueByBucket(dateFrom, dateTo)
  const { data: expensesByCategory, isLoading: loadingExpenses } = useExpensesByCategory(dateFrom, dateTo)
  const { data: paymentsByMethod, isLoading: loadingPayments } = usePaymentsByMethod(dateFrom, dateTo)
  const { data: dailyBreakdown, isLoading: loadingBreakdown } = useDailyBreakdown(dateFrom, dateTo)

  const isLoading = loadingSummary || loadingRevenue || loadingExpenses || loadingPayments || loadingBreakdown

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
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

  if (!summary || (summary.totalRevenue === 0 && summary.operatingExpenses === 0)) {
    return <p className="text-center text-muted-foreground py-12">{t('reports.noData')}</p>
  }

  const cards = [
    {
      label: t('reports.financial.revenue'),
      value: `${formatMoney(summary.totalRevenue)} ден.`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: t('reports.financial.partsCost'),
      value: `${formatMoney(summary.partsCost)} ден.`,
      icon: Package,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: t('reports.financial.partsProfit'),
      value: `${formatMoney(summary.partsProfit)} ден.`,
      icon: ArrowUpRight,
      color: summary.partsProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bg: summary.partsProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950',
    },
    {
      label: t('reports.financial.operatingExpenses'),
      value: `${formatMoney(summary.operatingExpenses)} ден.`,
      icon: Building2,
      color: summary.operatingExpenses > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
      bg: summary.operatingExpenses > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted',
    },
    {
      label: t('reports.financial.netProfit'),
      value: `${formatMoney(summary.netProfit)} ден.`,
      sub: `${t('reports.financial.margin')}: ${Math.round(summary.margin)}%`,
      icon: TrendingUp,
      color: summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bg: summary.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                {'sub' in card && card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RevenueChart data={revenueByTime ?? []} dateFrom={dateFrom} dateTo={dateTo} />

      <ExpensesPaymentsRow
        expenses={expensesByCategory ?? []}
        payments={paymentsByMethod ?? []}
        totalInvoiced={summary.totalRevenue}
        totalCollected={summary.totalCollected}
        uncollected={summary.uncollected}
      />

      <RevenueTrendChart dateFrom={dateFrom} dateTo={dateTo} />

      <DailyBreakdownTable data={dailyBreakdown ?? []} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  )
}
