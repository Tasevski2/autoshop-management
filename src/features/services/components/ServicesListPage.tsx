import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Wrench, Check, X as XIcon } from 'lucide-react'
import { DEBOUNCE_DELAY_MS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useServices, useUpdateServiceStatus, useDeleteService } from '@/features/services/hooks/useServices'
import { SERVICE_STATUSES, type ServiceStatus } from '@/lib/enums'
import { PageSpinner } from '@/components/PageSpinner'

function StatusSelect({ serviceId, status }: { serviceId: string; status: ServiceStatus }) {
  const { t } = useTranslation()
  const mutation = useUpdateServiceStatus(serviceId)

  return (
    <select
      value={status}
      onChange={(e) => mutation.mutate(e.target.value as ServiceStatus)}
      onClick={(e) => e.stopPropagation()}
      disabled={mutation.isPending}
      className="flex h-7 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {SERVICE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`services.statuses.${s}`)}
        </option>
      ))}
    </select>
  )
}

export default function ServicesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const deleteMutation = useDeleteService()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, DEBOUNCE_DELAY_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const { data: result, isLoading } = useServices({
    page,
    search: debouncedSearch,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })
  const services = result?.data ?? []
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
          <Wrench className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">{t('nav.services')}</h2>
        </div>
        <Button render={<Link to="/services/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          {t('services.new')}
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full md:max-w-sm md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0) }}
          className="flex h-8 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('services.allStatuses')}</option>
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`services.statuses.${s}`)}
            </option>
          ))}
        </select>
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
        <PageSpinner />
      ) : services.length === 0 ? (
        <p className="text-muted-foreground">{t('common.noResults')}</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('services.date')}</TableHead>
                  <TableHead>{t('services.customer')}</TableHead>
                  <TableHead>{t('services.vehicle')}</TableHead>
                  <TableHead>{t('services.status')}</TableHead>
                  <TableHead className="text-right">{t('services.total')}</TableHead>
                  <TableHead className="text-right">{t('services.balance')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => {
                  const vehicle = s.vehicles as {
                    plate_number: string
                    brand: string
                    model: string | null
                    customers: { full_name: string } | null
                  } | null
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/services/${s.id}`)}
                    >
                      <TableCell>{new Date(s.service_date).toLocaleDateString()}</TableCell>
                      <TableCell>{vehicle?.customers?.full_name ?? '—'}</TableCell>
                      <TableCell className="font-mono">
                        {vehicle?.plate_number ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusSelect serviceId={s.id} status={s.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {s.service_total != null ? `${s.service_total.toLocaleString()} ден` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.balance_due != null && s.balance_due > 0 ? (
                          <span className="inline-flex items-center gap-1 text-destructive font-medium">
                            <XIcon className="h-3.5 w-3.5" />
                            {s.balance_due.toLocaleString()} ден
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check className="h-3.5 w-3.5" />
                            0 ден
                          </span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            render={<Link to={`/services/${s.id}/edit`} />}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteTarget(s.id)}
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
            <DialogDescription>{t('services.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
