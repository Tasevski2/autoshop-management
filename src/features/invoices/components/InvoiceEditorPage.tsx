import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { toLocalDateStr } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import InvoicePreview from './InvoicePreview'
import InvoiceLineItemsEditor from './InvoiceLineItemsEditor'
import {
  useInvoiceData,
  useExistingInvoice,
  useNextInvoiceNumber,
  useSaveInvoice,
} from '@/features/invoices/hooks/useInvoices'
import { downloadInvoicePdf } from '@/lib/invoice-pdf'
import type { InvoiceLineItem, InvoiceSeller, InvoiceBuyer } from '@/features/invoices/types'

function buildInitialItems(
  parts: { name: string; quantity: number; sell_price: number }[],
  laborCost: number | null,
  plateNumber: string,
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = parts.map((p) => ({
    description: p.name,
    unit: 'ком',
    quantity: p.quantity,
    priceWithoutTax: p.sell_price,
    discountPercent: 0,
    vatPercent: 0,
  }))

  if (laborCost && laborCost > 0) {
    items.push({
      description: `Работна рака за возило ${plateNumber}`,
      unit: 'ком',
      quantity: 1,
      priceWithoutTax: laborCost,
      discountPercent: 0,
      vatPercent: 0,
    })
  }

  return items
}

function InvoiceEditorLoaded({
  serviceId,
  data,
  existingInvoice,
}: {
  serviceId: string
  data: NonNullable<ReturnType<typeof useInvoiceData>['data']>
  existingInvoice: ReturnType<typeof useExistingInvoice>['data']
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const nextNumberMutation = useNextInvoiceNumber()
  const saveMutation = useSaveInvoice()

  const { service, parts, profile } = data
  const vehicle = service.vehicles as {
    plate_number: string
    brand: string
    model: string | null
    customer_id: string
    customers: {
      id: string
      full_name: string
      phone: string | null
      email: string | null
      customer_type: string
      address: string | null
      city: string | null
      tax_number: string | null
    } | null
  } | null
  const customer = vehicle?.customers

  const [invoiceNumber, setInvoiceNumber] = useState(() => existingInvoice?.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate] = useState(() =>
    service.service_date ? service.service_date.split('T')[0] : toLocalDateStr()
  )
  const [dueDate, setDueDate] = useState(() => {
    if (existingInvoice?.due_date) return existingInvoice.due_date
    const d = new Date(service.service_date || Date.now())
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(() =>
    buildInitialItems(parts, service.labor_cost, vehicle?.plate_number ?? '')
  )

  // Fetch next invoice number if no existing invoice (one-time)
  useEffect(() => {
    if (!existingInvoice) {
      nextNumberMutation.mutate(undefined, {
        onSuccess: (num) => setInvoiceNumber(num),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const seller: InvoiceSeller = {
    workshopName: profile.workshop_name,
    fullName: profile.full_name,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    bankAccount: profile.bank_account,
    bankName: profile.bank_name,
    taxId: profile.tax_id,
    authorizedSigner: profile.authorized_signer,
  }

  const buyer: InvoiceBuyer = {
    name: customer?.full_name ?? '',
    customerType: (customer?.customer_type as 'person' | 'company') ?? 'person',
    address: customer?.address ?? null,
    city: customer?.city ?? null,
    taxNumber: customer?.tax_number ?? null,
  }

  const handleGenerate = useCallback(() => {
    saveMutation.mutate(
      {
        existingId: existingInvoice?.id ?? null,
        invoice: {
          service_id: serviceId,
          invoice_number: invoiceNumber,
          due_date: dueDate || null,
          issued_at: new Date(invoiceDate + 'T00:00:00').toISOString(),
        },
      },
      {
        onSuccess: () => {
          downloadInvoicePdf({
            invoiceNumber,
            invoiceDate,
            dueDate,
            seller,
            buyer,
            lineItems,
          })
        },
      }
    )
  }, [invoiceNumber, invoiceDate, dueDate, seller, buyer, lineItems, serviceId, existingInvoice, saveMutation])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button onClick={handleGenerate} disabled={saveMutation.isPending || !invoiceNumber}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {t('invoices.generatePdf')}
        </Button>
      </div>

      {/* Invoice metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('invoices.editor')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('invoices.invoiceNumber')}</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoices.invoiceDate')}</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoices.dueDate')}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('invoices.lineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItemsEditor items={lineItems} onChange={setLineItems} />
        </CardContent>
      </Card>

      <Separator />

      {/* Live preview */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('invoices.preview')}</h3>
        <div className="overflow-x-auto">
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            dueDate={dueDate}
            seller={seller}
            buyer={buyer}
            lineItems={lineItems}
          />
        </div>
      </div>
    </div>
  )
}

export default function InvoiceEditorPage() {
  const { t } = useTranslation()
  const { id: serviceId } = useParams<{ id: string }>()

  const { data, isLoading } = useInvoiceData(serviceId!)
  const { data: existingInvoice, isLoading: loadingInvoice } = useExistingInvoice(serviceId!)

  if (isLoading || loadingInvoice || !data) {
    return <p className="text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <InvoiceEditorLoaded
      serviceId={serviceId!}
      data={data}
      existingInvoice={existingInvoice ?? null}
    />
  )
}
