import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { TimeBucketRevenue } from '../types'
import { formatMoney, detectBucketType, getBucketLabel } from '../utils'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  data: TimeBucketRevenue[]
  dateFrom: string
  dateTo: string
}

export default function RevenueChart({ data, dateFrom, dateTo }: Props) {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    const dayNames = t('reports.financial.dayShort', { returnObjects: true }) as string[]
    const monthNames = t('reports.financial.monthShort', { returnObjects: true }) as string[]
    const bucketType = detectBucketType(dateFrom, dateTo)
    return data.map((d) => ({ ...d, label: getBucketLabel(d.date, bucketType, dayNames, monthNames) }))
  }, [data, dateFrom, dateTo, t])

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.financial.revenueOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatMoney(v)} />
            <Tooltip
              {...tooltipStyle}
              cursor={cursorStyle}
              formatter={(value, name) => [
                `${formatMoney(Number(value))} ден.`,
                name === 'partsRevenue' ? t('reports.financial.partsRevenue') : t('reports.financial.labor'),
              ]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={(value) =>
                value === 'partsRevenue' ? t('reports.financial.partsRevenue') : t('reports.financial.labor')
              }
            />
            <Bar dataKey="labor" stackId="revenue" fill="var(--chart-1)" />
            <Bar dataKey="partsRevenue" stackId="revenue" fill="var(--chart-2)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
