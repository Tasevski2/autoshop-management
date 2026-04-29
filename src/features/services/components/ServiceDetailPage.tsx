import { useRef, useState } from 'react'
import { toLocalDateStr } from '@/lib/dates'
import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Pencil,
  Wrench,
  Camera,
  Upload,
  Trash2,
  CreditCard,
  Plus,
  Check,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import ImageLightbox from '@/components/ImageLightbox'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useService,
  useServiceParts,
  useServiceTotals,
  useServiceImages,
  useServicePayments,
  useUploadServiceImage,
  useDeleteServiceImage,
  useUpdateServiceStatus,
  useDeleteService,
  useCreatePayment,
  useDeletePayment,
} from '@/features/services/hooks/useServices'
import type { ServiceStatus, PaymentMethod } from '@/features/services/types'

const STATUSES: ServiceStatus[] = ['in_progress', 'completed', 'invoiced', 'partially_paid', 'paid', 'cancelled']
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer', 'other']


export default function ServiceDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string } | null>(null)
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentDate, setPaymentDate] = useState(toLocalDateStr())
  const [paymentNotes, setPaymentNotes] = useState('')

  const { data: service, isLoading } = useService(id!)
  const { data: parts = [] } = useServiceParts(id!)
  const { data: totals } = useServiceTotals(id!)
  const { data: images = [] } = useServiceImages(id!)
  const { data: payments = [] } = useServicePayments(id!)
  const uploadMutation = useUploadServiceImage(id!)
  const deleteMutation = useDeleteServiceImage(id!)
  const statusMutation = useUpdateServiceStatus(id!)
  const deleteServiceMutation = useDeleteService()
  const createPaymentMutation = useCreatePayment(id!)
  const deletePaymentMutation = useDeletePayment(id!)

  if (isLoading || !service) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
    e.target.value = ''
  }

  const confirmDeleteImage = () => {
    if (!deleteTarget) return
    deleteMutation.mutate({ id: deleteTarget.id, storagePath: deleteTarget.storagePath })
    setDeleteTarget(null)
  }

  const confirmDeletePayment = () => {
    if (!deletePaymentTarget) return
    deletePaymentMutation.mutate(deletePaymentTarget)
    setDeletePaymentTarget(null)
  }

  const imageUrl = (storagePath: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/service-images/${storagePath}`

  const resetPaymentForm = () => {
    setShowPaymentForm(false)
    setPaymentAmount('')
    setPaymentMethod('cash')
    setPaymentDate(toLocalDateStr())
    setPaymentNotes('')
  }

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return
    createPaymentMutation.mutate(
      {
        service_id: id!,
        amount,
        method: paymentMethod,
        payment_date: paymentDate,
        notes: paymentNotes || null,
      },
      { onSuccess: resetPaymentForm }
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Edit row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <select
            value={service.status}
            onChange={(e) => statusMutation.mutate(e.target.value as ServiceStatus)}
            disabled={statusMutation.isPending}
            className="flex h-8 rounded-lg border border-input bg-background px-3 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUSES.map((s) => (
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
                <dd className={totals.balance_due != null && totals.balance_due > 0 ? 'text-destructive' : ''}>
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
          <div className="rounded-md border">
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
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('services.payments')}
          </h3>
          {!showPaymentForm && (
            <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('services.addPayment')}
            </Button>
          )}
        </div>

        {showPaymentForm && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="payment-amount">{t('services.paymentAmount')} *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-method">{t('services.paymentMethod')}</Label>
                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {t(`services.methods.${m}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-date">{t('services.paymentDate')}</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-notes">{t('services.paymentNotes')}</Label>
                  <Input
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleAddPayment} disabled={createPaymentMutation.isPending}>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetPaymentForm}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {payments.length === 0 && !showPaymentForm ? (
          <p className="text-sm text-muted-foreground">{t('services.noPayments')}</p>
        ) : payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold">{p.amount.toLocaleString()} ден</p>
                    <Badge variant="secondary">
                      {t(`services.methods.${p.method}`)}
                    </Badge>
                    {p.notes && (
                      <p className="text-sm text-muted-foreground">{p.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeletePaymentTarget(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

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
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('services.photos')}
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            {t('services.uploadPhoto')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('services.noPhotos')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-md border overflow-hidden bg-muted"
              >
                <img
                  src={imageUrl(img.storage_path)}
                  alt={img.description ?? img.file_name ?? ''}
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => setLightboxIndex(images.indexOf(img))}
                />
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: img.id, storagePath: img.storage_path })}
                  className="absolute top-1 right-1 cursor-pointer rounded-full bg-destructive/80 p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete image confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('services.deletePhoto')}</DialogTitle>
            <DialogDescription>{t('services.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteImage} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete payment confirmation dialog */}
      <Dialog open={!!deletePaymentTarget} onOpenChange={(open) => { if (!open) setDeletePaymentTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('services.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePaymentTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeletePayment} disabled={deletePaymentMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete service confirmation dialog */}
      <Dialog open={deleteServiceOpen} onOpenChange={setDeleteServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('services.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteServiceOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteServiceMutation.mutate(id!)}
              disabled={deleteServiceMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      <ImageLightbox
        images={images.map((img) => ({
          src: imageUrl(img.storage_path),
          alt: img.description ?? img.file_name ?? '',
        }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
