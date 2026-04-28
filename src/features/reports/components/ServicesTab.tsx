import { useTranslation } from 'react-i18next'
import { Wrench, Layers, Hammer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import PartRankingsTable from './PartRankingsTable'
import BrandsYearCharts from './BrandsYearCharts'
import WeekdayChart from './WeekdayChart'
import {
  useServicesSummary,
  useBrandDistribution,
  useYearDistribution,
  useWeekdayUtilization,
} from '../hooks/useReports'
import { formatMoney } from '../utils'

interface Props {
  dateFrom: string
  dateTo: string
}

export default function ServicesTab({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()

  const { data: summary, isLoading: loadingSummary } = useServicesSummary(dateFrom, dateTo)
  const { data: brands, isLoading: loadingBrands } = useBrandDistribution(dateFrom, dateTo)
  const { data: yearRanges, isLoading: loadingYears } = useYearDistribution(dateFrom, dateTo)
  const { data: weekdays, isLoading: loadingWeekdays } = useWeekdayUtilization(dateFrom, dateTo)

  const isLoading = loadingSummary || loadingBrands || loadingYears || loadingWeekdays

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
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

  if (!summary || summary.totalServices === 0) {
    return <p className="text-center text-muted-foreground py-12">{t('reports.noData')}</p>
  }

  const cards = [
    {
      label: t('reports.services.total'),
      value: summary.totalServices.toString(),
      icon: Wrench,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: t('reports.services.avgParts'),
      value: summary.avgPartsPerService.toString(),
      icon: Layers,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: t('reports.services.avgLabor'),
      value: `${formatMoney(summary.avgLabor)} ден.`,
      icon: Hammer,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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

      <PartRankingsTable dateFrom={dateFrom} dateTo={dateTo} />

      <BrandsYearCharts brands={brands ?? []} yearRanges={yearRanges ?? []} />

      <WeekdayChart data={weekdays ?? []} />
    </div>
  )
}
