import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVehicleOptions } from '@/features/services/hooks/useServices'

interface VehicleOption {
  id: string
  plate_number: string
  brand: string
  model: string | null
  engine_capacity: number | null
  engine_designation: string | null
  customer_id: string
  customers: { full_name: string } | null
}

interface VehiclePickerProps {
  value: string | null
  displayName?: string
  onChange: (vehicleId: string, vehicle: VehicleOption | null) => void
  disabled?: boolean
}

export default function VehiclePicker({ value, displayName, onChange, disabled }: VehiclePickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: options = [] } = useVehicleOptions(debouncedSearch)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
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

  if (value && displayName) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <span className="flex-1">{displayName}</span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onChange('', null)
              setSearch('')
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  const dropdown = open && options.length > 0
    ? createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="rounded-md border bg-popover shadow-md">
          {options.map((v) => (
            <button
              key={v.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                onChange(v.id, v as VehicleOption)
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
          if (e.key === 'Tab' && open && options.length > 0) {
            e.preventDefault()
            const v = options[0]
            onChange(v.id, v as VehicleOption)
            setSearch('')
            setOpen(false)
          }
        }}
        placeholder={t('services.searchVehicle')}
        disabled={disabled}
      />
      {dropdown}
    </div>
  )
}
