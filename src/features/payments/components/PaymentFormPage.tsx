import { useState } from 'react'
import { toLocalDateStr } from '@/lib/dates'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ServicePicker from './ServicePicker'
import { useCreatePaymentFromForm } from '@/features/payments/hooks/usePayments'
import type { PaymentMethod } from '@/features/payments/types'

const METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer', 'other']


export default function PaymentFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreatePaymentFromForm()

  const [serviceId, setServiceId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paymentDate, setPaymentDate] = useState(toLocalDateStr())
  const [notes, setNotes] = useState('')

  const handleServiceChange = (id: string, info: { balance_due: number }) => {
    setServiceId(id || null)
    if (id && info.balance_due > 0) {
      setAmount(String(info.balance_due))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceId || !amount || parseFloat(amount) <= 0) return
    createMutation.mutate({
      service_id: serviceId,
      amount: parseFloat(amount),
      method,
      payment_date: paymentDate,
      notes: notes || null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{t('payments.new')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('payments.new')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('payments.selectService')}</Label>
              <ServicePicker value={serviceId} onChange={handleServiceChange} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="amount">{t('payments.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="method">{t('payments.method')}</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(`payments.methods.${m}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date">{t('payments.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">{t('payments.notes')}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!serviceId || !amount || parseFloat(amount) <= 0 || createMutation.isPending}
              >
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
