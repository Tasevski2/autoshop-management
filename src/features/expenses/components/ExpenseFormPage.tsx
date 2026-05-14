import { useState } from 'react'
import { toLocalDateStr } from '@/lib/dates'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useExpense,
  useCreateExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks/useExpenses'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY, type ExpenseCategory } from '@/lib/enums'
import { PageSpinner } from '@/components/PageSpinner'

interface FormDefaults {
  expenseDate: string
  amount: string
  category: ExpenseCategory
  description: string
}

function ExpenseForm({
  defaults,
  editId,
}: {
  defaults: FormDefaults
  editId?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isEdit = Boolean(editId)

  const [expenseDate, setExpenseDate] = useState(defaults.expenseDate)
  const [amount, setAmount] = useState(defaults.amount)
  const [category, setCategory] = useState<ExpenseCategory>(defaults.category)
  const [description, setDescription] = useState(defaults.description)

  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseDate || !amount) return

    const payload = {
      expense_date: expenseDate,
      amount: parseFloat(amount),
      category,
      description: description || null,
    }

    if (isEdit && editId) {
      updateMutation.mutate(
        { id: editId, updates: payload },
        { onSuccess: () => navigate('/expenses') }
      )
    } else {
      // Need user_id for insert
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      createMutation.mutate(
        { ...payload, user_id: user.id },
        { onSuccess: () => navigate('/expenses') }
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
          {isEdit ? t('expenses.edit') : t('expenses.new')}
        </h2>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            {isEdit ? t('expenses.editDetails') : t('expenses.newDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">{t('expenses.date')} *</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t('expenses.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('expenses.category')} *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`expenses.categories.${c}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('expenses.description')}</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!expenseDate || !amount} loading={isPending}>
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

export default function ExpenseFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { data: existing, isLoading } = useExpense(id)

  if (isEdit && isLoading) {
    return <PageSpinner />
  }

  if (isEdit && existing) {
    return (
      <ExpenseForm
        key={existing.id}
        editId={existing.id}
        defaults={{
          expenseDate: existing.expense_date,
          amount: String(existing.amount),
          category: existing.category,
          description: existing.description ?? '',
        }}
      />
    )
  }

  return (
    <ExpenseForm
      defaults={{
        expenseDate: toLocalDateStr(),
        amount: '',
        category: EXPENSE_CATEGORY.OTHER,
        description: '',
      }}
    />
  )
}
