import { useState } from 'react'
import { Outlet, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  Bell,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  Globe,
  LogOut,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import TopBar from '@/components/TopBar'
import QuickActionsFab from '@/components/QuickActionsFab'
import { LANGUAGE } from '@/lib/i18n'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/customers', icon: Users, labelKey: 'nav.customers' },
  { to: '/vehicles', icon: Car, labelKey: 'nav.vehicles' },
  { to: '/services', icon: Wrench, labelKey: 'nav.services' },
  { to: '/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { to: '/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { to: '/reminders', icon: Bell, labelKey: 'nav.reminders' },
  { to: '/expenses', icon: DollarSign, labelKey: 'nav.expenses' },
  { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const

interface SidebarContentProps {
  onNavigate?: () => void
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { t, i18n } = useTranslation()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const toggleLanguage = () => {
    const next = i18n.language === LANGUAGE.MK ? LANGUAGE.EN : LANGUAGE.MK
    i18n.changeLanguage(next)
  }

  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="space-y-1 px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="w-full justify-start gap-2"
        >
          <Globe className="h-4 w-4" />
          {i18n.language === LANGUAGE.MK ? 'English' : 'Македонски'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-2"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === 'dark' ? t('theme.light') : t('theme.dark')}
        </Button>
      </div>

      <Separator />

      <div className="px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t('auth.logout')}
        </Button>
      </div>
    </>
  )
}

export default function RootLayout() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-6 py-5">
          <Wrench className="h-6 w-6" />
          <h1 className="text-lg font-bold">{t('app.name')}</h1>
        </div>
        <Separator />
        <SidebarContent />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex min-w-0 flex-1 flex-col md:hidden">
        <header className="flex items-center gap-3 border-b bg-sidebar px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col overflow-hidden bg-sidebar text-sidebar-foreground p-0">
              <SheetHeader className="px-6 py-5">
                <SheetTitle className="flex items-center gap-2">
                  <Wrench className="h-6 w-6" />
                  {t('app.name')}
                </SheetTitle>
              </SheetHeader>
              <Separator />
              <div className="flex flex-1 flex-col overflow-y-auto">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-sm font-semibold">{t('app.name')}</h1>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Desktop main */}
      <div className="hidden md:flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-6">
          <Outlet />
        </main>
      </div>
      <QuickActionsFab />
    </div>
  )
}
