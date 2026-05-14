import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVehicleOptions } from '@/features/services/hooks/useServices'
import { useVehicleServicesWithTotals } from '@/features/payments/hooks/usePayments'
import { DEBOUNCE_DELAY_MS } from '@/lib/constants'

interface ServicePickerProps {
  value: string | null
  onChange: (serviceId: string, serviceInfo: { balance_due: number }) => void
}

export default function ServicePicker({ value, onChange }: ServicePickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [selectedVehicle, setSelectedVehicle] = useState<{
    id: string
    plate_number: string
    brand: string
    model: string | null
    customers: { full_name: string } | null
  } | null>(null)

  const [selectedServiceDisplay, setSelectedServiceDisplay] = useState<string | null>(null)

  const { data: vehicleOptions = [] } = useVehicleOptions(debouncedSearch)
  const { data: services = [] } = useVehicleServicesWithTotals(selectedVehicle?.id)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, DEBOUNCE_DELAY_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 50,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setSelectedVehicle(null)
    setSelectedServiceDisplay(null)
    setSearch('')
    onChange('', { balance_due: 0 })
  }

  // Show selected state
  if (value && selectedServiceDisplay) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <span className="flex-1">{selectedServiceDisplay}</span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={handleClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  // Step 2: Vehicle selected — show services list
  if (selectedVehicle) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <span className="flex-1 font-mono">
            {selectedVehicle.plate_number} — {selectedVehicle.brand} {selectedVehicle.model}
            {selectedVehicle.customers && ` (${selectedVehicle.customers.full_name})`}
          </span>
          <Button type="button" variant="ghost" size="icon-xs" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('payments.noServices')}</p>
        ) : (
          <div className="max-h-60 overflow-y-auto rounded-md border divide-y">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => {
                  onChange(s.id, { balance_due: s.balance_due })
                  setSelectedServiceDisplay(
                    `${new Date(s.service_date).toLocaleDateString()} — ${selectedVehicle.plate_number} — ${s.service_total.toLocaleString()} ден`
                  )
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span>{new Date(s.service_date).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {t(`services.statuses.${s.status}`)}
                    </Badge>
                  </div>
                  {s.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {s.notes}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-xs">
                  <span>{t('services.total')}: {s.service_total.toLocaleString()} ден</span>
                  {s.balance_due > 0 && (
                    <span className="text-destructive font-medium">
                      {t('services.balance')}: {s.balance_due.toLocaleString()} ден
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Step 1: Search for vehicle
  const dropdown = open && vehicleOptions.length > 0
    ? createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {vehicleOptions.map((v) => (
            <button
              key={v.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                setSelectedVehicle({
                  id: v.id,
                  plate_number: v.plate_number,
                  brand: v.brand,
                  model: v.model,
                  customers: v.customers as { full_name: string } | null,
                })
                setSearch('')
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{v.plate_number}</span>
                <span className="text-muted-foreground">
                  {v.brand} {v.model}
                  {v.engine_capacity != null ? ` ${v.engine_capacity.toFixed(1)}L` : ''}
                  {v.engine_designation ? ` (${v.engine_designation})` : ''}
                </span>
              </div>
              {v.customers && (
                <span className="text-muted-foreground text-xs">
                  {(v.customers as { full_name: string }).full_name}
                </span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )
    : null

  return (
    <div>
      <Input
        ref={inputRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (search.length >= 2) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && open && vehicleOptions.length > 0) {
            e.preventDefault()
            const v = vehicleOptions[0]
            setSelectedVehicle({
              id: v.id,
              plate_number: v.plate_number,
              brand: v.brand,
              model: v.model,
              customers: v.customers as { full_name: string } | null,
            })
            setSearch('')
            setOpen(false)
          }
        }}
        placeholder={t('payments.searchVehicle')}
      />
      {dropdown}
    </div>
  )
}
