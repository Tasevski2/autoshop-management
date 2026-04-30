import { useState, useRef, useEffect } from 'react'
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

function ActionItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col-reverse items-end gap-2">
      {actions.map((action, i) => (
        <Link
          key={action.to}
          to={action.to}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-full bg-popover border shadow-md pl-3 pr-4 py-2 text-sm font-medium transition-colors hover:bg-accent animate-in fade-in slide-in-from-bottom-1 duration-150"
          style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
        >
          <action.icon className="h-4 w-4" />
          {t(action.labelKey)}
        </Link>
      ))}
    </div>
  )
}

/** Desktop: hover to open/close */
function DesktopFab() {
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const [open, setOpen] = useState(false)

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <div
      className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col-reverse items-end gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className={`h-6 w-6 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && <ActionItems onNavigate={() => setOpen(false)} />}
    </div>
  )
}

/** Mobile: tap to toggle */
function MobileFab() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: TouchEvent | MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className="flex md:hidden fixed bottom-3 right-3 z-40 flex-col-reverse items-end gap-2"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus className={`h-6 w-6 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && <ActionItems onNavigate={() => setOpen(false)} />}
    </div>
  )
}

export default function QuickActionsFab() {
  return (
    <>
      <DesktopFab />
      <MobileFab />
    </>
  )
}
