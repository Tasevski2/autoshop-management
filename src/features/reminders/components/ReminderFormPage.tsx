import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VehiclePicker from '@/features/services/components/VehiclePicker'
import {
  useReminder,
  useCreateReminderFromPage,
  useUpdateReminderFromPage,
} from '@/features/reminders/hooks/useReminders'
import { PageSpinner } from '@/components/PageSpinner'

function formatVehicleDisplay(v: { plate_number: string; brand: string; model: string | null; engine_capacity?: number | null; engine_designation?: string | null }) {
  let label = `${v.plate_number} — ${v.brand}${v.model ? ` ${v.model}` : ''}`
  if (v.engine_capacity != null) label += ` ${v.engine_capacity.toFixed(1)}L`
  if (v.engine_designation) label += ` (${v.engine_designation})`
  return label
}

interface FormDefaults {
  vehicleId: string | null
  vehicleDisplay: string | undefined
  dueDate: string
  notifyDays: string
  note: string
}

function ReminderForm({
  defaults,
  editId,
}: {
  defaults: FormDefaults
  editId?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isEdit = Boolean(editId)

  const [vehicleId, setVehicleId] = useState<string | null>(defaults.vehicleId)
  const [vehicleDisplay, setVehicleDisplay] = useState<string | undefined>(defaults.vehicleDisplay)
  const [dueDate, setDueDate] = useState(defaults.dueDate)
  const [notifyDays, setNotifyDays] = useState(defaults.notifyDays)
  const [note, setNote] = useState(defaults.note)

  const createMutation = useCreateReminderFromPage()
  const updateMutation = useUpdateReminderFromPage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !dueDate) return

    if (isEdit && editId) {
      updateMutation.mutate(
        {
          id: editId,
          updates: {
            vehicle_id: vehicleId,
            due_date: dueDate,
            notify_days_before: parseInt(notifyDays) || 10,
            note: note || null,
          },
        },
        { onSuccess: () => navigate('/reminders') }
      )
    } else {
      createMutation.mutate(
        {
          vehicle_id: vehicleId,
          due_date: dueDate,
          notify_days_before: parseInt(notifyDays) || 10,
          note: note || null,
        },
        { onSuccess: () => navigate('/reminders') }
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('reminders.edit') : t('reminders.new')}
        </h2>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            {isEdit ? t('reminders.editDetails') : t('reminders.newDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('reminders.vehicle')} *</Label>
              <VehiclePicker
                value={vehicleId}
                displayName={vehicleDisplay}
                onChange={(pickedId, vehicle) => {
                  setVehicleId(pickedId)
                  if (vehicle) {
                    setVehicleDisplay(formatVehicleDisplay(vehicle))
                  }
                }}
              />
              {!vehicleId && (
                <p className="text-xs text-muted-foreground">
                  {t('reminders.vehicleRequired')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">{t('reminders.dueDate')} *</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-days">{t('reminders.notifyDays')}</Label>
              <Input
                id="notify-days"
                type="number"
                value={notifyDays}
                onChange={(e) => setNotifyDays(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">{t('reminders.note')}</Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!vehicleId || !dueDate} loading={isPending}>
                {t('common.save')}
              </Button>
              <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReminderFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { data: existing, isLoading } = useReminder(id)

  if (isEdit && isLoading) {
    return <PageSpinner />
  }

  if (isEdit && existing) {
    const v = existing.vehicles as { id: string; plate_number: string; brand: string; model: string | null } | null
    return (
      <ReminderForm
        key={existing.id}
        editId={existing.id}
        defaults={{
          vehicleId: existing.vehicle_id,
          vehicleDisplay: v ? formatVehicleDisplay(v) : undefined,
          dueDate: existing.due_date,
          notifyDays: String(existing.notify_days_before),
          note: existing.note ?? '',
        }}
      />
    )
  }

  return (
    <ReminderForm
      defaults={{
        vehicleId: null,
        vehicleDisplay: undefined,
        dueDate: '',
        notifyDays: '10',
        note: '',
      }}
    />
  )
}
