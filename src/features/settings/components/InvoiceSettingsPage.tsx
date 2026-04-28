import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

export default function InvoiceSettingsPage() {
  const { t } = useTranslation()

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">{t('settings.invoicePlaceholder')}</p>
      </CardContent>
    </Card>
  )
}
