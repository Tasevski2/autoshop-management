import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Pencil,
  Car,
  Wrench,
  Bell,
  Camera,
  Plus,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useVehicle,
  useVehicleServices,
  useVehicleReminders,
  useVehiclePhotos,
  useCreateReminder,
  useUpdateReminder,
  useDeleteVehicle,
} from '@/features/vehicles/hooks/useVehicles'
import type { ServiceStatus } from '@/features/vehicles/types'

function statusVariant(status: ServiceStatus) {
  switch (status) {
    case 'paid':
      return 'default' as const
    case 'completed':
    case 'invoiced':
    case 'partially_paid':
      return 'secondary' as const
    case 'in_progress':
      return 'outline' as const
    case 'cancelled':
      return 'destructive' as const
  }
}

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function VehicleDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading } = useVehicle(id!)
  const [servicesPage, setServicesPage] = useState(0)
  const { data: servicesResult } = useVehicleServices(id!, servicesPage)
  const services = servicesResult?.data ?? []
  const servicesTotalPages = servicesResult?.totalPages ?? 0
  const { data: reminders = [] } = useVehicleReminders(id!)
  const { data: photos = [] } = useVehiclePhotos(id!)
  const createReminderMutation = useCreateReminder(id!)
  const updateReminderMutation = useUpdateReminder(id!)
  const deleteVehicleMutation = useDeleteVehicle()

  const [showReminderForm, setShowReminderForm] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [reminderDueDate, setReminderDueDate] = useState('')
  const [reminderNotifyDays, setReminderNotifyDays] = useState('10')
  const [reminderNote, setReminderNote] = useState('')

  if (isLoading || !vehicle) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  const customer = vehicle.customers as { id: string; full_name: string; phone: string | null } | null

  const startNewReminder = () => {
    setEditingReminderId(null)
    setReminderDueDate('')
    setReminderNotifyDays('10')
    setReminderNote('')
    setShowReminderForm(true)
  }

  const startEditReminder = (r: (typeof reminders)[number]) => {
    setEditingReminderId(r.id)
    setReminderDueDate(r.due_date)
    setReminderNotifyDays(String(r.notify_days_before))
    setReminderNote(r.note ?? '')
    setShowReminderForm(true)
  }

  const saveReminder = () => {
    if (!reminderDueDate) return
    if (editingReminderId) {
      updateReminderMutation.mutate({
        id: editingReminderId,
        data: {
          due_date: reminderDueDate,
          notify_days_before: parseInt(reminderNotifyDays) || 10,
          note: reminderNote || null,
        },
      })
    } else {
      createReminderMutation.mutate({
        vehicle_id: id!,
        due_date: reminderDueDate,
        notify_days_before: parseInt(reminderNotifyDays) || 10,
        note: reminderNote || null,
      })
    }
    setShowReminderForm(false)
  }

  // Group photos by service date
  const photosByServiceDate = photos.reduce<Record<string, typeof photos>>((acc, photo) => {
    const date = (photo.services as { service_date: string } | null)?.service_date ?? 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(photo)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Back + Edit row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link to={`/vehicles/${id}/edit`} />}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {t('common.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Header + Details cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Vehicle header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-mono font-bold">{vehicle.plate_number}</h2>
                <p className="text-muted-foreground mt-1">
                  {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                </p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.engine_type && (
                <Badge variant="secondary">
                  {t(`vehicles.engineTypes.${vehicle.engine_type}`)}
                </Badge>
              )}
              {vehicle.engine_capacity != null && (
                <Badge variant="outline">{vehicle.engine_capacity.toFixed(1)}L</Badge>
              )}
              {vehicle.engine_designation && (
                <Badge variant="outline">{vehicle.engine_designation}</Badge>
              )}
            </div>
            {customer && (
              <>
                <Separator className="my-3" />
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('vehicles.owner')}: </span>
                  <Link
                    to={`/customers/${customer.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {customer.full_name}
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Details card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('vehicles.details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {vehicle.engine_capacity != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('vehicles.engineCapacity')}</dt>
                  <dd>{vehicle.engine_capacity.toFixed(1)}L</dd>
                </div>
              )}
              {vehicle.engine_designation && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('vehicles.engineDesignation')}</dt>
                  <dd className="font-mono">{vehicle.engine_designation}</dd>
                </div>
              )}
              {vehicle.chassis_number && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('vehicles.chassisNumber')}</dt>
                  <dd className="font-mono">{vehicle.chassis_number}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('vehicles.mileage')}</dt>
                <dd>{vehicle.last_known_mileage != null ? `${vehicle.last_known_mileage.toLocaleString()} км` : '—'}</dd>
              </div>
              {vehicle.notes && (
                <>
                  <Separator />
                  <p className="text-muted-foreground whitespace-pre-wrap">{vehicle.notes}</p>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Services section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('vehicles.services')}
          </h3>
          <Button size="sm" render={<Link to={`/services/new?vehicle=${id}`} />}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t('vehicles.newService')}
          </Button>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('vehicles.noServices')}</p>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('vehicles.date')}</TableHead>
                    <TableHead>{t('vehicles.description')}</TableHead>
                    <TableHead className="text-right">{t('vehicles.total')}</TableHead>
                    <TableHead>{t('vehicles.status')}</TableHead>
                    <TableHead className="text-right">{t('vehicles.balance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/services/${s.id}`)}>
                      <TableCell>{new Date(s.service_date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-48 truncate">{s.notes ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {s.service_total != null ? `${s.service_total.toLocaleString()} ден` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(s.status)}>
                          {t(`customers.statuses.${s.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.balance_due != null && s.balance_due > 0
                          ? `${s.balance_due.toLocaleString()} ден`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {servicesTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.page', { current: servicesPage + 1, total: servicesTotalPages })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={servicesPage === 0} onClick={() => setServicesPage((p) => p - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={servicesPage >= servicesTotalPages - 1} onClick={() => setServicesPage((p) => p + 1)}>
                    {t('common.next')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reminders section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('vehicles.reminders')}
          </h3>
          {!showReminderForm && (
            <Button size="sm" variant="outline" onClick={startNewReminder}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('vehicles.addReminder')}
            </Button>
          )}
        </div>

        {/* New reminder form (not editing) */}
        {showReminderForm && !editingReminderId && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="reminder-due-date">{t('vehicles.dueDate')}</Label>
                  <Input
                    id="reminder-due-date"
                    type="date"
                    value={reminderDueDate}
                    onChange={(e) => setReminderDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminder-notify">{t('vehicles.notifyDaysBefore')}</Label>
                  <Input
                    id="reminder-notify"
                    type="number"
                    value={reminderNotifyDays}
                    onChange={(e) => setReminderNotifyDays(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminder-note">{t('vehicles.reminderNote')}</Label>
                  <Input
                    id="reminder-note"
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={saveReminder}>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReminderForm(false)}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reminders.length === 0 && !showReminderForm ? (
          <p className="text-sm text-muted-foreground">{t('vehicles.noReminders')}</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              // If editing this reminder, show inline edit form instead of the card
              if (editingReminderId === r.id) {
                return (
                  <Card key={r.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label>{t('vehicles.dueDate')}</Label>
                          <Input
                            type="date"
                            value={reminderDueDate}
                            onChange={(e) => setReminderDueDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('vehicles.notifyDaysBefore')}</Label>
                          <Input
                            type="number"
                            value={reminderNotifyDays}
                            onChange={(e) => setReminderNotifyDays(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t('vehicles.reminderNote')}</Label>
                          <Input
                            value={reminderNote}
                            onChange={(e) => setReminderNote(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={saveReminder}>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t('common.save')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowReminderForm(false); setEditingReminderId(null) }}>
                          <X className="mr-1 h-3.5 w-3.5" />
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              const days = daysUntil(r.due_date)
              const isOverdue = days < 0
              const isDueToday = days === 0
              return (
                <Card key={r.id} className={isOverdue ? 'border-destructive/50' : undefined}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {new Date(r.due_date).toLocaleDateString()}
                        {' — '}
                        <span className={isOverdue ? 'text-destructive' : isDueToday ? 'text-primary' : 'text-muted-foreground'}>
                          {isDueToday
                            ? t('vehicles.dueToday')
                            : isOverdue
                              ? t('vehicles.daysOverdue', { count: Math.abs(days) })
                              : t('vehicles.daysRemaining', { count: days })}
                        </span>
                      </p>
                      {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => startEditReminder(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          updateReminderMutation.mutate({
                            id: r.id,
                            data: { is_active: false },
                          })
                        }
                        loading={updateReminderMutation.isPending}
                        title={t('reminders.deactivate')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Photos section */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Camera className="h-5 w-5" />
          {t('vehicles.photos')}
        </h3>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('vehicles.noPhotos')}</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(photosByServiceDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, datePhotos]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {date !== 'unknown' ? new Date(date).toLocaleDateString() : '—'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {datePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-md border overflow-hidden bg-muted"
                      >
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/service-images/${photo.storage_path}`}
                          alt={photo.description ?? photo.file_name ?? ''}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('vehicles.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteVehicleMutation.mutate(id!)}
              loading={deleteVehicleMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
