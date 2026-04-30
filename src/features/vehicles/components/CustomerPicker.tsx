import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCustomerOptions } from '@/features/vehicles/hooks/useVehicles'

interface CustomerPickerProps {
  value: string | null
  displayName?: string
  onChange: (customerId: string, name: string) => void
  disabled?: boolean
}

export default function CustomerPicker({ value, displayName, onChange, disabled }: CustomerPickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: options = [] } = useCustomerOptions(debouncedSearch)

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
              onChange('', '')
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
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                onChange(c.id, c.full_name)
                setSearch('')
                setOpen(false)
              }}
            >
              <span className="font-medium">{c.full_name}</span>
              {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
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
            onChange(options[0].id, options[0].full_name)
            setSearch('')
            setOpen(false)
          }
        }}
        placeholder={t('vehicles.searchCustomer')}
        disabled={disabled}
      />
      {dropdown}
    </div>
  )
}
