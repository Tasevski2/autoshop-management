import type { Database } from '@/types/database'
import type { CustomerType } from '@/lib/enums'

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

export interface InvoiceLineItem {
  description: string
  unit: string
  quantity: number
  priceWithoutTax: number
  discountPercent: number
  vatPercent: number
}

export interface InvoiceSeller {
  workshopName: string | null
  fullName: string
  address: string | null
  phone: string | null
  email: string | null
  bankAccount: string | null
  bankName: string | null
  taxId: string | null
  authorizedSigner: string | null
}

export interface InvoiceBuyer {
  name: string
  customerType: CustomerType
  address: string | null
  city: string | null
  taxNumber: string | null
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  seller: InvoiceSeller
  buyer: InvoiceBuyer
  lineItems: InvoiceLineItem[]
  serviceId: string
}
