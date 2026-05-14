import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { usePartRankings } from '../hooks/useReports'
import { formatMoney } from '../utils'
import type { PartSortColumn, SortDirection } from '../types'
import { PAGE_SIZE } from '@/lib/constants'

const TITLE_KEYS: Record<PartSortColumn, string> = {
  part_name: 'reports.services.allParts',
  qty_sold: 'reports.services.mostUsedParts',
  buy_cost_total: 'reports.services.partsByBuyCost',
  sell_total: 'reports.services.partsBySellTotal',
  profit: 'reports.services.partsByProfit',
}

interface Props {
  dateFrom: string
  dateTo: string
}

export default function PartRankingsTable({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()
  const [sortColumn, setSortColumn] = useState<PartSortColumn>('qty_sold')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(0)

  // Reset page when sort or date range changes
  useEffect(() => {
    setPage(0)
  }, [sortColumn, sortDirection, dateFrom, dateTo])

  const { data, isLoading } = usePartRankings(
    dateFrom, dateTo, sortColumn, sortDirection, page, PAGE_SIZE
  )

  const rows = data?.rows ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function handleSort(column: PartSortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortColumn(column)
      setSortDirection(column === 'part_name' ? 'asc' : 'desc')
    }
  }

  function SortIcon({ column }: { column: PartSortColumn }) {
    if (column !== sortColumn) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />
  }

  if (isLoading && rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(TITLE_KEYS[sortColumn])}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">{t('reports.noData')}</p>
        </CardContent>
      </Card>
    )
  }

  const sortableColumns: { key: PartSortColumn; label: string; align?: 'right' }[] = [
    { key: 'part_name', label: t('reports.services.part') },
    { key: 'qty_sold', label: t('reports.services.qtySold'), align: 'right' },
    { key: 'buy_cost_total', label: t('reports.services.buyCostTotal'), align: 'right' },
    { key: 'sell_total', label: t('reports.services.sellTotal'), align: 'right' },
    { key: 'profit', label: t('reports.services.profit'), align: 'right' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(TITLE_KEYS[sortColumn])}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {sortableColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`cursor-pointer select-none hover:text-foreground ${col.align === 'right' ? 'text-right' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      {col.label}
                      <SortIcon column={col.key} />
                    </span>
                  </TableHead>
                ))}
                {/* Margin — client-side only, not sortable */}
                <TableHead className="text-right">{t('reports.services.margin')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const margin = row.sell_total > 0
                  ? Math.round(((row.sell_total - row.buy_cost_total) / row.sell_total) * 100)
                  : 0
                return (
                  <TableRow key={row.part_name}>
                    <TableCell className="text-muted-foreground">
                      {page * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.part_name}</TableCell>
                    <TableCell className="text-right">{row.qty_sold}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoney(row.buy_cost_total)} ден.
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoney(row.sell_total)} ден.
                    </TableCell>
                    <TableCell className={`text-right whitespace-nowrap font-medium ${row.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatMoney(row.profit)} ден.
                    </TableCell>
                    <TableCell className={`text-right whitespace-nowrap ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {margin}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('common.page', { current: page + 1, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
