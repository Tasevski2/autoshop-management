import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Pencil,
  Wrench,
  Trash2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import ServicePaymentsSection from './ServicePaymentsSection'
import ServicePhotosSection from './ServicePhotosSection'
import {
  useService,
  useServiceParts,
  useServiceTotals,
  useUpdateServiceStatus,
  useDeleteService,
} from '@/features/services/hooks/useServices'
import { SERVICE_STATUSES, type ServiceStatus } from '@/lib/enums'
import { PageSpinner } from '@/components/PageSpinner'


export default function ServiceDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false)

  const { data: service, isLoading } = useService(id!)
  const { data: parts = [] } = useServiceParts(id!)
  const { data: totals } = useServiceTotals(id!)
  const statusMutation = useUpdateServiceStatus(id!)
  const deleteServiceMutation = useDeleteService()

  if (isLoading || !service) {
    return <PageSpinner />
  }

  const vehicle = service.vehicles as {
    id: string
    plate_number: string
    brand: string
    model: string | null
    engine_capacity: number | null
    engine_designation: string | null
    customer_id: string
    customers: { id: string; full_name: string; phone: string | null } | null
  } | null

  return (
    <div className="space-y-6">
      {/* Back + Edit row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('common.back')}
          </Button>
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={service.status}
              onChange={(e) => statusMutation.mutate(e.target.value as ServiceStatus)}
              disabled={statusMutation.isPending}
              className="flex h-8 rounded-lg border border-input bg-background px-3 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SERVICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`services.statuses.${s}`)}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" render={<Link to={`/services/${id}/invoice`} />}>
              <FileText className="mr-2 h-3.5 w-3.5" />
              {t('services.generateInvoice')}
            </Button>
            <Button variant="outline" size="sm" render={<Link to={`/services/${id}/edit`} />}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t('common.edit')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteServiceOpen(true)}>
              <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
              {t('common.delete')}
            </Button>
          </div>
          {/* Mobile: edit + delete icons on same row as back */}
          <div className="flex sm:hidden items-center gap-1">
            <Button variant="outline" size="icon-sm" render={<Link to={`/services/${id}/edit`} />}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setDeleteServiceOpen(true)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        {/* Mobile: status + generate invoice on second row */}
        <div className="flex sm:hidden items-center justify-end gap-2">
          <select
            value={service.status}
            onChange={(e) => statusMutation.mutate(e.target.value as ServiceStatus)}
            disabled={statusMutation.isPending}
            className="flex h-8 rounded-lg border border-input bg-background px-3 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`services.statuses.${s}`)}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" render={<Link to={`/services/${id}/invoice`} />}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            {t('services.generateInvoice')}
          </Button>
        </div>
      </div>

      {/* Context card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {vehicle && (
                <div>
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="font-mono text-xl font-bold text-primary hover:underline"
                  >
                    {vehicle.plate_number}
                  </Link>
                  <p className="text-muted-foreground">
                    {vehicle.brand} {vehicle.model}
                    {vehicle.engine_capacity != null ? ` ${Number(vehicle.engine_capacity).toFixed(1)}L` : ''}
                    {vehicle.engine_designation ? ` (${vehicle.engine_designation})` : ''}
                  </p>
                </div>
              )}
              {vehicle?.customers && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('services.customer')}: </span>
                  <Link
                    to={`/customers/${vehicle.customers.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {vehicle.customers.full_name}
                  </Link>
                </div>
              )}
            </div>
            <Wrench className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <Separator className="my-3" />
          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('services.date')}</dt>
              <dd className="font-medium">{new Date(service.service_date).toLocaleDateString()}</dd>
            </div>
            {service.mileage_at_service != null && (
              <div>
                <dt className="text-muted-foreground">{t('services.mileage')}</dt>
                <dd className="font-medium">{service.mileage_at_service.toLocaleString()} км</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Totals card */}
      {totals && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('services.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('services.laborCost')}</dt>
                <dd>{totals.labor_cost != null ? `${totals.labor_cost.toLocaleString()} ден` : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('services.partsTotal')}</dt>
                <dd>{totals.parts_total != null ? `${totals.parts_total.toLocaleString()} ден` : '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <dt>{t('services.total')}</dt>
                <dd>{totals.service_total != null ? `${totals.service_total.toLocaleString()} ден` : '—'}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>{t('services.profit')}</dt>
                <dd>
                  <Badge variant={totals.parts_profit != null && totals.parts_profit >= 0 ? 'secondary' : 'destructive'}>
                    {totals.parts_profit != null ? `${totals.parts_profit.toLocaleString()} ден` : '—'}
                  </Badge>
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('services.totalPaid')}</dt>
                <dd>{totals.total_paid != null ? `${totals.total_paid.toLocaleString()} ден` : '0 ден'}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{t('services.balance')}</dt>
                <dd className={totals.balance_due != null && totals.balance_due > 0 ? 'text-destructive font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                  {totals.balance_due != null ? `${totals.balance_due.toLocaleString()} ден` : '0 ден'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Parts table */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('services.parts')}</h3>
        {parts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('services.noParts')}</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('services.partName')}</TableHead>
                  <TableHead className="text-right">{t('services.quantity')}</TableHead>
                  <TableHead className="text-right">{t('services.buyPrice')}</TableHead>
                  <TableHead className="text-right">{t('services.sellPrice')}</TableHead>
                  <TableHead className="text-right">{t('services.rowTotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">{p.buy_price.toLocaleString()} ден</TableCell>
                    <TableCell className="text-right">{p.sell_price.toLocaleString()} ден</TableCell>
                    <TableCell className="text-right font-medium">
                      {(p.sell_price * p.quantity).toLocaleString()} ден
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    {t('services.partsTotal')}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totals?.parts_total != null ? `${totals.parts_total.toLocaleString()} ден` : '—'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      {/* Payments section */}
      <ServicePaymentsSection serviceId={id!} />

      {/* Notes */}
      {service.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('services.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{service.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos section */}
      <ServicePhotosSection serviceId={id!} />

      {/* Delete service confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteServiceOpen}
        onOpenChange={setDeleteServiceOpen}
        onConfirm={() => deleteServiceMutation.mutate(id!)}
        description={t('services.deleteConfirm')}
        isPending={deleteServiceMutation.isPending}
      />
    </div>
  )
}
