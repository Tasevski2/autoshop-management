import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { WeekdayAverage } from '../types'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  data: WeekdayAverage[]
}

export default function WeekdayChart({ data }: Props) {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    const dayNames = t('reports.financial.dayShort', { returnObjects: true }) as string[]
    return data.map((d) => ({ ...d, day: dayNames[d.dayIndex] }))
  }, [data, t])

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.services.weekdayUtil')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              {...tooltipStyle}
              cursor={cursorStyle}
              formatter={(value) => [Number(value).toFixed(1), t('reports.services.avgServicesPerDay')]}
            />
            <Bar dataKey="avgServices" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
