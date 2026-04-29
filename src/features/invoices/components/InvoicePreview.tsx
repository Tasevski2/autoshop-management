import { useMemo } from 'react'
import type { InvoiceLineItem, InvoiceSeller, InvoiceBuyer } from '@/features/invoices/types'
import { numberToWordsMk } from '@/lib/number-to-words-mk'

interface Props {
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

export default function InvoicePreview({
  invoiceNumber,
  invoiceDate,
  dueDate,
  seller,
  buyer,
  lineItems,
}: Props) {
  const { tariffs, totalWithoutVat, totalVat, totalWithVat } = useMemo(() => {
    let twv = 0
    let tv = 0
    const tMap = new Map<number, { base: number; vat: number; total: number }>()
    for (const item of lineItems) {
      const { afterDiscount, vatAmount, totalWithVat: itemTotal } = calcLineItem(item)
      twv += afterDiscount
      tv += vatAmount
      const e = tMap.get(item.vatPercent) ?? { base: 0, vat: 0, total: 0 }
      e.base += afterDiscount
      e.vat += vatAmount
      e.total += itemTotal
      tMap.set(item.vatPercent, e)
    }
    return {
      tariffs: Array.from(tMap.entries()),
      totalWithoutVat: twv,
      totalVat: tv,
      totalWithVat: twv + tv,
    }
  }, [lineItems])

  const taxNumberLabel = buyer.customerType === 'company' ? 'Даночен Број' : 'Даночен Број(ЕМБГ)'

  return (
    <div className="bg-white text-black p-8 text-[11px] leading-[1.4] shadow-md border" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-[22px] font-bold tracking-wider mb-1">
          {seller.workshopName ?? seller.fullName}
        </h1>
        <div className="text-[10px] text-gray-700">
          {seller.address && <div>{seller.address}</div>}
          <div>
            {[
              seller.phone && `Тел.: ${seller.phone}`,
            ].filter(Boolean).join(' * ')}
          </div>
          <div>
            {[
              seller.bankAccount && `Жиро сметка: ${seller.bankAccount}`,
              seller.bankName && `Банка: ${seller.bankName}`,
              seller.taxId && `ЕДБ: ${seller.taxId}`,
            ].filter(Boolean).join(' * ')}
          </div>
          {seller.email && <div>{seller.email}</div>}
        </div>
      </div>

      {/* Meta + Buyer */}
      <div className="flex justify-between mb-4">
        <div>
          <div className="mb-2">
            <span className="font-bold">Датум</span>
            <span className="ml-2 mr-4">{invoiceDate}</span>
          </div>
          <div className="mb-3">
            <span className="font-bold">Валута</span>
            <span className="ml-2">{dueDate}</span>
          </div>
          <div className="text-[15px] font-bold">
            ФАКТУРА<br />
            број: {invoiceNumber}
          </div>
        </div>
        <div className="border border-black p-3 min-w-[250px]">
          <h3 className="text-[13px] font-bold mb-1">{buyer.name}</h3>
          {buyer.address && <p className="text-[11px]">{buyer.address}</p>}
          {buyer.city && <p className="text-[11px]">{buyer.city}</p>}
          {buyer.taxNumber && <p className="text-[11px]">{taxNumberLabel}: {buyer.taxNumber}</p>}
        </div>
      </div>

      {/* Line items table */}
      <table className="w-full border-collapse mb-3 text-[10px]">
        <thead>
          <tr>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[30px]">Р.б</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px]">Опис</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[35px]">Е М</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[60px]">Количина</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[75px]">Цена без данок</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[45px]">Рабат %</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[60px]">Рабат</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[40px]">ДДВ %</th>
            <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[80px]">Износ со ДДВ</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => {
            const { discountAmount, totalWithVat: itemTotal } = calcLineItem(item)
            return (
              <tr key={i}>
                <td className="border border-black p-1 text-center">{i + 1}.</td>
                <td className="border border-black p-1 whitespace-pre-wrap">{item.description}</td>
                <td className="border border-black p-1 text-center">{item.unit}</td>
                <td className="border border-black p-1 text-right">{fmt(item.quantity)}</td>
                <td className="border border-black p-1 text-right">{fmt(item.priceWithoutTax)}</td>
                <td className="border border-black p-1 text-center">{item.discountPercent}</td>
                <td className="border border-black p-1 text-right">{fmt(discountAmount)}</td>
                <td className="border border-black p-1 text-center">{item.vatPercent}</td>
                <td className="border border-black p-1 text-right">{fmt(itemTotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Tariff summary */}
      <table className="border-collapse mb-5 text-[10px]">
        <thead>
          <tr>
            <th className="border border-black bg-gray-100 p-1 text-[9px]">Тарифа</th>
            <th className="border border-black bg-gray-100 p-1 text-[9px]">Износ без ДДВ</th>
            <th className="border border-black bg-gray-100 p-1 text-[9px]">ДДВ</th>
            <th className="border border-black bg-gray-100 p-1 text-[9px]">Износ со ДДВ</th>
          </tr>
        </thead>
        <tbody>
          {tariffs.map(([rate, { base, vat, total }]) => (
            <tr key={rate}>
              <td className="border border-black px-2 py-1">{rate}%</td>
              <td className="border border-black px-2 py-1 text-right">{fmt(base)}</td>
              <td className="border border-black px-2 py-1 text-right">{fmt(vat)}</td>
              <td className="border border-black px-2 py-1 text-right">{fmt(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-5">
        <table className="text-[11px]">
          <tbody>
            <tr>
              <td className="text-right pr-3 py-1">Износ без ДДВ:</td>
              <td className="text-right font-bold min-w-[90px] py-1">{fmt(totalWithoutVat)}</td>
            </tr>
            <tr>
              <td className="text-right pr-3 py-1">ДДВ+</td>
              <td className="text-right font-bold py-1">{fmt(totalVat)}</td>
            </tr>
            <tr>
              <td className="text-right pr-3 py-1">Вкупен износ со ДДВ</td>
              <td className="text-right font-bold py-1">{fmt(totalWithVat)}</td>
            </tr>
            <tr>
              <td className="bg-black text-white font-bold text-[13px] px-3 py-1.5">За наплата</td>
              <td className="bg-black text-white font-bold text-[13px] text-right px-3 py-1.5">{fmt(totalWithVat)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Late payment clause */}
      <p className="text-[9px] text-gray-700 mt-6 mb-4">
        За секое каснење после валутниот рок, засметуваме законска затезна камата.
      </p>

      {/* Amount in words */}
      <p className="text-[12px] font-bold mb-8">
        Со зборови: {numberToWordsMk(Math.round(totalWithVat))}
      </p>

      {/* Signatures */}
      <div className="flex justify-between mt-12">
        <div className="text-center min-w-[180px]">
          <div className="border-t border-black mt-10 pt-1 text-[10px]">ПРИМИЛ</div>
        </div>
        <div className="text-center min-w-[180px]">
          <div className="border-t border-black mt-10 pt-1 text-[10px]">
            Лице со овластување за потпишување фактури:<br />
            {seller.authorizedSigner ?? seller.fullName}
          </div>
        </div>
      </div>
    </div>
  )
}
