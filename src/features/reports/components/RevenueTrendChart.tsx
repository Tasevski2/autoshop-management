import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useWeekdayRevenue } from '../hooks/useReports'
import { formatMoney } from '../utils'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  dateFrom: string
  dateTo: string
}

export default function RevenueTrendChart({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()
  const { data: rawData, isLoading } = useWeekdayRevenue(dateFrom, dateTo)

  const data = useMemo(() => {
    if (!rawData) return null
    const dayNames = t('reports.financial.dayShort', { returnObjects: true }) as string[]
    return rawData.map((d) => ({ ...d, day: dayNames[d.dayIndex] }))
  }, [rawData, t])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.financial.revenuePerDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.financial.revenuePerDay')}</CardTitle>
        <CardDescription>{t('reports.financial.revenuePerDayDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatMoney(v)} />
            <Tooltip
              {...tooltipStyle}
              cursor={cursorStyle}
              formatter={(value) => [
                `${formatMoney(Number(value))} ден.`,
                t('reports.financial.avgPerDay'),
              ]}
            />
            <Bar dataKey="avgRevenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
