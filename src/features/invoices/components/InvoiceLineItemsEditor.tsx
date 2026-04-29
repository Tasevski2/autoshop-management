import { useTranslation } from 'react-i18next'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InvoiceLineItem } from '@/features/invoices/types'

interface Props {
  items: InvoiceLineItem[]
  onChange: (items: InvoiceLineItem[]) => void
}

export default function InvoiceLineItemsEditor({ items, onChange }: Props) {
  const { t } = useTranslation()

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addRow = () => {
    onChange([
      ...items,
      { description: '', unit: 'ком', quantity: 1, priceWithoutTax: 0, discountPercent: 0, vatPercent: 0 },
    ])
  }

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const updated = [...items]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left font-medium">{t('invoices.description')}</th>
              <th className="p-2 text-left font-medium w-16">{t('invoices.unit')}</th>
              <th className="p-2 text-right font-medium w-20">{t('invoices.quantity')}</th>
              <th className="p-2 text-right font-medium w-28">{t('invoices.priceWithoutTax')}</th>
              <th className="p-2 text-right font-medium w-20">{t('invoices.discountPercent')}</th>
              <th className="p-2 text-right font-medium w-16">{t('invoices.vatPercent')}</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-1 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => moveRow(i, i - 1)}
                      disabled={i === 0}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="p-1">
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    rows={Math.max(1, item.description.split('\n').length)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-8"
                  />
                </td>
                <td className="p-1">
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(i, 'unit', e.target.value)}
                    className="h-8 text-sm w-16"
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm text-right w-20"
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.priceWithoutTax}
                    onChange={(e) => updateItem(i, 'priceWithoutTax', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm text-right w-28"
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={item.discountPercent}
                    onChange={(e) => updateItem(i, 'discountPercent', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm text-right w-20"
                  />
                </td>
                <td className="p-1">
                  <select
                    value={item.vatPercent}
                    onChange={(e) => updateItem(i, 'vatPercent', parseFloat(e.target.value))}
                    className="flex h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={18}>18%</option>
                  </select>
                </td>
                <td className="p-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeRow(i)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t('invoices.addRow')}
      </Button>
    </div>
  )
}
