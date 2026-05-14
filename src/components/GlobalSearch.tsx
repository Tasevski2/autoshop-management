import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Search, Users, Car, Wrench, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useClickOutside } from '@/hooks/useClickOutside'
import { DEBOUNCE_DELAY_MS, SCROLL_LOAD_THRESHOLD, MIN_SEARCH_LENGTH } from '@/lib/constants'

interface SearchResultSectionProps {
  icon: LucideIcon
  label: string
  total: number
  items: { id: string }[]
  renderItem: (item: { id: string }) => React.ReactNode
}

function SearchResultSection({ icon: Icon, label, total, items, renderItem }: SearchResultSectionProps) {
  if (items.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {total > items.length && (
          <span className="ml-auto font-normal normal-case">
            {items.length} / {total}
          </span>
        )}
      </div>
      {items.map((item) => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
    </div>
  )
}

function useDropdownPosition(anchorRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!enabled || !anchorRef.current) {
      setPos(null)
      return
    }

    const update = () => {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      const maxWidth = Math.min(window.innerWidth - 16, Math.max(rect.width, 320))
      const left = Math.min(rect.left, window.innerWidth - maxWidth - 8)
      setPos({ top: rect.bottom + 4, left, width: maxWidth })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [enabled, anchorRef])

  return pos
}

export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_DELAY_MS)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    customers, vehicles, services,
    customersTotal, vehiclesTotal, servicesTotal,
    fetchNextCustomers, fetchNextVehicles, fetchNextServices,
    hasNextCustomers, hasNextVehicles, hasNextServices,
    isFetchingNext, isLoading, hasResults,
  } = useGlobalSearch(debouncedQuery)

  const showDropdown = debouncedQuery.length >= MIN_SEARCH_LENGTH
  const dropdownPos = useDropdownPosition(inputRef, showDropdown)

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  useClickOutside([inputRef, dropdownRef], clearSearch, showDropdown)

  const handleSelect = (path: string) => {
    setQuery('')
    navigate(path)
  }

  const handleScroll = useCallback(() => {
    const el = dropdownRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_LOAD_THRESHOLD
    if (!nearBottom || isFetchingNext) return
    if (hasNextServices) fetchNextServices()
    else if (hasNextVehicles) fetchNextVehicles()
    else if (hasNextCustomers) fetchNextCustomers()
  }, [isFetchingNext, hasNextCustomers, hasNextVehicles, hasNextServices, fetchNextCustomers, fetchNextVehicles, fetchNextServices])

  const handleTabSelect = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !showDropdown || !hasResults) return
    e.preventDefault()
    const first = customers[0] ?? vehicles[0] ?? services[0]
    if (!first) return
    const prefix = customers[0] ? 'customers' : vehicles[0] ? 'vehicles' : 'services'
    handleSelect(`/${prefix}/${first.id}`)
  }

  return (
    <>
      <div className="relative w-full max-w-lg md:max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleTabSelect}
          placeholder={t('search.placeholder')}
          className="pl-10 h-9 md:h-10"
        />
        {isLoading && showDropdown && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          onScroll={handleScroll}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 50 }}
          className="rounded-md border bg-popover text-popover-foreground shadow-md max-h-96 overflow-y-auto"
        >
          {!hasResults && !isLoading && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {t('search.noResults')}
            </p>
          )}

          <SearchResultSection
            icon={Users}
            label={t('search.customers')}
            total={customersTotal}
            items={customers}
            renderItem={(item) => {
              const c = item as typeof customers[number]
              return (
                <button
                  onClick={() => handleSelect(`/customers/${c.id}`)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="font-medium">{c.full_name}</span>
                  {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                </button>
              )
            }}
          />

          {customers.length > 0 && vehicles.length > 0 && <Separator />}

          <SearchResultSection
            icon={Car}
            label={t('search.vehicles')}
            total={vehiclesTotal}
            items={vehicles}
            renderItem={(item) => {
              const v = item as typeof vehicles[number]
              return (
                <button
                  onClick={() => handleSelect(`/vehicles/${v.id}`)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="font-mono font-medium">{v.plate_number}</span>
                  <span className="text-muted-foreground">
                    {v.brand} {v.model}
                    {v.engine_capacity != null ? ` ${v.engine_capacity.toFixed(1)}L` : ''}
                    {v.engine_designation ? ` (${v.engine_designation})` : ''}
                  </span>
                  {v.customers?.full_name && (
                    <span className="text-muted-foreground text-xs ml-auto">
                      {v.customers.full_name}
                    </span>
                  )}
                </button>
              )
            }}
          />

          {(customers.length > 0 || vehicles.length > 0) && services.length > 0 && <Separator />}

          <SearchResultSection
            icon={Wrench}
            label={t('search.services')}
            total={servicesTotal}
            items={services}
            renderItem={(item) => {
              const s = item as typeof services[number]
              return (
                <button
                  onClick={() => handleSelect(`/services/${s.id}`)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="font-mono text-muted-foreground">
                    {s.vehicles?.plate_number}
                  </span>
                  <span className="truncate">{s.notes}</span>
                </button>
              )
            }}
          />

          {isFetchingNext && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
