import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { ExpenseCategoryItem, PaymentMethodItem } from '../types'
import { formatMoney } from '../utils'
import { tooltipStyle, cursorStyle } from '../chart-config'

interface Props {
  expenses: ExpenseCategoryItem[]
  payments: PaymentMethodItem[]
  totalInvoiced: number
  totalCollected: number
  uncollected: number
}

const DONUT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
]

export default function ExpensesPaymentsRow({ expenses, payments, totalInvoiced, totalCollected, uncollected }: Props) {
  const { t } = useTranslation()

  const methodLabels: Record<string, string> = {
    cash: t('services.methods.cash'),
    card: t('services.methods.card'),
    bank_transfer: t('services.methods.bank_transfer'),
    other: t('services.methods.other'),
  }

  const categoryLabels: Record<string, string> = {
    rent: t('expenses.categories.rent'),
    utilities: t('expenses.categories.utilities'),
    tools: t('expenses.categories.tools'),
    salary: t('expenses.categories.salary'),
    supplies: t('expenses.categories.supplies'),
    maintenance: t('expenses.categories.maintenance'),
    insurance: t('expenses.categories.insurance'),
    taxes: t('expenses.categories.taxes'),
    other: t('expenses.categories.other'),
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.financial.expensesByCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('reports.noData')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(150, expenses.length * 36)}>
                <BarChart data={expenses} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => formatMoney(v)} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(c) => categoryLabels[c] ?? c}
                    width={75}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    cursor={cursorStyle}
                    formatter={(value: number) => [`${formatMoney(value)} ден.`]}
                    labelFormatter={(label) => categoryLabels[label] ?? label}
                  />
                  <Bar dataKey="amount" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {expenses.map((e) => (
                  <div key={e.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{categoryLabels[e.category] ?? e.category}</span>
                    <span>{formatMoney(e.amount)} ден. ({Math.round(e.percentage)}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payments by Method */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.financial.paymentsByMethod')}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('reports.noData')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={payments}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ method, amount }) =>
                      `${methodLabels[method] ?? method}: ${formatMoney(amount)}`
                    }
                  >
                    {payments.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value: number) => [`${formatMoney(value)} ден.`]} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reports.financial.totalInvoiced')}</span>
                  <span className="font-medium">{formatMoney(totalInvoiced)} ден.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reports.financial.totalCollected')}</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatMoney(totalCollected)} ден.
                  </span>
                </div>
                {uncollected > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reports.financial.uncollected')}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {formatMoney(uncollected)} ден.
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
