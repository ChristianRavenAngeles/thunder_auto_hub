'use client'
// Invoice / Receipt PDF generator — client-side using jsPDF

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from './pricing'
import { format } from 'date-fns'

export function generateInvoicePDF(booking) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  const W = doc.internal.pageSize.getWidth()

  // Header bar
  doc.setFillColor(6, 148, 162)
  doc.rect(0, 0, W, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('THUNDER AUTO HUB', 14, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Premium Home-Service Car Care', 14, 18)
  doc.text('thunder.auto.hub@gmail.com', 14, 23)

  // Invoice label
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('INVOICE / RECEIPT', W - 14, 12, { align: 'right' })
  doc.setFontSize(8)
  doc.text(`Ref: ${booking.reference_no}`, W - 14, 18, { align: 'right' })
  doc.text(`Date: ${format(new Date(booking.created_at), 'MMM dd, yyyy')}`, W - 14, 23, { align: 'right' })

  // Customer info
  doc.setTextColor(3, 43, 50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BILLED TO:', 14, 36)
  doc.setFont('helvetica', 'normal')
  doc.text(booking.profiles?.full_name ?? 'Customer', 14, 41)
  doc.text(booking.profiles?.phone ?? '', 14, 46)
  doc.text(`${booking.barangay}, ${booking.city}`, 14, 51)

  // Service date
  doc.setFont('helvetica', 'bold')
  doc.text('SERVICE DATE:', W - 65, 36)
  doc.setFont('helvetica', 'normal')
  doc.text(format(new Date(booking.scheduled_date), 'MMMM dd, yyyy'), W - 65, 41)
  doc.text(booking.scheduled_time ?? '', W - 65, 46)

  // Vehicle
  if (booking.vehicles) {
    doc.setFont('helvetica', 'bold')
    doc.text('VEHICLE:', 14, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`${booking.vehicles.make} ${booking.vehicles.model} (${booking.vehicles.tier})`, 14, 65)
    if (booking.vehicles.plate) doc.text(`Plate: ${booking.vehicles.plate}`, 14, 70)
  }

  // Services table
  const tableRows = (booking.booking_services ?? []).map(item => [
    item.service_name,
    item.quantity,
    formatPrice(item.unit_price),
    formatPrice(item.subtotal),
  ])

  autoTable(doc, {
    startY: 76,
    head: [['Service', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [6, 148, 162], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles:  { fontSize: 8, textColor: [3, 43, 50] },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 12, halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 5

  // Totals
  const totals = [
    ['Subtotal', formatPrice(booking.subtotal)],
    ...(booking.travel_fee > 0 ? [['Travel Fee', formatPrice(booking.travel_fee)]] : []),
    ...(booking.discount_amount > 0 ? [['Discount', `- ${formatPrice(booking.discount_amount)}`]] : []),
    ['TOTAL', formatPrice(booking.total_price)],
    ['Deposit Paid', `- ${formatPrice(booking.deposit_amount)}`],
    ['Balance Due', formatPrice(Math.max(0, booking.total_price - booking.deposit_amount))],
  ]

  totals.forEach(([label, val], i) => {
    const isTotal = label === 'TOTAL'
    if (isTotal) {
      doc.setFillColor(6, 148, 162)
      doc.setTextColor(255, 255, 255)
      doc.rect(W - 70, finalY + i * 6 - 4, 56, 7, 'F')
    } else {
      doc.setTextColor(3, 43, 50)
    }
    doc.setFontSize(isTotal ? 10 : 8)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.text(label, W - 42, finalY + i * 6, { align: 'right' })
    doc.text(val, W - 14, finalY + i * 6, { align: 'right' })
  })

  // Payment status badge
  const statusY = finalY + totals.length * 6 + 8
  doc.setFillColor(booking.payment_status === 'paid' ? '#16a34a' : '#f59e0b')
  doc.setFillColor(booking.payment_status === 'paid' ? 22 : 245, booking.payment_status === 'paid' ? 163 : 158, booking.payment_status === 'paid' ? 74 : 11)
  doc.roundedRect(14, statusY, 40, 7, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(booking.payment_status?.toUpperCase() ?? 'PENDING', 34, statusY + 4.5, { align: 'center' })

  // Footer
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const pageH = doc.internal.pageSize.getHeight()
  doc.text('Thank you for choosing Thunder Auto Hub! 🙏', W / 2, pageH - 8, { align: 'center' })
  doc.text('Premium home-service car care — Arayat, Pampanga', W / 2, pageH - 4, { align: 'center' })

  return doc
}

export function downloadInvoice(booking) {
  const doc = generateInvoicePDF(booking)
  doc.save(`Thunder-Invoice-${booking.reference_no}.pdf`)
}

export function openInvoiceBlob(booking) {
  const doc = generateInvoicePDF(booking)
  const blob = doc.output('blob')
  window.open(URL.createObjectURL(blob), '_blank')
}
