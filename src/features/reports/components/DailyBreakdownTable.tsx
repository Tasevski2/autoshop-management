import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { DailyBreakdownRow, SortDirection } from '../types'
import { formatMoney } from '../utils'

interface Props {
  data: DailyBreakdownRow[]
}

type SortField = 'date' | 'serviceCount' | 'revenue' | 'partsCost' | 'operatingExpenses' | 'net' | 'collected'

export default function DailyBreakdownTable({ data }: Props) {
  const { t } = useTranslation()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1
      if (sortField === 'date') return mult * a.date.localeCompare(b.date)
      return mult * ((a[sortField] as number) - (b[sortField] as number))
    })
  }, [data, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (data.length === 0) return null

  const columns: { field: SortField; label: string }[] = [
    { field: 'date', label: t('reports.financial.date') },
    { field: 'serviceCount', label: t('reports.financial.servicesCol') },
    { field: 'revenue', label: t('reports.financial.revenueCol') },
    { field: 'partsCost', label: t('reports.financial.partsCostCol') },
    { field: 'operatingExpenses', label: t('reports.financial.operatingExpensesCol') },
    { field: 'net', label: t('reports.financial.netCol') },
    { field: 'collected', label: t('reports.financial.collectedCol') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.financial.dailyBreakdown')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.field}
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort(col.field)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="whitespace-nowrap">{row.label}</TableCell>
                  <TableCell>{row.serviceCount}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatMoney(row.revenue)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatMoney(row.partsCost)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatMoney(row.operatingExpenses)}</TableCell>
                  <TableCell className={`whitespace-nowrap font-medium ${row.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatMoney(row.net)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatMoney(row.collected)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
