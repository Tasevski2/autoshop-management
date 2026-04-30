import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useRevenueTrend } from '../hooks/useReports'
import { linearRegression, formatMoney } from '../utils'
import { tooltipStyle } from '../chart-config'

export default function RevenueTrendChart() {
  const { t } = useTranslation()
  const { data: points, isLoading } = useRevenueTrend()

  const trendData = useMemo(() => {
    if (!points || points.length < 2) return null

    const { slope, intercept } = linearRegression(points)
    return points.map((p, i) => ({
      ...p,
      trend: Math.round(intercept + slope * i),
    }))
  }, [points])

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

  if (!trendData || trendData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.financial.revenuePerDay')}</CardTitle>
        <CardDescription>{t('reports.financial.revenuePerDayDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatMoney(v)} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                `${formatMoney(Number(value))} ден.`,
                name === 'avgRevenuePerDay' ? t('reports.financial.avgPerDay') : t('reports.financial.trend'),
              ]}
            />
            <Line
              type="monotone"
              dataKey="avgRevenuePerDay"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
