import { useTranslation } from 'react-i18next'
import { LayoutDashboard } from 'lucide-react'
import StatCards from './StatCards'
import CarsInShop from './CarsInShop'
import TodayReminders from './TodayReminders'
import UnpaidServices from './UnpaidServices'
import TodaySummary from './TodaySummary'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">{t('nav.dashboard')}</h2>
      </div>

      <StatCards />

      <CarsInShop />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayReminders />
        <UnpaidServices />
      </div>

      <TodaySummary />
    </div>
  )
}
