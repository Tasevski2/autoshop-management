import { useCallback } from 'react'
import { useFieldArray, useWatch, type Control, type UseFormSetValue, type UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PartAutocomplete from './PartAutocomplete'
import type { ServiceFormData } from './ServiceFormPage'

interface ServicePartsEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<ServiceFormData, any, any>
  setValue: UseFormSetValue<ServiceFormData>
  register: UseFormRegister<ServiceFormData>
}

export default function ServicePartsEditor({ control, setValue, register }: ServicePartsEditorProps) {
  const { t } = useTranslation()
  const { fields, append, remove } = useFieldArray({ control, name: 'parts' })
  const watchedParts = useWatch({ control, name: 'parts' })

  const appendIfLast = useCallback((index: number) => {
    if (index === fields.length - 1) {
      append({ name: '', buy_price: '', sell_price: '', quantity: '1', catalog_part_id: null }, { shouldFocus: false })
    }
  }, [fields.length, append])

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_60px_80px_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
        <span>{t('services.partName')}</span>
        <span>{t('services.buyPrice')}</span>
        <span>{t('services.sellPrice')}</span>
        <span>{t('services.quantity')}</span>
        <span className="text-right">{t('services.rowTotal')}</span>
        <span />
      </div>

      {fields.map((field, index) => {
        const isLastEmpty = index === fields.length - 1
        const currentPart = watchedParts?.[index]
        const rowTotal = (Number(currentPart?.sell_price) || 0) * (Number(currentPart?.quantity) || 0)

        return (
          <div key={field.id}>
            {/* Desktop: compact grid row */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_60px_80px_32px] gap-2 items-start">
              <PartAutocomplete
                value={currentPart?.name ?? ''}
                onChange={(name) => {
                  setValue(`parts.${index}.name`, name)
                  if (name.trim()) appendIfLast(index)
                }}
                onSelect={(part) => {
                  setValue(`parts.${index}.name`, part.name)
                  setValue(`parts.${index}.buy_price`, String(part.buy_price))
                  setValue(`parts.${index}.sell_price`, String(part.sell_price))
                  appendIfLast(index)
                }}
              />
              <Input
                type="number"
                placeholder={t('services.buyPrice')}
                {...register(`parts.${index}.buy_price`)}
              />
              <Input
                type="number"
                placeholder={t('services.sellPrice')}
                {...register(`parts.${index}.sell_price`)}
              />
              <Input
                type="number"
                min={1}
                placeholder={t('services.quantity')}
                {...register(`parts.${index}.quantity`)}
              />
              <div className="flex items-center justify-end h-8 text-sm font-medium">
                {rowTotal > 0 ? `${rowTotal.toLocaleString()} ден` : '—'}
              </div>
              <div className="flex items-center justify-center h-8">
                {!isLastEmpty && (
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(index)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile: card layout */}
            <div className="sm:hidden rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <PartAutocomplete
                    value={currentPart?.name ?? ''}
                    onChange={(name) => {
                      setValue(`parts.${index}.name`, name)
                      if (name.trim()) appendIfLast(index)
                    }}
                    onSelect={(part) => {
                      setValue(`parts.${index}.name`, part.name)
                      setValue(`parts.${index}.buy_price`, String(part.buy_price))
                      setValue(`parts.${index}.sell_price`, String(part.sell_price))
                      appendIfLast(index)
                    }}
                  />
                </div>
                {!isLastEmpty && (
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(index)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('services.buyPrice')}</Label>
                  <Input
                    type="number"
                    value={currentPart?.buy_price ?? ''}
                    onChange={(e) => setValue(`parts.${index}.buy_price`, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('services.sellPrice')}</Label>
                  <Input
                    type="number"
                    value={currentPart?.sell_price ?? ''}
                    onChange={(e) => setValue(`parts.${index}.sell_price`, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('services.quantity')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={currentPart?.quantity ?? '1'}
                    onChange={(e) => setValue(`parts.${index}.quantity`, e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end text-sm font-medium">
                {rowTotal > 0 ? `${rowTotal.toLocaleString()} ден` : '—'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
