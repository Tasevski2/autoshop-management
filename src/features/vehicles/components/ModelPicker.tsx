import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useBrands, useModels } from '@/features/settings/hooks/useBrandsModels'

interface ModelPickerProps {
  value: string
  displayName?: string
  onChange: (modelName: string) => void
  brandName: string
}

export default function ModelPicker({ value, displayName, onChange, brandName }: ModelPickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: brands = [] } = useBrands()
  const brandId = useMemo(
    () => brands.find((b) => b.name === brandName)?.id ?? null,
    [brands, brandName]
  )
  const { data: models = [] } = useModels(brandId)

  const filtered = useMemo(() => {
    if (!search) return models
    const lower = search.toLowerCase()
    return models.filter((m) => m.name.toLowerCase().includes(lower))
  }, [models, search])

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
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            onChange('')
            setSearch('')
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  const disabled = !brandName

  const dropdown = open && !disabled && filtered.length > 0
    ? createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((model) => (
            <button
              key={model.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                onChange(model.name)
                setSearch('')
                setOpen(false)
              }}
            >
              <span className="font-medium">{model.name}</span>
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
          if (!disabled) setOpen(true)
        }}
        onFocus={() => { if (!disabled) setOpen(true) }}
        placeholder={t('vehicles.searchModel')}
        disabled={disabled}
      />
      {dropdown}
    </div>
  )
}
