declare module 'pdfmake/build/pdfmake' {
  import type { TDocumentDefinitions, TCreatedPdf } from 'pdfmake/interfaces'

  interface PdfMakeStatic {
    vfs: Record<string, string>
    createPdf(docDefinition: TDocumentDefinitions): TCreatedPdf
  }

  const pdfMake: PdfMakeStatic
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string> & {
    pdfMake?: { vfs: Record<string, string> }
  }
  export default vfs
}

declare module 'pdfmake/interfaces' {
  export interface TCreatedPdf {
    download(defaultFileName?: string): void
    open(): void
    print(): void
    getBlob(cb: (blob: Blob) => void): void
    getBase64(cb: (data: string) => void): void
    getBuffer(cb: (buffer: ArrayBuffer) => void): void
  }

  export type Margins = number | [number, number] | [number, number, number, number]

  export interface Style {
    font?: string
    fontSize?: number
    bold?: boolean
    italics?: boolean
    alignment?: 'left' | 'center' | 'right' | 'justify'
    color?: string
    fillColor?: string
    margin?: Margins
    lineHeight?: number
    [key: string]: unknown
  }

  export type Content =
    | string
    | { text: string | Content[]; [key: string]: unknown }
    | { columns: Content[]; [key: string]: unknown }
    | { stack: Content[]; [key: string]: unknown }
    | { table: { body: TableCell[][]; widths?: (string | number)[]; headerRows?: number; [key: string]: unknown }; [key: string]: unknown }
    | { ul: Content[]; [key: string]: unknown }
    | { ol: Content[]; [key: string]: unknown }
    | { canvas: unknown[]; [key: string]: unknown }
    | Content[]

  export type TableCell = string | number | { text: string | number; [key: string]: unknown } | Content

  export interface TDocumentDefinitions {
    content: Content | Content[]
    styles?: Record<string, Style>
    defaultStyle?: Style
    pageSize?: string | { width: number; height: number }
    pageOrientation?: 'portrait' | 'landscape'
    pageMargins?: Margins
    header?: Content | ((currentPage: number, pageCount: number) => Content)
    footer?: Content | ((currentPage: number, pageCount: number) => Content)
    info?: { title?: string; author?: string; subject?: string; keywords?: string }
    [key: string]: unknown
  }
}
