import { useState } from 'react'
import { toLocalDateStr } from '@/lib/dates'
import { useTranslation } from 'react-i18next'
import { CreditCard, Plus, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { useCreatePayment, useDeletePayment, useServicePayments } from '@/features/services/hooks/useServices'
import { PAYMENT_METHODS, PAYMENT_METHOD, type PaymentMethod } from '@/lib/enums'

interface ServicePaymentsSectionProps {
  serviceId: string
}

export default function ServicePaymentsSection({ serviceId }: ServicePaymentsSectionProps) {
  const { t } = useTranslation()
  const { data: payments = [] } = useServicePayments(serviceId)
  const createPaymentMutation = useCreatePayment(serviceId)
  const deletePaymentMutation = useDeletePayment(serviceId)

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CASH)
  const [date, setDate] = useState(toLocalDateStr())
  const [notes, setNotes] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const resetForm = () => {
    setShowForm(false)
    setAmount('')
    setMethod(PAYMENT_METHOD.CASH)
    setDate(toLocalDateStr())
    setNotes('')
  }

  const handleAdd = () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return
    createPaymentMutation.mutate(
      {
        service_id: serviceId,
        amount: parsed,
        method,
        payment_date: date,
        notes: notes || null,
      },
      { onSuccess: resetForm },
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('services.payments')}
        </h3>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t('services.addPayment')}
          </Button>
        )}
      </div>

      {showForm && (
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="payment-method">{t('services.paymentMethod')}</Label>
                <select
                  id="payment-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="payment-notes">{t('services.paymentNotes')}</Label>
                <Input
                  id="payment-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAdd} loading={createPaymentMutation.isPending}>
                <Check className="mr-1 h-3.5 w-3.5" />
                {t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="mr-1 h-3.5 w-3.5" />
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">{t('services.noPayments')}</p>
      ) : payments.length > 0 ? (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </p>
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
                  onClick={() => setDeleteTarget(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => {
          if (deleteTarget) deletePaymentMutation.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
        description={t('services.deleteConfirm')}
        isPending={deletePaymentMutation.isPending}
      />
    </div>
  )
}
