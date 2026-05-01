import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Bell, Phone, X, Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useReminders, useDeactivateReminder } from '@/features/reminders/hooks/useReminders'

function getDaysUntil(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function DueBadge({ dueDate }: { dueDate: string }) {
  const { t } = useTranslation()
  const days = getDaysUntil(dueDate)

  if (days === 0) {
    return <Badge variant="default">{t('vehicles.dueToday')}</Badge>
  }
  if (days < 0) {
    return (
      <Badge variant="destructive">
        {t('vehicles.daysOverdue', { count: Math.abs(days) })}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      {t('vehicles.daysRemaining', { count: days })}
    </Badge>
  )
}

type ReminderWithVehicle = {
  id: string
  vehicle_id: string
  due_date: string
  notify_days_before: number
  note: string | null
  is_active: boolean
  vehicles: {
    id: string
    plate_number: string
    brand: string
    model: string | null
    customer_id: string
    customers: {
      id: string
      full_name: string
      phone: string | null
    } | null
  } | null
}

function RemindersTable({
  reminders,
  showDeactivate,
}: {
  reminders: ReminderWithVehicle[]
  showDeactivate: boolean
}) {
  const { t } = useTranslation()
  const deactivateMutation = useDeactivateReminder()

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reminders.customer')}</TableHead>
            <TableHead>{t('reminders.vehicle')}</TableHead>
            <TableHead>{t('reminders.dueDate')}</TableHead>
            <TableHead>{t('reminders.status')}</TableHead>
            <TableHead>{t('reminders.note')}</TableHead>
            <TableHead>{t('reminders.notifyDays')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map((r) => {
            const vehicle = r.vehicles
            const customer = vehicle?.customers
            return (
              <TableRow key={r.id}>
                <TableCell>
                  {customer ? (
                    <div>
                      <Link
                        to={`/customers/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.full_name}
                      </Link>
                      {customer.phone && (
                        <p className="text-muted-foreground text-xs">{customer.phone}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle ? (
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="text-sm hover:underline"
                    >
                      {vehicle.plate_number} — {vehicle.brand}
                      {vehicle.model ? ` ${vehicle.model}` : ''}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(r.due_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DueBadge dueDate={r.due_date} />
                </TableCell>
                <TableCell className="max-w-48 truncate">
                  {r.note || '—'}
                </TableCell>
                <TableCell>{r.notify_days_before}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link to={`/reminders/${r.id}/edit`} />}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {customer?.phone && (
                      <Button variant="ghost" size="icon-sm" render={<a href={`tel:${customer.phone}`} title={t('reminders.call')} />}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {showDeactivate && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={t('reminders.deactivate')}
                        onClick={() =>
                          deactivateMutation.mutate({
                            id: r.id,
                            updates: { is_active: false },
                          })
                        }
                        loading={deactivateMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function RemindersPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [activePage, setActivePage] = useState(0)
  const [completedPage, setCompletedPage] = useState(0)
  const { data: activeResult, isLoading: loadingActive } = useReminders(true, activePage)
  const { data: completedResult, isLoading: loadingCompleted } = useReminders(false, completedPage)

  const activeReminders = activeResult?.data ?? []
  const activeTotal = activeResult?.count ?? 0
  const activeTotalPages = activeResult?.totalPages ?? 0
  const completedReminders = completedResult?.data ?? []
  const completedTotalPages = completedResult?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('nav.reminders')}</h1>
        </div>
        <Button size="sm" render={<Link to="/reminders/new" />}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t('reminders.new')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'completed')}>
        <TabsList>
          <TabsTrigger value="active">
            {t('reminders.active')}
            {activeTotal > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {activeTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('reminders.completed')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loadingActive ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('common.loading')}
            </p>
          ) : activeReminders.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('reminders.noReminders')}
            </p>
          ) : (
            <>
              <RemindersTable
                reminders={activeReminders as ReminderWithVehicle[]}
                showDeactivate
              />
              {activeTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page', { current: activePage + 1, total: activeTotalPages })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={activePage === 0} onClick={() => setActivePage((p) => p - 1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      {t('common.previous')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={activePage >= activeTotalPages - 1} onClick={() => setActivePage((p) => p + 1)}>
                      {t('common.next')}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {loadingCompleted ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('common.loading')}
            </p>
          ) : completedReminders.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('reminders.noCompleted')}
            </p>
          ) : (
            <>
              <RemindersTable
                reminders={completedReminders as ReminderWithVehicle[]}
                showDeactivate={false}
              />
              {completedTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page', { current: completedPage + 1, total: completedTotalPages })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={completedPage === 0} onClick={() => setCompletedPage((p) => p - 1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      {t('common.previous')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={completedPage >= completedTotalPages - 1} onClick={() => setCompletedPage((p) => p + 1)}>
                      {t('common.next')}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
