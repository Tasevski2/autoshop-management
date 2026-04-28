import { NavLink, Outlet, Navigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'

const tabs = [
  { to: '/settings/parts', labelKey: 'settings.partsCatalog' },
  { to: '/settings/brands', labelKey: 'settings.brandsModels' },
  { to: '/settings/invoices', labelKey: 'settings.invoiceSettings' },
] as const

function tabClassName(isActive: boolean) {
  return `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
  }`
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()

  if (location.pathname === '/settings') {
    return <Navigate to="/settings/parts" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => tabClassName(isActive)}
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
