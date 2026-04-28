import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Search, Users, Car, Wrench, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const {
    customers, vehicles, services,
    customersTotal, vehiclesTotal, servicesTotal,
    fetchNextCustomers, fetchNextVehicles, fetchNextServices,
    hasNextCustomers, hasNextVehicles, hasNextServices,
    isFetchingNext, isLoading, hasResults,
  } = useGlobalSearch(debouncedQuery)

  const showDropdown = debouncedQuery.length >= 2

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // Position the dropdown beneath the input
  useEffect(() => {
    if (!showDropdown || !inputRef.current) {
      setDropdownPos(null)
      return
    }
    const updatePos = () => {
      if (!inputRef.current) return
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 320) })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [showDropdown])

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (inputRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setQuery('')
      setDebouncedQuery('')
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  const handleSelect = (path: string) => {
    setQuery('')
    setDebouncedQuery('')
    navigate(path)
  }

  const handleScroll = useCallback(() => {
    const el = dropdownRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    if (!nearBottom || isFetchingNext) return
    if (hasNextServices) fetchNextServices()
    else if (hasNextVehicles) fetchNextVehicles()
    else if (hasNextCustomers) fetchNextCustomers()
  }, [isFetchingNext, hasNextCustomers, hasNextVehicles, hasNextServices, fetchNextCustomers, fetchNextVehicles, fetchNextServices])

  return (
    <>
      <div className="relative w-full max-w-lg md:max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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

        {customers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="h-3.5 w-3.5" />
              {t('search.customers')}
              {customersTotal > customers.length && (
                <span className="ml-auto font-normal normal-case">
                  {customers.length} / {customersTotal}
                </span>
              )}
            </div>
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(`/customers/${c.id}`)}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="font-medium">{c.full_name}</span>
                {c.phone && (
                  <span className="text-muted-foreground">{c.phone}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {customers.length > 0 && vehicles.length > 0 && <Separator />}

        {vehicles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Car className="h-3.5 w-3.5" />
              {t('search.vehicles')}
              {vehiclesTotal > vehicles.length && (
                <span className="ml-auto font-normal normal-case">
                  {vehicles.length} / {vehiclesTotal}
                </span>
              )}
            </div>
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => handleSelect(`/vehicles/${v.id}`)}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="font-mono font-medium">{v.plate_number}</span>
                <span className="text-muted-foreground">
                  {v.brand} {v.model}
                  {v.engine_capacity != null ? ` ${v.engine_capacity.toFixed(1)}L` : ''}
                  {v.engine_designation ? ` (${v.engine_designation})` : ''}
                </span>
                {(v as { customers: { full_name: string } | null }).customers && (
                  <span className="text-muted-foreground text-xs ml-auto">
                    {(v as { customers: { full_name: string } | null }).customers!.full_name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {(customers.length > 0 || vehicles.length > 0) && services.length > 0 && (
          <Separator />
        )}

        {services.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Wrench className="h-3.5 w-3.5" />
              {t('search.services')}
              {servicesTotal > services.length && (
                <span className="ml-auto font-normal normal-case">
                  {services.length} / {servicesTotal}
                </span>
              )}
            </div>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(`/services/${s.id}`)}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="font-mono text-muted-foreground">
                  {(s.vehicles as { plate_number: string } | null)?.plate_number}
                </span>
                <span className="truncate">{s.notes}</span>
              </button>
            ))}
          </div>
        )}

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
