import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useUserProfile,
  useUpdateUserProfile,
} from '@/features/settings/hooks/useInvoiceSettings'

const profileSchema = z.object({
  workshop_name: z.string().optional().transform((v) => v || null),
  full_name: z.string().min(1),
  address: z.string().optional().transform((v) => v || null),
  phone: z.string().optional().transform((v) => v || null),
  email: z.string().email().optional().or(z.literal('')).transform((v) => v || null),
  bank_account: z.string().optional().transform((v) => v || null),
  bank_name: z.string().optional().transform((v) => v || null),
  tax_id: z.string().optional().transform((v) => v || null),
  authorized_signer: z.string().optional().transform((v) => v || null),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function InvoiceSettingsPage() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useUserProfile()
  const updateMutation = useUpdateUserProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          workshop_name: profile.workshop_name ?? '',
          full_name: profile.full_name,
          address: profile.address ?? '',
          phone: profile.phone ?? '',
          email: profile.email ?? '',
          bank_account: profile.bank_account ?? '',
          bank_name: profile.bank_name ?? '',
          tax_id: profile.tax_id ?? '',
          authorized_signer: profile.authorized_signer ?? '',
        }
      : undefined,
  })

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('settings.invoiceSettings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Workshop info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('settings.invoice.workshopInfo')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workshop_name">{t('settings.invoice.workshopName')}</Label>
                <Input id="workshop_name" {...register('workshop_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('settings.invoice.ownerName')} *</Label>
                <Input id="full_name" {...register('full_name')} />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{t('common.required')}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">{t('settings.invoice.address')}</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.invoice.phone')}</Label>
                <Input id="phone" type="tel" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.invoice.email')}</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{t('customers.emailInvalid')}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('settings.invoice.financialInfo')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_account">{t('settings.invoice.bankAccount')}</Label>
                <Input id="bank_account" {...register('bank_account')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">{t('settings.invoice.bankName')}</Label>
                <Input id="bank_name" {...register('bank_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">{t('settings.invoice.taxId')}</Label>
                <Input id="tax_id" {...register('tax_id')} placeholder="ЕДБ" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Signing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('settings.invoice.signing')}
            </h3>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="authorized_signer">{t('settings.invoice.authorizedSigner')}</Label>
              <Input id="authorized_signer" {...register('authorized_signer')} />
            </div>
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
