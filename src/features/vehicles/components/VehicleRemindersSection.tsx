import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Plus, Check, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVehicleReminders, useCreateReminder, useUpdateReminder } from '@/features/vehicles/hooks/useVehicles'
import { DEFAULT_NOTIFY_DAYS } from '@/features/reminders/constants'
import { MS_PER_DAY } from '@/lib/constants'

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / MS_PER_DAY)
}

interface VehicleRemindersSectionProps {
  vehicleId: string
}

export default function VehicleRemindersSection({ vehicleId }: VehicleRemindersSectionProps) {
  const { t } = useTranslation()
  const { data: reminders = [] } = useVehicleReminders(vehicleId)
  const createReminderMutation = useCreateReminder(vehicleId)
  const updateReminderMutation = useUpdateReminder(vehicleId)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [notifyDays, setNotifyDays] = useState(String(DEFAULT_NOTIFY_DAYS))
  const [note, setNote] = useState('')

  const startNew = () => {
    setEditingId(null)
    setDueDate('')
    setNotifyDays(String(DEFAULT_NOTIFY_DAYS))
    setNote('')
    setShowForm(true)
  }

  const startEdit = (r: (typeof reminders)[number]) => {
    setEditingId(r.id)
    setDueDate(r.due_date)
    setNotifyDays(String(r.notify_days_before))
    setNote(r.note ?? '')
    setShowForm(true)
  }

  const save = () => {
    if (!dueDate) return
    const payload = {
      due_date: dueDate,
      notify_days_before: parseInt(notifyDays) || DEFAULT_NOTIFY_DAYS,
      note: note || null,
    }
    if (editingId) {
      updateReminderMutation.mutate({ id: editingId, data: payload })
    } else {
      createReminderMutation.mutate({ vehicle_id: vehicleId, ...payload })
    }
    setShowForm(false)
  }

  const ReminderForm = () => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>{t('vehicles.dueDate')}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('vehicles.notifyDaysBefore')}</Label>
            <Input type="number" value={notifyDays} onChange={(e) => setNotifyDays(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('vehicles.reminderNote')}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={save}>
            <Check className="mr-1 h-3.5 w-3.5" />
            {t('common.save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>
            <X className="mr-1 h-3.5 w-3.5" />
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('vehicles.reminders')}
        </h3>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={startNew}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t('vehicles.addReminder')}
          </Button>
        )}
      </div>

      {showForm && !editingId && <ReminderForm />}

      {reminders.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">{t('vehicles.noReminders')}</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            if (editingId === r.id) {
              return <ReminderForm key={r.id} />
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
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => updateReminderMutation.mutate({ id: r.id, data: { is_active: false } })}
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
  )
}
