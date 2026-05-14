import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { toLocalDateStr } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import InvoicePreview from "./InvoicePreview";
import InvoiceLineItemsEditor from "./InvoiceLineItemsEditor";
import {
  useInvoiceData,
  useExistingInvoice,
  useNextInvoiceNumber,
  useSaveInvoice,
} from "@/features/invoices/hooks/useInvoices";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { CUSTOMER_TYPE, type CustomerType } from "@/lib/enums";
import { numberToWordsMk } from "@/lib/number-to-words-mk";
import type {
  InvoiceLineItem,
  InvoiceSeller,
  InvoiceBuyer,
} from "@/features/invoices/types";
import { DEFAULT_UNIT } from "@/features/invoices/constants";
import { PageSpinner } from '@/components/PageSpinner'

function buildInitialItems(
  parts: { name: string; quantity: number; sell_price: number }[],
  laborCost: number | null,
  plateNumber: string,
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = parts.map((p) => ({
    description: p.name,
    unit: DEFAULT_UNIT,
    quantity: p.quantity,
    priceWithoutTax: p.sell_price,
    discountPercent: 0,
    vatPercent: 0,
  }));

  if (laborCost && laborCost > 0) {
    items.push({
      description: `Работна рака за возило ${plateNumber}`,
      unit: DEFAULT_UNIT,
      quantity: 1,
      priceWithoutTax: laborCost,
      discountPercent: 0,
      vatPercent: 0,
    });
  }

  return items;
}

function InvoiceEditorLoaded({
  serviceId,
  data,
  existingInvoice,
}: {
  serviceId: string;
  data: NonNullable<ReturnType<typeof useInvoiceData>["data"]>;
  existingInvoice: ReturnType<typeof useExistingInvoice>["data"];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: nextNumber } = useNextInvoiceNumber(
    serviceId,
    !!existingInvoice,
  );
  const saveMutation = useSaveInvoice();

  const { service, parts, profile } = data;
  const vehicle = service.vehicles as {
    plate_number: string;
    brand: string;
    model: string | null;
    customer_id: string;
    customers: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
      customer_type: CustomerType;
      address: string | null;
      city: string | null;
      tax_number: string | null;
    } | null;
  } | null;
  const customer = vehicle?.customers;

  const [invoiceNumber, setInvoiceNumber] = useState(
    () => existingInvoice?.invoice_number ?? "",
  );
  const [invoiceDate, setInvoiceDate] = useState(() =>
    service.service_date
      ? service.service_date.split("T")[0]
      : toLocalDateStr(),
  );
  const [dueDate, setDueDate] = useState(() => {
    if (existingInvoice?.due_date) return existingInvoice.due_date;
    const d = new Date(service.service_date || Date.now());
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(() =>
    buildInitialItems(parts, service.labor_cost, vehicle?.plate_number ?? ""),
  );
  const [userEditedWords, setUserEditedWords] = useState(false);
  const computedTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const base = item.priceWithoutTax * item.quantity;
      const disc = base * (item.discountPercent / 100);
      const afterDisc = base - disc;
      return sum + afterDisc + afterDisc * (item.vatPercent / 100);
    }, 0);
  }, [lineItems]);
  const [amountInWords, setAmountInWords] = useState(() =>
    numberToWordsMk(Math.round(computedTotal)),
  );

  // Auto-update amount in words when total changes (unless user edited manually)
  useEffect(() => {
    if (!userEditedWords) {
      setAmountInWords(numberToWordsMk(Math.round(computedTotal)));
    }
  }, [computedTotal]);

  const recalculateWords = () => {
    setAmountInWords(numberToWordsMk(Math.round(computedTotal)));
    setUserEditedWords(false);
  };

  // Set invoice number from query only once (before first save)
  useEffect(() => {
    if (!existingInvoice && nextNumber && !invoiceNumber) {
      setInvoiceNumber(nextNumber);
    }
  }, [nextNumber, existingInvoice, invoiceNumber]);

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
  };

  const buyer: InvoiceBuyer = {
    name: customer?.full_name ?? "",
    customerType: (customer?.customer_type as CustomerType) ?? CUSTOMER_TYPE.PERSON,
    address: customer?.address ?? null,
    city: customer?.city ?? null,
    taxNumber: customer?.tax_number ?? null,
  };

  const invoicePayload = useMemo(
    () => ({
      existingId: existingInvoice?.id ?? null,
      invoice: {
        service_id: serviceId,
        invoice_number: invoiceNumber,
        due_date: dueDate || null,
        issued_at: new Date(invoiceDate + "T00:00:00").toISOString(),
      },
    }),
    [existingInvoice, serviceId, invoiceNumber, dueDate, invoiceDate],
  );

  const handleSave = useCallback(() => {
    saveMutation.mutate(invoicePayload);
  }, [invoicePayload, saveMutation]);

  const handleGenerate = useCallback(() => {
    saveMutation.mutate(invoicePayload, {
      onSuccess: () => {
        downloadInvoicePdf({
          invoiceNumber,
          invoiceDate,
          dueDate,
          seller,
          buyer,
          lineItems,
          amountInWords,
        });
      },
    });
  }, [
    invoicePayload,
    invoiceNumber,
    invoiceDate,
    dueDate,
    seller,
    buyer,
    lineItems,
    amountInWords,
    saveMutation,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!invoiceNumber}
            loading={saveMutation.isPending}
            size="icon"
            className="sm:h-9 sm:w-auto sm:px-4"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("common.save")}</span>
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!invoiceNumber}
            loading={saveMutation.isPending}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("invoices.generatePdf")}
          </Button>
        </div>
      </div>

      {/* Invoice metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("invoices.editor")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t("invoices.invoiceNumber")}</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("invoices.invoiceDate")}</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("invoices.dueDate")}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <Label>{t("invoices.amountInWords")}</Label>
            <div className="flex gap-2">
              <Input
                value={amountInWords}
                onChange={(e) => {
                  setUserEditedWords(true);
                  setAmountInWords(e.target.value);
                }}
                className="flex-1"
              />
              {userEditedWords && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={recalculateWords}
                >
                  {t("invoices.recalculate")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("invoices.lineItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItemsEditor items={lineItems} onChange={setLineItems} />
        </CardContent>
      </Card>

      <Separator />

      {/* Live preview */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t("invoices.preview")}</h3>
        <div className="overflow-x-auto">
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            dueDate={dueDate}
            seller={seller}
            buyer={buyer}
            lineItems={lineItems}
            amountInWords={amountInWords}
          />
        </div>
      </div>
    </div>
  );
}

export default function InvoiceEditorPage() {
  const { id: serviceId } = useParams<{ id: string }>();

  const { data, isLoading } = useInvoiceData(serviceId!);
  const { data: existingInvoice, isLoading: loadingInvoice } =
    useExistingInvoice(serviceId!);

  if (isLoading || loadingInvoice || !data) {
    return <PageSpinner />;
  }

  return (
    <InvoiceEditorLoaded
      serviceId={serviceId!}
      data={data}
      existingInvoice={existingInvoice ?? null}
    />
  );
}
