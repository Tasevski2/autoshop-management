import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CreditCard, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
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
import { usePayments, useDeletePaymentFromList } from '@/features/payments/hooks/usePayments'

export default function PaymentsListPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const deleteMutation = useDeletePaymentFromList()

  const { data: result, isLoading } = usePayments({
    page,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })
  const payments = result?.data ?? []
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
          <CreditCard className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">{t('payments.title')}</h2>
        </div>
        <Button render={<Link to="/payments/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          {t('payments.new')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
            className="w-34"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
            className="w-34"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground">{t('payments.noPayments')}</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payments.date')}</TableHead>
                  <TableHead>{t('payments.customer')}</TableHead>
                  <TableHead>{t('payments.vehicle')}</TableHead>
                  <TableHead className="text-right">{t('payments.amount')}</TableHead>
                  <TableHead>{t('payments.method')}</TableHead>
                  <TableHead>{t('payments.notes')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const service = p.services as {
                    id: string
                    service_date: string
                    status: string
                    vehicles: {
                      plate_number: string
                      brand: string
                      model: string | null
                      customers: { full_name: string } | null
                    } | null
                  } | null
                  const vehicle = service?.vehicles
                  const customer = vehicle?.customers

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{customer?.full_name ?? '—'}</TableCell>
                      <TableCell className="font-mono">
                        {vehicle?.plate_number ?? '—'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {Number(p.amount).toLocaleString()} ден
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`payments.methods.${p.method}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {p.notes || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
            <DialogDescription>{t('payments.deleteConfirm')}</DialogDescription>
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
