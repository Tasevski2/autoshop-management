import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { usePartOptions } from '@/features/services/hooks/useServices'

interface PartAutocompleteProps {
  value: string
  onChange: (name: string) => void
  onSelect: (part: { name: string; buy_price: number; sell_price: number }) => void
}

export default function PartAutocomplete({ value, onChange, onSelect }: PartAutocompleteProps) {
  const { t } = useTranslation()
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: options = [] } = usePartOptions(debouncedSearch)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value])

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

  const dropdown = open && options.length > 0
    ? createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {options.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                onSelect({
                  name: p.name,
                  buy_price: p.buy_price,
                  sell_price: p.sell_price,
                })
                setOpen(false)
              }}
            >
              <span>{p.name}</span>
              <span className="text-muted-foreground">{p.sell_price.toLocaleString()} ден</span>
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
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={t('services.searchPart')}
      />
      {dropdown}
    </div>
  )
}
