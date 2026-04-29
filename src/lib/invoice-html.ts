import type { InvoiceLineItem, InvoiceSeller, InvoiceBuyer } from '@/features/invoices/types'
import { numberToWordsMk } from './number-to-words-mk'

interface InvoiceHtmlParams {
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

export function generateInvoiceHtml(params: InvoiceHtmlParams): string {
  const { invoiceNumber, invoiceDate, dueDate, seller, buyer, lineItems } = params

  // Calculate totals
  let totalWithoutVat = 0
  let totalVat = 0
  const tariffMap = new Map<number, { base: number; vat: number; total: number }>()

  for (const item of lineItems) {
    const { afterDiscount, vatAmount, totalWithVat } = calcLineItem(item)
    totalWithoutVat += afterDiscount
    totalVat += vatAmount

    const existing = tariffMap.get(item.vatPercent) ?? { base: 0, vat: 0, total: 0 }
    existing.base += afterDiscount
    existing.vat += vatAmount
    existing.total += totalWithVat
    tariffMap.set(item.vatPercent, existing)
  }

  const totalWithVat = totalWithoutVat + totalVat
  const taxNumberLabel = buyer.customerType === 'company' ? 'Даночен Број' : 'Даночен Број(ЕМБГ)'

  // Line items HTML
  const lineItemsHtml = lineItems
    .map((item, i) => {
      const { discountAmount, totalWithVat } = calcLineItem(item)
      return `
        <tr>
          <td style="text-align:center">${i + 1}.</td>
          <td style="white-space:pre-wrap">${item.description}</td>
          <td style="text-align:center">${item.unit}</td>
          <td style="text-align:right">${fmt(item.quantity)}</td>
          <td style="text-align:right">${fmt(item.priceWithoutTax)}</td>
          <td style="text-align:center">${item.discountPercent}</td>
          <td style="text-align:right">${fmt(discountAmount)}</td>
          <td style="text-align:center">${item.vatPercent}</td>
          <td style="text-align:right">${fmt(totalWithVat)}</td>
        </tr>`
    })
    .join('\n')

  // Tariff summary rows
  const tariffRows = Array.from(tariffMap.entries())
    .map(
      ([rate, { base, vat, total }]) => `
      <tr>
        <td>${rate}%</td>
        <td style="text-align:right">${fmt(base)}</td>
        <td style="text-align:right">${fmt(vat)}</td>
        <td style="text-align:right">${fmt(total)}</td>
      </tr>`
    )
    .join('\n')

  // Seller info lines
  const sellerLines: string[] = []
  if (seller.address) sellerLines.push(seller.address)
  const contactParts: string[] = []
  if (seller.phone) contactParts.push(`Тел.: ${seller.phone}`)
  if (contactParts.length) sellerLines.push(contactParts.join(' * '))
  const financialParts: string[] = []
  if (seller.bankAccount) financialParts.push(`Жиро сметка: ${seller.bankAccount}`)
  if (seller.bankName) financialParts.push(`Банка: ${seller.bankName}`)
  if (seller.taxId) financialParts.push(`ЕДБ: ${seller.taxId}`)
  if (financialParts.length) sellerLines.push(financialParts.join(' * '))
  if (seller.email) sellerLines.push(seller.email)

  const amountInWords = numberToWordsMk(Math.round(totalWithVat))

  return `<!DOCTYPE html>
<html lang="mk">
<head>
<meta charset="UTF-8">
<title>Фактура ${invoiceNumber}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
    line-height: 1.4;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    margin: 0 auto;
    background: #fff;
  }
  @media print {
    .page { padding: 0; width: 100%; min-height: auto; }
    .no-print { display: none !important; }
  }
  @media screen {
    body { background: #e5e5e5; padding: 20px 0; }
    .page { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  }

  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: bold; letter-spacing: 2px; margin-bottom: 4px; }
  .header-info { font-size: 10px; color: #333; }

  .meta-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .meta-left { font-size: 11px; }
  .meta-left dt { font-weight: bold; display: inline; }
  .meta-left dd { display: inline; margin-left: 8px; margin-right: 16px; }
  .buyer-box { border: 1px solid #000; padding: 10px 14px; min-width: 250px; }
  .buyer-box h3 { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
  .buyer-box p { font-size: 11px; margin: 2px 0; }

  .invoice-title { font-size: 15px; font-weight: bold; margin: 8px 0 15px; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
  table.items th, table.items td { border: 1px solid #000; padding: 4px 6px; }
  table.items th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 9px; }

  table.tariff { border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
  table.tariff th, table.tariff td { border: 1px solid #000; padding: 3px 8px; }
  table.tariff th { background: #f5f5f5; font-size: 9px; }

  .totals-box { float: right; margin-bottom: 20px; }
  .totals-box table { border-collapse: collapse; font-size: 11px; }
  .totals-box td { padding: 3px 12px; }
  .totals-box .label { text-align: right; }
  .totals-box .value { text-align: right; font-weight: bold; min-width: 90px; }
  .totals-box .pay-row { background: #000; color: #fff; font-size: 13px; font-weight: bold; }

  .clearfix::after { content: ""; display: table; clear: both; }

  .footer { margin-top: 40px; font-size: 10px; }
  .late-clause { margin: 25px 0 15px; font-size: 9px; color: #333; }
  .words { font-size: 12px; font-weight: bold; margin: 15px 0 30px; }

  .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
  .sig-block { text-align: center; min-width: 180px; }
  .sig-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; font-size: 10px; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <h1>${seller.workshopName ?? seller.fullName}</h1>
    <div class="header-info">
      ${sellerLines.join('<br>')}
    </div>
  </div>

  <!-- Meta row: dates + buyer -->
  <div class="meta-row">
    <div class="meta-left">
      <div style="margin-bottom:8px">
        <dt>Датум</dt><dd>${invoiceDate}</dd>
      </div>
      <div style="margin-bottom:12px">
        <dt>Валута</dt><dd>${dueDate}</dd>
      </div>
      <div class="invoice-title">ФАКТУРА<br>број: ${invoiceNumber}</div>
    </div>
    <div class="buyer-box">
      <h3>${buyer.name}</h3>
      ${buyer.address ? `<p>${buyer.address}</p>` : ''}
      ${buyer.city ? `<p>${buyer.city}</p>` : ''}
      ${buyer.taxNumber ? `<p>${taxNumberLabel}: ${buyer.taxNumber}</p>` : ''}
    </div>
  </div>

  <!-- Line items table -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:30px">Р.б</th>
        <th>Опис</th>
        <th style="width:35px">Е М</th>
        <th style="width:60px">Количина</th>
        <th style="width:75px">Цена без данок</th>
        <th style="width:45px">Рабат %</th>
        <th style="width:60px">Рабат</th>
        <th style="width:40px">ДДВ %</th>
        <th style="width:80px">Износ со ДДВ</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <!-- Tariff summary -->
  <table class="tariff">
    <thead>
      <tr>
        <th>Тарифа</th>
        <th>Износ без ДДВ</th>
        <th>ДДВ</th>
        <th>Износ со ДДВ</th>
      </tr>
    </thead>
    <tbody>
      ${tariffRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="clearfix">
    <div class="totals-box">
      <table>
        <tr>
          <td class="label">Износ без ДДВ:</td>
          <td class="value">${fmt(totalWithoutVat)}</td>
        </tr>
        <tr>
          <td class="label">ДДВ+</td>
          <td class="value">${fmt(totalVat)}</td>
        </tr>
        <tr>
          <td class="label">Вкупен износ со ДДВ</td>
          <td class="value">${fmt(totalWithVat)}</td>
        </tr>
        <tr class="pay-row">
          <td style="padding:6px 12px">За наплата</td>
          <td style="padding:6px 12px;text-align:right">${fmt(totalWithVat)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Late payment clause -->
  <div class="late-clause">
    За секое каснење после валутниот рок, засметуваме законска затезна камата.
  </div>

  <!-- Amount in words -->
  <div class="words">
    Со зборови: ${amountInWords}
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">ПРИМИЛ</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        Лице со овластување за потпишување фактури:<br>
        ${seller.authorizedSigner ?? seller.fullName}
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

