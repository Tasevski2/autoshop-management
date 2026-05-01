import { useState, useCallback } from 'react'
import { toLocalDateStr } from '@/lib/dates'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, X, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useService,
  useServiceParts,
  useCreateService,
  useUpdateService,
} from '@/features/services/hooks/useServices'
import { useVehicle } from '@/features/vehicles/hooks/useVehicles'
import VehiclePicker from './VehiclePicker'
import PartAutocomplete from './PartAutocomplete'
import type { ServiceStatus } from '@/features/services/types'

const STATUSES: ServiceStatus[] = ['in_progress', 'completed', 'invoiced', 'partially_paid', 'paid', 'cancelled']

const partSchema = z.object({
  name: z.string(),
  buy_price: z.preprocess((v) => (v === '' || v === undefined ? 0 : Number(v)), z.number().min(0)),
  sell_price: z.preprocess((v) => (v === '' || v === undefined ? 0 : Number(v)), z.number().min(0)),
  quantity: z.preprocess((v) => (v === '' || v === undefined ? 1 : Number(v)), z.number().int().min(1)),
  catalog_part_id: z.string().nullable().optional(),
})

const serviceSchema = z.object({
  service_date: z.string().min(1),
  mileage_at_service: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(0).optional()
  ).transform((v) => v ?? null),
  labor_cost: z.preprocess((v) => (v === '' || v === undefined ? 0 : Number(v)), z.number().min(0)),
  notes: z.string().optional().transform((v) => v || null),
  status: z.string(),
  vehicle_id: z.string().min(1),
  parts: z.array(partSchema),
})

type ServiceFormData = z.infer<typeof serviceSchema>

