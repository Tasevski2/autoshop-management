import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{t('nav.dashboard')}</h2>
      <p className="mt-2 text-muted-foreground">
        {t('app.name')}
      </p>
    </div>
  )
}
