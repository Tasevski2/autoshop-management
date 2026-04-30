import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Globe, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useBrands,
  useCreateBrand,
  useDeleteBrand,
  useModels,
  useCreateModel,
  useDeleteModel,
} from '@/features/settings/hooks/useBrandsModels'

export default function BrandsModelsPage() {
  const { t } = useTranslation()
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [newBrandName, setNewBrandName] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<string | null>(null)
  const [deleteModelTarget, setDeleteModelTarget] = useState<string | null>(null)
  const modelsRef = useRef<HTMLDivElement>(null)

  const { data: brands = [], isLoading: loadingBrands } = useBrands()
  const { data: models = [], isLoading: loadingModels } = useModels(selectedBrandId)

  const createBrandMutation = useCreateBrand()
  const deleteBrandMutation = useDeleteBrand()
  const createModelMutation = useCreateModel(selectedBrandId)
  const deleteModelMutation = useDeleteModel(selectedBrandId)

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)

  const filteredBrands = brandSearch
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  const filteredModels = modelSearch
    ? models.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase()))
    : models

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId)
    setModelSearch('')
    // On mobile, scroll to models panel
    setTimeout(() => {
      modelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleAddBrand = async () => {
    const name = newBrandName.trim()
    if (!name) return

    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    createBrandMutation.mutate(
      { name, user_id: user.id },
      { onSuccess: () => setNewBrandName('') }
    )
  }

  const handleAddModel = async () => {
    const name = newModelName.trim()
    if (!name || !selectedBrandId) return

    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    createModelMutation.mutate(
      { name, brand_id: selectedBrandId, user_id: user.id },
      { onSuccess: () => setNewModelName('') }
    )
  }

  const confirmDeleteBrand = () => {
    if (!deleteBrandTarget) return
    deleteBrandMutation.mutate(deleteBrandTarget, {
      onSuccess: () => {
        if (selectedBrandId === deleteBrandTarget) {
          setSelectedBrandId(null)
        }
      },
    })
    setDeleteBrandTarget(null)
  }

  const confirmDeleteModel = () => {
    if (!deleteModelTarget) return
    deleteModelMutation.mutate(deleteModelTarget)
    setDeleteModelTarget(null)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Brands panel */}
      <Card>
        <CardHeader>
          <CardTitle>{t('brands.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add brand form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleAddBrand() }}
            className="flex gap-2"
          >
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder={t('brands.brandName')}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newBrandName.trim() || createBrandMutation.isPending}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('brands.addBrand')}
            </Button>
          </form>

          {/* Brand search */}
          {brands.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder={t('common.search')}
                className="pl-10"
              />
            </div>
          )}

          {/* Brand list */}
          {loadingBrands ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('brands.noBrands')}</p>
          ) : filteredBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredBrands.map((brand) => {
                const isGlobal = !brand.user_id
                return (
                  <div
                    key={brand.id}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                      selectedBrandId === brand.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectBrand(brand.id)}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {isGlobal && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                      {brand.name}
                    </span>
                    {!isGlobal && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteBrandTarget(brand.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Models panel */}
      <Card ref={modelsRef}>
        <CardHeader>
          <CardTitle>
            {selectedBrand
              ? `${selectedBrand.name} — ${t('brands.models')}`
              : t('brands.models')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedBrandId ? (
            <p className="text-sm text-muted-foreground">{t('brands.selectBrand')}</p>
          ) : (
            <>
              {/* Add model form */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleAddModel() }}
                className="flex gap-2"
              >
                <Input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder={t('brands.modelName')}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newModelName.trim() || createModelMutation.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('brands.addModel')}
                </Button>
              </form>

              {/* Model search */}
              {models.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder={t('common.search')}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Model list */}
              {loadingModels ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : models.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('brands.noModels')}</p>
              ) : filteredModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {filteredModels.map((model) => {
                    const isGlobalModel = !model.user_id
                    return (
                      <div
                        key={model.id}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span className="flex items-center gap-2">
                          {isGlobalModel && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                          {model.name}
                        </span>
                        {!isGlobalModel && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteModelTarget(model.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete brand confirmation */}
      <Dialog open={!!deleteBrandTarget} onOpenChange={(open) => { if (!open) setDeleteBrandTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('brands.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBrandTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBrand} disabled={deleteBrandMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete model confirmation */}
      <Dialog open={!!deleteModelTarget} onOpenChange={(open) => { if (!open) setDeleteModelTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('brands.deleteModelConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModelTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModel} disabled={deleteModelMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