export default function ServiceFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetVehicleId = searchParams.get('vehicle')
  const isEdit = Boolean(id)

  const { data: service, isLoading: loadingService } = useService(id)
  const { data: existingParts } = useServiceParts(id)
  const { data: presetVehicle } = useVehicle(presetVehicleId ?? undefined)
  const createMutation = useCreateService()
  const updateMutation = useUpdateService(id!)

  const [pickedVehicleDisplay, setPickedVehicleDisplay] = useState('')
  const [pickedCustomerName, setPickedCustomerName] = useState('')

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema) as never,
    defaultValues: {
      service_date: toLocalDateStr(),
      labor_cost: 0,
      status: 'in_progress' as const,
      vehicle_id: presetVehicleId ?? '',
      parts: [{ name: '', buy_price: 0, sell_price: 0, quantity: 1, catalog_part_id: null }],
    },
    values: (isEdit && service && existingParts
      ? {
          service_date: service.service_date,
          mileage_at_service: service.mileage_at_service ?? undefined,
          labor_cost: service.labor_cost,
          notes: service.notes ?? '',
          status: service.status,
          vehicle_id: service.vehicle_id,
          parts: [
            ...existingParts.map((p) => ({
              name: p.name,
              buy_price: p.buy_price,
              sell_price: p.sell_price,
              quantity: p.quantity,
              catalog_part_id: p.catalog_part_id,
            })),
            { name: '', buy_price: 0, sell_price: 0, quantity: 1, catalog_part_id: null },
          ],
        }
      : undefined) as ServiceFormData | undefined,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parts',
  })

  // Watch parts and labor cost for live totals
  const watchedParts = useWatch({ control, name: 'parts' })
  const watchedLaborCost = useWatch({ control, name: 'labor_cost' })

  // Append a blank row when the user fills the last row (event-driven, not effect-driven)
  const appendIfLast = useCallback((index: number) => {
    if (index === fields.length - 1) {
      append({ name: '', buy_price: 0, sell_price: 0, quantity: 1, catalog_part_id: null }, { shouldFocus: false })
    }
  }, [fields.length, append])

  const onSubmit = (data: ServiceFormData) => {
    // Filter out empty rows
    const validParts = data.parts.filter((p) => p.name.trim() !== '')
    const serviceData = {
      service_date: data.service_date,
      mileage_at_service: data.mileage_at_service,
      labor_cost: data.labor_cost,
      notes: data.notes,
      status: data.status as ServiceStatus,
      vehicle_id: data.vehicle_id,
    }

    if (isEdit) {
      const { vehicle_id, ...updates } = serviceData
      void vehicle_id
      updateMutation.mutate({
        service: updates,
        parts: validParts.map((p) => ({
          name: p.name,
          buy_price: p.buy_price,
          sell_price: p.sell_price,
          quantity: p.quantity,
          catalog_part_id: p.catalog_part_id ?? null,
        })),
      })
    } else {
      createMutation.mutate({
        service: serviceData,
        parts: validParts.map((p) => ({
          name: p.name,
          buy_price: p.buy_price,
          sell_price: p.sell_price,
          quantity: p.quantity,
          catalog_part_id: p.catalog_part_id ?? null,
        })),
      })
    }
  }

  if (isEdit && loadingService) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  // Vehicle context display
  const vehicleDisplay = isEdit
    ? (() => {
        const v = service?.vehicles as { plate_number: string; brand: string; model: string | null; engine_capacity: number | null; engine_designation: string | null; customers: { full_name: string } | null } | null
        if (!v) return undefined
        let label = `${v.plate_number} — ${v.brand} ${v.model ?? ''}`
        if (v.engine_capacity != null) label += ` ${v.engine_capacity.toFixed(1)}L`
        if (v.engine_designation) label += ` (${v.engine_designation})`
        return label
      })()
    : presetVehicle
      ? `${presetVehicle.plate_number} — ${presetVehicle.brand} ${presetVehicle.model ?? ''}${presetVehicle.engine_capacity != null ? ` ${presetVehicle.engine_capacity.toFixed(1)}L` : ''}${presetVehicle.engine_designation ? ` (${presetVehicle.engine_designation})` : ''}`
      : pickedVehicleDisplay || undefined

  const customerName = isEdit
    ? ((service?.vehicles as { customers: { full_name: string } | null } | null)?.customers?.full_name)
    : presetVehicle
      ? (presetVehicle.customers as { full_name: string } | null)?.full_name
      : pickedCustomerName || undefined

  // Calculate totals from watched parts
  const partsTotal = (watchedParts ?? []).reduce((sum, p) => {
    if (!p || !p.name?.trim()) return sum
    return sum + (Number(p.sell_price) || 0) * (Number(p.quantity) || 0)
  }, 0)
  const partsCost = (watchedParts ?? []).reduce((sum, p) => {
    if (!p || !p.name?.trim()) return sum
    return sum + (Number(p.buy_price) || 0) * (Number(p.quantity) || 0)
  }, 0)
  const total = partsTotal + (Number(watchedLaborCost) || 0)
  const profit = total - partsCost

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('services.edit') : t('services.new')}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        {/* Vehicle picker (only on create without preset) */}
        {!isEdit && !presetVehicleId && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('services.vehicle')} *</CardTitle>
            </CardHeader>
            <CardContent>
              <VehiclePicker
                value={null}
                displayName={vehicleDisplay}
                onChange={(vehicleId, vehicle) => {
                  setValue('vehicle_id', vehicleId, { shouldValidate: true })
                  if (vehicle) {
                    setPickedVehicleDisplay(`${vehicle.plate_number} — ${vehicle.brand} ${vehicle.model ?? ''}${vehicle.engine_capacity != null ? ` ${vehicle.engine_capacity.toFixed(1)}L` : ''}${vehicle.engine_designation ? ` (${vehicle.engine_designation})` : ''}`)
                    setPickedCustomerName(vehicle.customers?.full_name ?? '')
                  } else {
                    setPickedVehicleDisplay('')
                    setPickedCustomerName('')
                  }
                }}
              />
              {errors.vehicle_id && (
                <p className="text-sm text-destructive mt-1">{t('services.vehicleRequired')}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vehicle context header */}
        {vehicleDisplay && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-mono font-medium">{vehicleDisplay}</p>
                  {customerName && (
                    <p className="text-sm text-muted-foreground">{customerName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service fields */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isEdit ? t('services.editDetails') : t('services.new')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="service_date">{t('services.date')} *</Label>
                <Input id="service_date" type="date" {...register('service_date')} />
                {errors.service_date && (
                  <p className="text-sm text-destructive">{t('services.dateRequired')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage_at_service">{t('services.mileage')}</Label>
                <Input id="mileage_at_service" type="number" {...register('mileage_at_service')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('services.status')}</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`services.statuses.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor_cost">{t('services.laborCost')}</Label>
              <Input id="labor_cost" type="number" {...register('labor_cost')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('services.notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Parts section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('services.parts')}</CardTitle>
          </CardHeader>
          <CardContent>
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
                          setValue(`parts.${index}.buy_price`, part.buy_price)
                          setValue(`parts.${index}.sell_price`, part.sell_price)
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => remove(index)}
                          >
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
                              setValue(`parts.${index}.buy_price`, part.buy_price)
                              setValue(`parts.${index}.sell_price`, part.sell_price)
                              appendIfLast(index)
                            }}
                          />
                        </div>
                        {!isLastEmpty && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => remove(index)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t('services.buyPrice')}</Label>
                          <Input
                            type="number"
                            value={currentPart?.buy_price ?? 0}
                            onChange={(e) => setValue(`parts.${index}.buy_price`, e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t('services.sellPrice')}</Label>
                          <Input
                            type="number"
                            value={currentPart?.sell_price ?? 0}
                            onChange={(e) => setValue(`parts.${index}.sell_price`, e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t('services.quantity')}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={currentPart?.quantity ?? 1}
                            onChange={(e) => setValue(`parts.${index}.quantity`, e.target.value === '' ? 1 : Number(e.target.value))}
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
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('services.partsTotal')}</span>
                <span>{partsTotal.toLocaleString()} ден</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('services.laborCost')}</span>
                <span>{(Number(watchedLaborCost) || 0).toLocaleString()} ден</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>{t('services.total')}</span>
                <span>{total.toLocaleString()} ден</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('services.profit')}</span>
                <Badge variant={profit >= 0 ? 'secondary' : 'destructive'}>
                  {profit.toLocaleString()} ден
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {t('common.save')}
          </Button>
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
