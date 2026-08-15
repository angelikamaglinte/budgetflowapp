import type { BusinessProfile, PdfInvoice } from '@/types'

export async function downloadInvoicePdf(businessProfile: BusinessProfile | null, invoice: PdfInvoice) {
  const [{ pdf }, { InvoicePdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/invoiceBuilder/InvoicePdfDocument'),
  ])
  const blob = await pdf(<InvoicePdfDocument businessProfile={businessProfile} invoice={invoice} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice-${invoice.invoice_number}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
