import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Car } from 'lucide-react'
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
import { useVehicles, useDeleteVehicle } from '@/features/vehicles/hooks/useVehicles'

export default function VehiclesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const deleteMutation = useDeleteVehicle()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const { data: result, isLoading } = useVehicles({ page, search: debouncedSearch })
  const vehicles = result?.data ?? []
  const totalPages = result?.totalPages ?? 0

  const getLastServiceDate = (v: (typeof vehicles)[number]) => {
    const lastService = v.last_service as { service_date: string } | null
    return lastService?.service_date ?? null
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">{t('nav.vehicles')}</h2>
        </div>
        <Button render={<Link to="/vehicles/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          {t('vehicles.new')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : vehicles.length === 0 ? (
        <p className="text-muted-foreground">{t('common.noResults')}</p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vehicles.plateNumber')}</TableHead>
                  <TableHead>{t('vehicles.brand')} / {t('vehicles.model')}</TableHead>
                  <TableHead>{t('vehicles.owner')}</TableHead>
                  <TableHead>{t('vehicles.lastService')}</TableHead>
                  <TableHead className="text-right">{t('vehicles.mileage')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => {
                  const customer = v.customers as { full_name: string } | null
                  const lastService = getLastServiceDate(v)
                  return (
                    <TableRow key={v.id} className="cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                      <TableCell className="font-mono font-bold">{v.plate_number}</TableCell>
                      <TableCell>
                        {v.brand} {v.model}
                        {v.engine_capacity != null ? ` ${v.engine_capacity.toFixed(1)}L` : ''}
                        {v.engine_designation ? ` (${v.engine_designation})` : ''}
                        {v.year ? ` — ${v.year}` : ''}
                      </TableCell>
                      <TableCell>{customer?.full_name ?? '—'}</TableCell>
                      <TableCell>
                        {lastService ? new Date(lastService).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.last_known_mileage != null ? v.last_known_mileage.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            render={<Link to={`/vehicles/${v.id}/edit`} />}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteTarget(v.id)}
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
            <DialogDescription>{t('vehicles.deleteConfirm')}</DialogDescription>
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
