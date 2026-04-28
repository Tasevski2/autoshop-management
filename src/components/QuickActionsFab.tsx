import { useRef } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Users, Car, Wrench, Bell, CreditCard, DollarSign } from 'lucide-react'

const actions = [
  { to: '/customers/new', icon: Users, labelKey: 'customers.new' },
  { to: '/vehicles/new', icon: Car, labelKey: 'vehicles.new' },
  { to: '/services/new', icon: Wrench, labelKey: 'services.new' },
  { to: '/reminders/new', icon: Bell, labelKey: 'reminders.new' },
  { to: '/payments/new', icon: CreditCard, labelKey: 'payments.new' },
  { to: '/expenses/new', icon: DollarSign, labelKey: 'expenses.new' },
] as const

export default function QuickActionsFab() {
  const { t } = useTranslation()
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      const container = document.getElementById('fab-container')
      if (container) container.removeAttribute('data-open')
    }, 200)
  }

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const container = document.getElementById('fab-container')
    if (container) container.setAttribute('data-open', '')
  }

  return (
    <div
      id="fab-container"
      className="group fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main FAB button */}
      <button
        onMouseEnter={openMenu}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6 transition-transform duration-200 group-data-open:rotate-45" />
      </button>

      {/* Action items — shown on hover via data-open */}
      <div className="hidden group-data-open:flex flex-col-reverse items-end gap-2">
        {actions.map((action, i) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-2 rounded-full bg-popover border shadow-md pl-3 pr-4 py-2 text-sm font-medium transition-colors hover:bg-accent animate-in fade-in slide-in-from-bottom-1 duration-150"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
          >
            <action.icon className="h-4 w-4" />
            {t(action.labelKey)}
          </Link>
        ))}
      </div>
    </div>
  )
}
