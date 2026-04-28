import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import DateRangeControls from './DateRangeControls'
import FinancialTab from './FinancialTab'
import CustomersTab from './CustomersTab'
import ServicesTab from './ServicesTab'
import { getDatePresetRange } from '../utils'
import type { DatePreset } from '../types'

export default function ReportsPage() {
  const { t } = useTranslation()

  const [defaultFrom, defaultTo] = getDatePresetRange('thisMonth')
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [activePreset, setActivePreset] = useState<DatePreset | null>('thisMonth')

  const handlePresetChange = useCallback((preset: DatePreset) => {
    const [from, to] = getDatePresetRange(preset)
    setDateFrom(from)
    setDateTo(to)
    setActivePreset(preset)
  }, [])

  const handleCustomRange = useCallback((from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
    setActivePreset(null)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
      </div>

      <DateRangeControls
        dateFrom={dateFrom}
        dateTo={dateTo}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        onCustomRange={handleCustomRange}
      />

      <Tabs defaultValue="financial">
        <TabsList variant="line">
          <TabsTrigger value="financial">{t('reports.tabs.financial')}</TabsTrigger>
          <TabsTrigger value="customers">{t('reports.tabs.customers')}</TabsTrigger>
          <TabsTrigger value="services">{t('reports.tabs.services')}</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="pt-4">
          <FinancialTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="customers" className="pt-4">
          <CustomersTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="services" className="pt-4">
          <ServicesTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
