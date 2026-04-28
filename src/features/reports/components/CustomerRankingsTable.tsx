import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useCustomerRankings } from '../hooks/useReports'
import { formatMoney } from '../utils'
import type { CustomerSortColumn } from '../types'

const PAGE_SIZE = 20

const TITLE_KEYS: Record<CustomerSortColumn, string> = {
  full_name: 'reports.customers.allCustomers',
  services_count: 'reports.customers.topByVisits',
  total_revenue: 'reports.customers.topByRevenue',
  profit: 'reports.customers.topByProfit',
  collected: 'reports.customers.topByCollected',
  owes: 'reports.customers.topByDebt',
}

interface Props {
  dateFrom: string
  dateTo: string
}

export default function CustomerRankingsTable({ dateFrom, dateTo }: Props) {
  const { t } = useTranslation()
  const [sortColumn, setSortColumn] = useState<CustomerSortColumn>('total_revenue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  // Reset page when sort or date range changes
  useEffect(() => {
    setPage(0)
  }, [sortColumn, sortDirection, dateFrom, dateTo])

  const { data, isLoading } = useCustomerRankings(
    dateFrom, dateTo, sortColumn, sortDirection, page, PAGE_SIZE
  )

  const rows = data?.rows ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function handleSort(column: CustomerSortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortColumn(column)
      setSortDirection(column === 'full_name' ? 'asc' : 'desc')
    }
  }

  function SortIcon({ column }: { column: CustomerSortColumn }) {
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

  const columns: { key: CustomerSortColumn; label: string; align?: 'right' }[] = [
    { key: 'full_name', label: t('reports.customers.customer') },
    { key: 'services_count', label: t('reports.customers.services'), align: 'right' },
    { key: 'total_revenue', label: t('reports.customers.totalRevenue'), align: 'right' },
    { key: 'profit', label: t('reports.customers.profit'), align: 'right' },
    { key: 'collected', label: t('reports.customers.collected'), align: 'right' },
    { key: 'owes', label: t('reports.customers.owes'), align: 'right' },
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
                {columns.map((col) => (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.customer_id}>
                  <TableCell className="text-muted-foreground">
                    {page * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/customers/${row.customer_id}`}
                      className="text-primary hover:underline"
                    >
                      {row.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{row.services_count}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.total_revenue)} ден.
                  </TableCell>
                  <TableCell className={`text-right whitespace-nowrap ${row.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatMoney(row.profit)} ден.
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-green-600 dark:text-green-400">
                    {formatMoney(row.collected)} ден.
                  </TableCell>
                  <TableCell className={`text-right whitespace-nowrap font-medium ${row.owes > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {row.owes > 0 ? `${formatMoney(row.owes)} ден.` : '0 ден.'}
                  </TableCell>
                </TableRow>
              ))}
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
