import { jsPDF } from 'jspdf'
import { qrPattern } from './barcode'

/**
 * Lays out a batch of barcode/seal-ID pairs as a printable sheet of QR-style
 * modules in a real PDF file — drawn as vector rects (not a canvas
 * screenshot), so it stays crisp at any zoom/print size.
 */
export function exportBarcodesToPdf(batch: { id: string; barcode: string }[], filename: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const cols = 4
  const rows = 6
  const perPage = cols * rows
  const cellW = (pageWidth - margin * 2) / cols
  const cellH = (pageHeight - margin * 2) / rows
  const qrSize = Math.min(cellW, cellH) - 14

  batch.forEach((item, i) => {
    const indexOnPage = i % perPage
    if (i > 0 && indexOnPage === 0) doc.addPage()

    const col = indexOnPage % cols
    const row = Math.floor(indexOnPage / cols)
    const cellX = margin + col * cellW
    const cellY = margin + row * cellH
    const qrX = cellX + (cellW - qrSize) / 2
    const qrY = cellY + 2

    const grid = qrPattern(item.barcode)
    const moduleSize = qrSize / grid.length

    doc.setFillColor(255, 255, 255)
    doc.rect(qrX, qrY, qrSize, qrSize, 'F')
    doc.setFillColor(15, 27, 46)
    grid.forEach((cells, r) => {
      cells.forEach((on, c) => {
        if (on) doc.rect(qrX + c * moduleSize, qrY + r * moduleSize, moduleSize, moduleSize, 'F')
      })
    })

    doc.setFontSize(8)
    doc.setTextColor(20, 30, 50)
    doc.text(item.id, cellX + cellW / 2, qrY + qrSize + 5, { align: 'center' })
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text(item.barcode, cellX + cellW / 2, qrY + qrSize + 8.5, { align: 'center' })
  })

  doc.save(filename)
}
