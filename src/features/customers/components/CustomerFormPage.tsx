import { useParams, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '@/features/customers/hooks/useCustomers'
import { PageSpinner } from '@/components/PageSpinner'

const customerSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional().transform((v) => v || null),
  email: z.string().email().optional().or(z.literal('')).transform((v) => v || null),
  customer_type: z.enum(['person', 'company']),
  address: z.string().optional().transform((v) => v || null),
  city: z.string().optional().transform((v) => v || null),
  tax_number: z.string().optional().transform((v) => v || null),
  notes: z.string().optional().transform((v) => v || null),
})

type CustomerFormInput = z.input<typeof customerSchema>
type CustomerFormOutput = z.output<typeof customerSchema>

export default function CustomerFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: customer, isLoading: loadingCustomer } = useCustomer(id)
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer(id!)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormInput, unknown, CustomerFormOutput>({
    resolver: zodResolver(customerSchema),
    values: isEdit && customer
      ? {
          full_name: customer.full_name,
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          customer_type: (customer.customer_type as 'person' | 'company') ?? 'person',
          address: customer.address ?? '',
          city: customer.city ?? '',
          tax_number: customer.tax_number ?? '',
          notes: customer.notes ?? '',
        }
      : {
          full_name: '',
          phone: '',
          email: '',
          customer_type: 'person' as const,
          address: '',
          city: '',
          tax_number: '',
          notes: '',
        },
  })

  const onSubmit = (data: CustomerFormOutput) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (isEdit && loadingCustomer) {
    return <PageSpinner />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('customers.edit') : t('customers.new')}
        </h2>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            {isEdit ? t('customers.editDetails') : t('customers.newDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('customers.name')} *</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{t('customers.nameRequired')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('customers.phone')}</Label>
              <Input id="phone" type="tel" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('customers.email')}</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{t('customers.emailInvalid')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('customers.customerType')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={watch('customer_type') === 'person' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('customer_type', 'person')}
                >
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  {t('customers.person')}
                </Button>
                <Button
                  type="button"
                  variant={watch('customer_type') === 'company' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('customer_type', 'company')}
                >
                  <Building2 className="mr-1.5 h-3.5 w-3.5" />
                  {t('customers.company')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">{t('customers.address')}</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('customers.city')}</Label>
                <Input id="city" {...register('city')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_number">{t('customers.taxNumber')}</Label>
              <Input id="tax_number" {...register('tax_number')} placeholder="ЕМБГ / ЕДБ" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('customers.notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
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
