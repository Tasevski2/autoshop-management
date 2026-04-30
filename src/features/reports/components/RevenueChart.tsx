import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { TimeBucketRevenue } from '../types'
import { formatMoney } from '../utils'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  data: TimeBucketRevenue[]
}

export default function RevenueChart({ data }: Props) {
  const { t } = useTranslation()

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.financial.revenueOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
