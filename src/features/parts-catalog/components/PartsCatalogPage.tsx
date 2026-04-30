import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useParts,
  useCreatePart,
  useUpdatePart,
  useDeletePart,
} from '@/features/parts-catalog/hooks/usePartsCatalog'
import type { PartsCatalog, PartsCatalogInsert } from '@/features/parts-catalog/types'

interface PartFormData {
  name: string
  description: string
  buy_price: string
  sell_price: string
}

const emptyForm: PartFormData = {
  name: '',
  description: '',
  buy_price: '',
  sell_price: '',
}

export default function PartsCatalogPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<PartsCatalog | null>(null)
  const [form, setForm] = useState<PartFormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data: result, isLoading } = useParts({
    page,
    search: debouncedSearch || undefined,
  })
  const createMutation = useCreatePart()
  const updateMutation = useUpdatePart()
  const deleteMutation = useDeletePart()

  const parts = result?.data ?? []
  const totalPages = result?.totalPages ?? 0

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
    setSearchTimer(timer)
  }

  const openAddDialog = () => {
    setEditingPart(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (part: PartsCatalog) => {
    setEditingPart(part)
    setForm({
      name: part.name,
      description: part.description ?? '',
      buy_price: String(part.buy_price),
      sell_price: String(part.sell_price),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      buy_price: parseFloat(form.buy_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
    }

    if (editingPart) {
      updateMutation.mutate(
        { id: editingPart.id, updates: payload },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      createMutation.mutate(
        { ...payload, user_id: user.id } as PartsCatalogInsert,
        { onSuccess: () => setDialogOpen(false) }
      )
    }
  }

  const handleToggleActive = (part: PartsCatalog) => {
    updateMutation.mutate({
      id: part.id,
      updates: { is_active: !part.is_active },
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget)
    setDeleteTarget(null)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('parts.search')}
          className="w-full sm:w-64"
        />
        <div className="ml-auto">
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('parts.addPart')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : parts.length === 0 ? (
        <p className="text-muted-foreground">{t('parts.noParts')}</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('parts.name')}</TableHead>
                  <TableHead className="text-right">{t('parts.buyPrice')}</TableHead>
                  <TableHead className="text-right">{t('parts.sellPrice')}</TableHead>
                  <TableHead>{t('services.status')}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{part.name}</span>
                        {part.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {part.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {Number(part.buy_price).toLocaleString()} ден
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {Number(part.sell_price).toLocaleString()} ден
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(part)}
                        className={part.is_active ? 'text-green-600' : 'text-muted-foreground'}
                      >
                        {part.is_active ? (
                          <><Check className="mr-1 h-3.5 w-3.5" />{t('parts.active')}</>
                        ) : (
                          <><X className="mr-1 h-3.5 w-3.5" />{t('parts.inactive')}</>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditDialog(part)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(part.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.page', { current: page + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPart ? t('parts.editPart') : t('parts.addPart')}
            </DialogTitle>
            <DialogDescription>
              {editingPart ? t('parts.editPart') : t('parts.addPart')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('parts.name')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('parts.description')}</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('parts.buyPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('parts.sellPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('parts.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
