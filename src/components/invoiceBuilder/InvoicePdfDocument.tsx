import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import { lineItemAmount, computeSubtotal, computeTax, computeTotal, formatMoney } from '@/lib/pdfInvoice'
import type { BusinessProfile, PdfInvoice } from '@/types'

const NAVY = '#142127'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#1f2937' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  businessName: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  smallText: { fontSize: 8, color: '#374151', lineHeight: 1.5 },
  invoiceTitle: { fontSize: 22, fontWeight: 700, color: NAVY },
  barRow: { flexDirection: 'row', marginBottom: 12 },
  billToBox: { flex: 1, marginRight: 16 },
  bar: {
    backgroundColor: NAVY,
    color: '#fff',
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  billToBody: { paddingTop: 6, paddingHorizontal: 2 },
  billToLine: { fontSize: 8, marginBottom: 2 },
  metaBox: { width: 190 },
  metaRow: { flexDirection: 'row' },
  metaCol: { flex: 1, paddingRight: 4 },
  metaLabel: {
    backgroundColor: NAVY,
    color: '#fff',
    fontSize: 7,
    fontWeight: 700,
    paddingVertical: 3,
    paddingHorizontal: 6,
    textTransform: 'uppercase',
  },
  metaValue: { fontSize: 8, paddingVertical: 3, paddingHorizontal: 6, color: '#1f2937' },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY },
  tableHeaderCell: { color: '#fff', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  cellDescription: { flex: 3, padding: 6 },
  cellDateRange: { flex: 1.4, padding: 6, color: '#4b5563' },
  cellQty: { flex: 0.6, padding: 6, textAlign: 'right' },
  cellRate: { flex: 0.8, padding: 6, textAlign: 'right' },
  cellAmount: { flex: 0.9, padding: 6, textAlign: 'right' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  thankYou: { fontSize: 9, fontStyle: 'italic', color: NAVY, maxWidth: 240 },
  totalsBox: { width: 200 },
  totalsLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { fontSize: 8, color: '#4b5563' },
  totalsValue: { fontSize: 8, color: '#1f2937' },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: NAVY, padding: 8, marginTop: 4 },
  totalBarText: { color: '#fff', fontSize: 10, fontWeight: 700 },
})

interface InvoicePdfDocumentProps {
  businessProfile: BusinessProfile | null
  invoice: Pick<
    PdfInvoice,
    | 'invoice_number'
    | 'invoice_date'
    | 'due_date'
    | 'terms'
    | 'client_name'
    | 'client_company'
    | 'client_address'
    | 'tax_rate'
    | 'thank_you_note'
    | 'line_items'
  >
}

export function InvoicePdfDocument({ businessProfile, invoice }: InvoicePdfDocumentProps) {
  const subtotal = computeSubtotal(invoice.line_items)
  const tax = computeTax(subtotal, invoice.tax_rate)
  const total = computeTotal(subtotal, tax)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {businessProfile?.business_name && <Text style={styles.businessName}>{businessProfile.business_name}</Text>}
            {businessProfile?.address && <Text style={styles.smallText}>{businessProfile.address}</Text>}
            {businessProfile?.phone && <Text style={styles.smallText}>{businessProfile.phone}</Text>}
            {businessProfile?.email && <Text style={styles.smallText}>{businessProfile.email}</Text>}
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        <View style={styles.barRow}>
          <View style={styles.billToBox}>
            <Text style={styles.bar}>Bill To</Text>
            <View style={styles.billToBody}>
              <Text style={styles.billToLine}>{invoice.client_name}</Text>
              {invoice.client_company && <Text style={styles.billToLine}>{invoice.client_company}</Text>}
              {invoice.client_address && <Text style={styles.smallText}>{invoice.client_address}</Text>}
            </View>
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Invoice #</Text>
                <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{format(parseLocalDate(invoice.invoice_date), 'MM/dd/yy')}</Text>
              </View>
            </View>
            {(invoice.terms || invoice.due_date) && (
              <View style={[styles.metaRow, { marginTop: 6 }]}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Terms</Text>
                  <Text style={styles.metaValue}>{invoice.terms || '—'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Due Date</Text>
                  <Text style={styles.metaValue}>
                    {invoice.due_date ? format(parseLocalDate(invoice.due_date), 'MM/dd/yy') : '—'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Date Range</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.6, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>Amount</Text>
          </View>
          {invoice.line_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.cellDescription}>{item.description}</Text>
              <Text style={styles.cellDateRange}>{item.date_range}</Text>
              <Text style={styles.cellQty}>{item.qty}</Text>
              <Text style={styles.cellRate}>{item.rate.toFixed(2)}</Text>
              <Text style={styles.cellAmount}>{lineItemAmount(item).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.thankYou}>{invoice.thank_you_note}</Text>
          <View style={styles.totalsBox}>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatMoney(subtotal)}</Text>
            </View>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Tax Rate</Text>
              <Text style={styles.totalsValue}>{invoice.tax_rate.toFixed(3)}%</Text>
            </View>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{formatMoney(tax)}</Text>
            </View>
            <View style={styles.totalBar}>
              <Text style={styles.totalBarText}>TOTAL</Text>
              <Text style={styles.totalBarText}>{formatMoney(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
