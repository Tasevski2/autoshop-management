import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
} from '@/features/vehicles/hooks/useVehicles'
import { useCustomer } from '@/features/customers/hooks/useCustomers'
import CustomerPicker from './CustomerPicker'
import BrandPicker from './BrandPicker'
import ModelPicker from './ModelPicker'

const ENGINE_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const

const vehicleSchema = z.object({
  plate_number: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().optional().transform((v) => v || null),
  year: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(1900).max(2100).optional()).transform((v) => v ?? null),
  chassis_number: z.string().optional().transform((v) => v || null),
  engine_type: z.string().optional().transform((v) => v || null),
  engine_capacity: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().positive().optional()).transform((v) => v ?? null),
  engine_designation: z.string().optional().transform((v) => v || null),
  last_known_mileage: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(0).optional()).transform((v) => v ?? null),
  notes: z.string().optional().transform((v) => v || null),
  customer_id: z.string().min(1),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

export default function VehicleFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetCustomerId = searchParams.get('customer')
  const isEdit = Boolean(id)

  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(id)
  const { data: presetCustomer } = useCustomer(presetCustomerId ?? undefined)
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle(id!)

  const [pickedCustomerName, setPickedCustomerName] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    values: isEdit && vehicle
      ? {
          plate_number: vehicle.plate_number,
          brand: vehicle.brand,
          model: vehicle.model ?? '',
          year: vehicle.year ?? undefined,
          chassis_number: vehicle.chassis_number ?? '',
          engine_type: vehicle.engine_type ?? '',
          engine_capacity: vehicle.engine_capacity ?? undefined,
          engine_designation: vehicle.engine_designation ?? '',
          last_known_mileage: vehicle.last_known_mileage ?? undefined,
          notes: vehicle.notes ?? '',
          customer_id: vehicle.customer_id,
        }
      : presetCustomerId
        ? { customer_id: presetCustomerId, plate_number: '', brand: '' }
        : undefined,
  })

  const onSubmit = (data: VehicleFormData) => {
    if (isEdit) {
      const { customer_id, ...updates } = data
      void customer_id
      updateMutation.mutate(updates)
    } else {
      createMutation.mutate(data as VehicleFormData & { customer_id: string })
    }
  }

  if (isEdit && loadingVehicle) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  const customerDisplayName = isEdit
    ? (vehicle?.customers as { full_name: string } | null)?.full_name
    : (presetCustomer?.full_name ?? pickedCustomerName) || undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('vehicles.edit') : t('vehicles.new')}
        </h2>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            {isEdit ? t('vehicles.editDetails') : t('vehicles.newDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer picker */}
            <div className="space-y-2">
              <Label>{t('vehicles.owner')} *</Label>
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <CustomerPicker
                    value={field.value ?? null}
                    displayName={customerDisplayName}
                    onChange={(customerId, name) => {
                      field.onChange(customerId)
                      setPickedCustomerName(name)
                    }}
                    disabled={isEdit || !!presetCustomerId}
                  />
                )}
              />
              {errors.customer_id && (
                <p className="text-sm text-destructive">{t('vehicles.customerRequired')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate_number">{t('vehicles.plateNumber')} *</Label>
              <Input id="plate_number" {...register('plate_number')} />
              {errors.plate_number && (
                <p className="text-sm text-destructive">{t('vehicles.plateRequired')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.brand')} *</Label>
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <BrandPicker
                      value={field.value}
                      displayName={field.value || undefined}
                      onChange={(brandName) => {
                        field.onChange(brandName)
                        setValue('model', '')
                      }}
                    />
                  )}
                />
                {errors.brand && (
                  <p className="text-sm text-destructive">{t('vehicles.brandRequired')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.model')}</Label>
                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <ModelPicker
                      value={field.value ?? ''}
                      displayName={field.value || undefined}
                      onChange={field.onChange}
                      brandName={watch('brand')}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engine_capacity">{t('vehicles.engineCapacity')}</Label>
                <Input id="engine_capacity" type="number" step="0.1" {...register('engine_capacity')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine_designation">{t('vehicles.engineDesignation')}</Label>
                <Input id="engine_designation" {...register('engine_designation')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">{t('vehicles.year')}</Label>
                <Input id="year" type="number" {...register('year')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine_type">{t('vehicles.engineType')}</Label>
                <select
                  id="engine_type"
                  {...register('engine_type')}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">—</option>
                  {ENGINE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`vehicles.engineTypes.${type}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_known_mileage">{t('vehicles.mileage')}</Label>
              <Input id="last_known_mileage" type="number" {...register('last_known_mileage')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassis_number">{t('vehicles.chassisNumber')}</Label>
              <Input id="chassis_number" {...register('chassis_number')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('vehicles.notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
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
