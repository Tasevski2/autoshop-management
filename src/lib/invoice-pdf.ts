import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { InvoiceLineItem, InvoiceSeller, InvoiceBuyer } from '@/features/invoices/types'
import { numberToWordsMk } from './number-to-words-mk'

// Register bundled Roboto (includes Cyrillic glyphs)
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts

export interface InvoicePdfParams {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  seller: InvoiceSeller
  buyer: InvoiceBuyer
  lineItems: InvoiceLineItem[]
}

function fmt(n: number): string {
  return n.toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcLineItem(item: InvoiceLineItem) {
  const baseTotal = item.priceWithoutTax * item.quantity
  const discountAmount = baseTotal * (item.discountPercent / 100)
  const afterDiscount = baseTotal - discountAmount
  const vatAmount = afterDiscount * (item.vatPercent / 100)
  const totalWithVat = afterDiscount + vatAmount
  return { discountAmount, afterDiscount, vatAmount, totalWithVat }
}

function buildDocDefinition(params: InvoicePdfParams): TDocumentDefinitions {
  const { invoiceNumber, invoiceDate, dueDate, seller, buyer, lineItems } = params

  // ── Totals ──
  let totalWithoutVat = 0
  let totalVat = 0
  const tariffMap = new Map<number, { base: number; vat: number; total: number }>()

  for (const item of lineItems) {
    const { afterDiscount, vatAmount, totalWithVat } = calcLineItem(item)
    totalWithoutVat += afterDiscount
    totalVat += vatAmount
    const e = tariffMap.get(item.vatPercent) ?? { base: 0, vat: 0, total: 0 }
    e.base += afterDiscount
    e.vat += vatAmount
    e.total += totalWithVat
    tariffMap.set(item.vatPercent, e)
  }
  const totalWithVat = totalWithoutVat + totalVat
  const taxNumberLabel = buyer.customerType === 'company' ? 'Даночен Број' : 'Даночен Број(ЕМБГ)'

  // ── Seller header lines ──
  const sellerSubLines: string[] = []
  if (seller.address) sellerSubLines.push(seller.address)
  const contactParts: string[] = []
  if (seller.phone) contactParts.push(`Тел.: ${seller.phone}`)
  if (contactParts.length) sellerSubLines.push(contactParts.join(' * '))
  const financialParts: string[] = []
  if (seller.bankAccount) financialParts.push(`Жиро сметка: ${seller.bankAccount}`)
  if (seller.bankName) financialParts.push(`Банка: ${seller.bankName}`)
  if (seller.taxId) financialParts.push(`ЕДБ: ${seller.taxId}`)
  if (financialParts.length) sellerSubLines.push(financialParts.join(' * '))
  if (seller.email) sellerSubLines.push(seller.email)

  // ── Line items table ──
  const tableHeaders: TableCell[] = [
    { text: 'Р.б', style: 'thCenter' },
    { text: 'Опис', style: 'th' },
    { text: 'Е М', style: 'thCenter' },
    { text: 'Количина', style: 'thRight' },
    { text: 'Цена без данок', style: 'thRight' },
    { text: 'Рабат %', style: 'thCenter' },
    { text: 'Рабат', style: 'thRight' },
    { text: 'ДДВ %', style: 'thCenter' },
    { text: 'Износ со ДДВ', style: 'thRight' },
  ]

  const tableBody: TableCell[][] = lineItems.map((item, i) => {
    const { discountAmount, totalWithVat: itemTotal } = calcLineItem(item)
    return [
      { text: `${i + 1}.`, alignment: 'center' as const },
      { text: item.description },
      { text: item.unit, alignment: 'center' as const },
      { text: fmt(item.quantity), alignment: 'right' as const },
      { text: fmt(item.priceWithoutTax), alignment: 'right' as const },
      { text: String(item.discountPercent), alignment: 'center' as const },
      { text: fmt(discountAmount), alignment: 'right' as const },
      { text: String(item.vatPercent), alignment: 'center' as const },
      { text: fmt(itemTotal), alignment: 'right' as const },
    ]
  })

  // ── Tariff summary table ──
  const tariffHeaders: TableCell[] = [
    { text: 'Тарифа', style: 'th' },
    { text: 'Износ без ДДВ', style: 'thRight' },
    { text: 'ДДВ', style: 'thRight' },
    { text: 'Износ со ДДВ', style: 'thRight' },
  ]

  const tariffBody: TableCell[][] = Array.from(tariffMap.entries()).map(([rate, { base, vat, total }]) => [
    { text: `${rate}%` },
    { text: fmt(base), alignment: 'right' as const },
    { text: fmt(vat), alignment: 'right' as const },
    { text: fmt(total), alignment: 'right' as const },
  ])

  // ── Buyer block ──
  const buyerContent: Content[] = [
    { text: buyer.name, bold: true, fontSize: 11 },
  ]
  if (buyer.address) buyerContent.push({ text: buyer.address })
  if (buyer.city) buyerContent.push({ text: buyer.city })
  if (buyer.taxNumber) buyerContent.push({ text: `${taxNumberLabel}: ${buyer.taxNumber}` })

  // ── Build document ──
  const content: Content[] = [
    // Header
    { text: seller.workshopName ?? seller.fullName, style: 'workshopName', alignment: 'center' },
    { text: sellerSubLines.join('\n'), alignment: 'center', fontSize: 8, color: '#333', margin: [0, 0, 0, 15] },

    // Meta row: dates + buyer
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: [{ text: 'Датум  ', bold: true }, invoiceDate], margin: [0, 0, 0, 4] },
            { text: [{ text: 'Валута  ', bold: true }, dueDate], margin: [0, 0, 0, 10] },
            { text: 'ФАКТУРА', bold: true, fontSize: 14 },
            { text: `број: ${invoiceNumber}`, bold: true, fontSize: 14 },
          ],
        },
        {
          width: 'auto',
          stack: buyerContent,
          margin: [0, 0, 0, 0],
          style: 'buyerBox',
        },
      ],
      margin: [0, 0, 0, 15],
    },

    // Line items table
    {
      table: {
        headerRows: 1,
        widths: [22, '*', 25, 45, 60, 32, 45, 28, 65],
        body: [tableHeaders, ...tableBody],
      },
      layout: {
        fillColor: (rowIndex: number) => rowIndex === 0 ? '#f5f5f5' : null,
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingTop: () => 3,
        paddingBottom: () => 3,
        paddingLeft: () => 4,
        paddingRight: () => 4,
      },
      fontSize: 8,
      margin: [0, 0, 0, 10],
    },

    // Tariff summary
    {
      table: {
        headerRows: 1,
        widths: [40, 80, 60, 80],
        body: [tariffHeaders, ...tariffBody],
      },
      layout: {
        fillColor: (rowIndex: number) => rowIndex === 0 ? '#f5f5f5' : null,
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingTop: () => 2,
        paddingBottom: () => 2,
        paddingLeft: () => 6,
        paddingRight: () => 6,
      },
      fontSize: 8,
      margin: [0, 0, 0, 15],
    },

    // Totals (right-aligned)
    {
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          table: {
            body: [
              [
                { text: 'Износ без ДДВ:', alignment: 'right' as const },
                { text: fmt(totalWithoutVat), alignment: 'right' as const, bold: true },
              ],
              [
                { text: 'ДДВ+', alignment: 'right' as const },
                { text: fmt(totalVat), alignment: 'right' as const, bold: true },
              ],
              [
                { text: 'Вкупен износ со ДДВ', alignment: 'right' as const },
                { text: fmt(totalWithVat), alignment: 'right' as const, bold: true },
              ],
              [
                { text: 'За наплата', fillColor: '#000', color: '#fff', bold: true, fontSize: 11, alignment: 'left' as const, margin: [4, 3, 4, 3] },
                { text: fmt(totalWithVat), fillColor: '#000', color: '#fff', bold: true, fontSize: 11, alignment: 'right' as const, margin: [4, 3, 4, 3] },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingTop: () => 2,
            paddingBottom: () => 2,
            paddingLeft: () => 8,
            paddingRight: () => 8,
          },
          fontSize: 9,
        },
      ],
      margin: [0, 0, 0, 20],
    },

    // Late payment clause
    { text: 'За секое каснење после валутниот рок, засметуваме законска затезна камата.', fontSize: 7, color: '#333', margin: [0, 0, 0, 10] },

    // Amount in words
    { text: `Со зборови: ${numberToWordsMk(Math.round(totalWithVat))}`, bold: true, fontSize: 10, margin: [0, 0, 0, 40] },

    // Signatures
    {
      columns: [
        {
          width: '*',
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 3] },
            { text: 'ПРИМИЛ', alignment: 'center', fontSize: 8 },
          ],
        },
        {
          width: '*',
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 3] },
            { text: 'Лице со овластување за потпишување фактури:', alignment: 'center', fontSize: 8 },
            { text: seller.authorizedSigner ?? seller.fullName, alignment: 'center', fontSize: 8 },
          ],
        },
      ],
    },
  ]

  return {
    pageSize: 'A4',
    pageMargins: [40, 30, 40, 30],
    content,
    styles: {
      workshopName: { fontSize: 18, bold: true, margin: [0, 0, 0, 3] },
      th: { bold: true, fontSize: 7, fillColor: '#f5f5f5' },
      thCenter: { bold: true, fontSize: 7, fillColor: '#f5f5f5', alignment: 'center' },
      thRight: { bold: true, fontSize: 7, fillColor: '#f5f5f5', alignment: 'right' },
      buyerBox: { fontSize: 9 },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
  }
}

/**
 * Downloads the invoice as a PDF file named after the invoice number.
 */
export function downloadInvoicePdf(params: InvoicePdfParams) {
  const docDefinition = buildDocDefinition(params)
  pdfMake.createPdf(docDefinition).download(`${params.invoiceNumber}.pdf`)
}
