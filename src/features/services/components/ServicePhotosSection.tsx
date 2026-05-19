import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImageLightbox from '@/components/ImageLightbox'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { useServiceImages, useUploadServiceImage, useDeleteServiceImage } from '@/features/services/hooks/useServices'

function imageUrl(storagePath: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/service-images/${storagePath}`
}

interface ServicePhotosSectionProps {
  serviceId: string
}

export default function ServicePhotosSection({ serviceId }: ServicePhotosSectionProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: images = [] } = useServiceImages(serviceId)
  const uploadMutation = useUploadServiceImage(serviceId)
  const deleteMutation = useDeleteServiceImage(serviceId)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string } | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('services.photos')}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          loading={uploadMutation.isPending}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          {t('services.uploadPhoto')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('services.noPhotos')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-md border overflow-hidden bg-muted"
            >
              <img
                src={imageUrl(img.storage_path)}
                alt={img.description ?? img.file_name ?? ''}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setLightboxIndex(images.indexOf(img))}
              />
              <button
                type="button"
                onClick={() => setDeleteTarget({ id: img.id, storagePath: img.storage_path })}
                className="absolute top-1 right-1 cursor-pointer rounded-full bg-destructive/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id, storagePath: deleteTarget.storagePath })
          setDeleteTarget(null)
        }}
        description={t('services.deleteConfirm')}
        isPending={deleteMutation.isPending}
      />

      <ImageLightbox
        images={images.map((img) => ({
          src: imageUrl(img.storage_path),
          alt: img.description ?? img.file_name ?? '',
        }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
