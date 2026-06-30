import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ReportStats {
  income: number
  expenses: number
  balance: number
}

export const generateFinancialReport = async (
  transactions: any[],
  stats: ReportStats,
  periodLabel: string,
  filenamePrefix: string = "Financial_Statement"
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const isPositive = stats.balance >= 0

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0 })

  const drawSectionLabel = (text: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175) // gray-400
    doc.text(text.toUpperCase(), x, y)
  }

  const drawValue = (text: string, x: number, y: number, color: [number, number, number], size = 12) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.text(text, x, y)
  }

  // ─── 1. FULL DARK HEADER BAR ─────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, 52, 'F')

  // Brand name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text("DEVINBOOK", 14, 14)

  // Main title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text("Financial Statement", 14, 28)

  // Period pill (right side of header)
  const pillText = periodLabel.toUpperCase()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  const pillW = doc.getTextWidth(pillText) + 10
  doc.setFillColor(30, 41, 59) // slate-800
  doc.roundedRect(W - 14 - pillW, 18, pillW, 9, 2, 2, 'F')
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(pillText, W - 14 - pillW + 5, 24.5)

  // Date below title
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated on ${dateStr}`, 14, 38)

  // Horizontal accent line (thin gold/teal)
  doc.setDrawColor(99, 102, 241) // indigo-500 accent
  doc.setLineWidth(0.6)
  doc.line(0, 52, W, 52)

  // ─── 2. LOGO ──────────────────────────────────────────────────────────────────
  await new Promise<void>((resolve) => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = "https://devinsol.com/wp-content/uploads/2025/08/Devinsol-e1754743293456.png"
    img.onload = () => {
      doc.addImage(img, 'PNG', W - 52, 6, 38, 12)
      resolve()
    }
    img.onerror = () => resolve()
  })

  // ─── 3. SUMMARY CARDS ─────────────────────────────────────────────────────────
  const cardY = 60
  const cardH = 28
  const cardW = (W - 28 - 8) / 3 // 3 equal cards with 4mm gaps
  const cards = [
    {
      label: "Total Income",
      value: `+${fmt(stats.income)} Rs`,
      color: [22, 163, 74] as [number, number, number],   // green-600
      bgLight: [240, 253, 244] as [number, number, number], // green-50
    },
    {
      label: "Total Spent",
      value: `-${fmt(stats.expenses)} Rs`,
      color: [220, 38, 38] as [number, number, number],    // red-600
      bgLight: [254, 242, 242] as [number, number, number], // red-50
    },
    {
      label: "Net Balance",
      value: `${isPositive ? '+' : ''}${fmt(stats.balance)} Rs`,
      color: isPositive ? [37, 99, 235] as [number, number, number] : [220, 38, 38] as [number, number, number], // blue-600 or red
      bgLight: isPositive ? [239, 246, 255] as [number, number, number] : [254, 242, 242] as [number, number, number],
    },
  ]

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4)

    // Card background
    doc.setFillColor(...card.bgLight)
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F')

    // Left accent bar
    doc.setFillColor(...card.color)
    doc.roundedRect(x, cardY, 2.5, cardH, 1, 1, 'F')

    // Label
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128) // gray-500
    doc.text(card.label.toUpperCase(), x + 6, cardY + 8)

    // Value
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...card.color)
    doc.text(card.value, x + 6, cardY + 20)
  })

  // ─── 4. SECTION HEADING ───────────────────────────────────────────────────────
  const tableStartY = cardY + cardH + 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text("TRANSACTION HISTORY", 14, tableStartY - 2)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(14, tableStartY + 1, W - 14, tableStartY + 1)

  // ─── 5. TRANSACTIONS TABLE ────────────────────────────────────────────────────
  const tableData = transactions.map((t: any) => [
    new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
    t.description || (t.categoryId as any)?.name || "Untitled",
    { content: t.type === 'income' ? '+ INCOME' : '- SPENT', styles: { textColor: t.type === 'income' ? [22, 163, 74] : [220, 38, 38], fontStyle: 'bold' } },
    { content: `${fmt(t.amount)} Rs`, styles: { fontStyle: 'bold', halign: 'right', textColor: t.type === 'income' ? [22, 163, 74] : [220, 38, 38] } }
  ])

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [["DATE", "DESCRIPTION", "TYPE", "AMOUNT"]],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [100, 116, 139],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      textColor: [30, 41, 59],
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.4 }
    },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.fillColor = [248, 250, 252]
      }
    }
  })

  // ─── 6. FOOTER (all pages) ────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer bar
    doc.setFillColor(248, 250, 252)
    doc.rect(0, H - 14, W, 14, 'F')

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, H - 14, W, H - 14)

    // Left: brand
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(99, 102, 241)
    doc.text("DEVINBOOK", 14, H - 6)

    // Center: tagline
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text("Secure Financial Intelligence", W / 2, H - 6, { align: 'center' })

    // Right: page number
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text(`${i} / ${pageCount}`, W - 14, H - 6, { align: 'right' })
  }

  doc.save(`${filenamePrefix}_${monthYear.replace(/\s/g, '_')}.pdf`)
}
