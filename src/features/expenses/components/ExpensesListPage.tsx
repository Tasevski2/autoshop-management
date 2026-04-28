import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { DollarSign, Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExpenses, useExpenseTotals, useDeleteExpense } from '@/features/expenses/hooks/useExpenses'
import type { ExpenseCategory } from '@/features/expenses/types'

const CATEGORIES: ExpenseCategory[] = [
  'rent', 'utilities', 'tools', 'salary', 'supplies',
  'maintenance', 'insurance', 'taxes', 'other',
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  tools: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  salary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  supplies: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  insurance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  taxes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
}

export default function ExpensesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const deleteMutation = useDeleteExpense()

  const filterParams = {
    category: category || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { data: result, isLoading } = useExpenses({ page, ...filterParams })
  const { data: totals } = useExpenseTotals(filterParams)
  const expenses = result?.data ?? []
  const totalPages = result?.totalPages ?? 0

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">{t('nav.expenses')}</h2>
        </div>
        <Button render={<Link to="/expenses/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          {t('expenses.new')}
        </Button>
      </div>

      {/* Totals bar */}
      {totals && totals.total > 0 && (
        <div className="rounded-md border bg-muted/50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-semibold">
              {t('expenses.total')}: {totals.total.toLocaleString()} ден
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const amount = totals.byCategory.get(cat)
                if (!amount) return null
                return (
                  <Badge key={cat} className={CATEGORY_COLORS[cat]}>
                    {t(`expenses.categories.${cat}`)}: {amount.toLocaleString()} ден
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value as ExpenseCategory | ''); setPage(0) }}
          className="flex h-8 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('expenses.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`expenses.categories.${c}`)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
            className="w-36"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
            className="w-36"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : expenses.length === 0 ? (
        <p className="text-muted-foreground">{t('expenses.noExpenses')}</p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('expenses.date')}</TableHead>
                  <TableHead>{t('expenses.category')}</TableHead>
                  <TableHead>{t('expenses.description')}</TableHead>
                  <TableHead className="text-right">{t('expenses.amount')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/expenses/${exp.id}/edit`)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[exp.category]}>
                        {t(`expenses.categories.${exp.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {exp.description || '—'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">
                      {Number(exp.amount).toLocaleString()} ден
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          render={<Link to={`/expenses/${exp.id}/edit`} />}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(exp.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.page', { current: page + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('expenses.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
