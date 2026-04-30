import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { BrandCount, YearRangeCount } from '../types'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  brands: BrandCount[]
  yearRanges: YearRangeCount[]
}

export default function BrandsYearCharts({ brands, yearRanges }: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Most Serviced Brands */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.services.topBrands')}</CardTitle>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('reports.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(150, brands.length * 36)}>
              <BarChart data={brands} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={75} />
                <Tooltip {...tooltipStyle} cursor={cursorStyle} formatter={(value) => [Number(value), t('reports.services.total')]} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Year Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.services.yearDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {yearRanges.every((r) => r.count === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('reports.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearRanges}>
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} cursor={cursorStyle} formatter={(value) => [Number(value), t('reports.services.total')]} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
