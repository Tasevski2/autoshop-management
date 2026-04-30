import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FileText, RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useInvoices, useDeleteInvoice } from '@/features/invoices/hooks/useInvoices'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data, isLoading } = useInvoices({ page, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
  const deleteMutation = useDeleteInvoice()

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    })
  }
  const invoices = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">{t('invoices.title')}</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('invoices.dateFrom')}</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
            className="w-34"
          />
        </div>
        <div className="space-y-1">
          <Label>{t('invoices.dateTo')}</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
            className="w-34"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : invoices.length === 0 ? (
        <p className="text-muted-foreground">{t('invoices.noInvoices')}</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">{t('invoices.invoiceNumber')}</TableHead>
                  <TableHead>{t('invoices.date')}</TableHead>
                  <TableHead>{t('invoices.dueDate')}</TableHead>
                  <TableHead>{t('invoices.vehicle')}</TableHead>
                  <TableHead>{t('invoices.customer')}</TableHead>
                  <TableHead className="text-right">{t('invoices.total')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const svc = inv.services as {
                    id: string
                    service_date: string
                    vehicles: {
                      plate_number: string
                      brand: string
                      model: string | null
                      customers: { full_name: string } | null
                    } | null
                  } | null
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{new Date(inv.issued_at).toLocaleDateString()}</TableCell>
                      <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        {svc?.vehicles && (
                          <span className="font-mono">{svc.vehicles.plate_number}</span>
                        )}
                      </TableCell>
                      <TableCell>{svc?.vehicles?.customers?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {inv.service_total != null ? `${inv.service_total.toLocaleString()} ден` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {svc && (
                            <Button variant="outline" size="sm" render={<Link to={`/services/${svc.id}/invoice`} />}>
                              <RotateCw className="mr-1 h-3.5 w-3.5" />
                              {t('invoices.regenerate')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteTarget(inv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
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
            <DialogDescription>{t('invoices.deleteConfirm')}</DialogDescription>
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
