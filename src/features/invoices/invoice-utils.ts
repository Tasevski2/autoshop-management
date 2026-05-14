import type { InvoiceLineItem } from './types'

export function fmt(n: number): string {
  return n.toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function calcLineItem(item: InvoiceLineItem) {
  const baseTotal = item.priceWithoutTax * item.quantity
  const discountAmount = baseTotal * (item.discountPercent / 100)
  const afterDiscount = baseTotal - discountAmount
  const vatAmount = afterDiscount * (item.vatPercent / 100)
  const totalWithVat = afterDiscount + vatAmount
  return { discountAmount, afterDiscount, vatAmount, totalWithVat }
}
