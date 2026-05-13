import { useRouteError, isRouteErrorResponse, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useTranslation()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t('common.error')

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-destructive font-medium">{message}</p>
      <Button variant="outline" render={<Link to="/" />}>
        {t('common.backHome')}
      </Button>
    </div>
  )
}
