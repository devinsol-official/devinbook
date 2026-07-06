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

export const generateDailyDeliveriesReport = async (
  account: any,
  dailyLogs: any[],
  transactions: any[],
  currentMonthStr: string,
  daysInMonth: Date[]
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const [year, month] = currentMonthStr.split("-").map(Number)
  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0 })

  // ─── 1. DARK HEADER BAR ─────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, 52, 'F')

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text("DEVINBOOK DELIVERIES", 14, 14)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(account.name, 14, 28)

  const pillText = monthLabel.toUpperCase()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  const pillW = doc.getTextWidth(pillText) + 10
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(W - 14 - pillW, 18, pillW, 9, 2, 2, 'F')
  doc.setTextColor(148, 163, 184)
  doc.text(pillText, W - 14 - pillW + 5, 24.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Monthly delivery ledger generated on ${dateStr}`, 14, 38)

  doc.setDrawColor(99, 102, 241)
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
  const cardW = (W - 28 - 8) / 3
  
  const totalSpent = dailyLogs.reduce((sum, l) => sum + (l.totalAmount || 0), 0)
  const totalPaid = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = account.balance || 0

  const cards = [
    {
      label: "Total Purchases",
      value: `${fmt(totalSpent)} Rs`,
      color: [99, 102, 241] as [number, number, number],
      bgLight: [245, 243, 255] as [number, number, number],
    },
    {
      label: "Total Payments",
      value: `${fmt(totalPaid)} Rs`,
      color: [22, 163, 74] as [number, number, number],
      bgLight: [240, 253, 244] as [number, number, number],
    },
    {
      label: "Outstanding Dues",
      value: `${fmt(Math.abs(balance))} Rs`,
      color: balance < 0 ? [220, 38, 38] as [number, number, number] : [22, 163, 74] as [number, number, number],
      bgLight: balance < 0 ? [254, 242, 242] as [number, number, number] : [240, 253, 244] as [number, number, number],
    },
  ]

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4)
    doc.setFillColor(...card.bgLight)
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F')
    doc.setFillColor(...card.color)
    doc.roundedRect(x, cardY, 2.5, cardH, 1, 1, 'F')
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(card.label.toUpperCase(), x + 6, cardY + 8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...card.color)
    doc.text(card.value, x + 6, cardY + 20)
  })

  // ─── 4. DAILY LEDGER TABLE ──────────────────────────────────────────────────
  const tableStartY = cardY + cardH + 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text("DAILY DELIVERY LOG", 14, tableStartY - 2)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(14, tableStartY + 1, W - 14, tableStartY + 1)

  const todayStr = new Date().toISOString().split("T")[0]

  const tableData = daysInMonth.map(day => {
    const dStr = day.toISOString().split("T")[0]
    const isFuture = dStr > todayStr
    const log = dailyLogs.find(l => l.date && l.date.split("T")[0] === dStr)
    const dateFormatted = day.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })

    const paymentsOnDay = transactions.filter(t => t.type === "income" && t.date && t.date.split("T")[0] === dStr)
    const paymentAmount = paymentsOnDay.reduce((sum, p) => sum + p.amount, 0)

    let statusText = "MISSING"
    let statusColor = [220, 38, 38]
    if (isFuture) {
      statusText = "SCHEDULED"
      statusColor = [107, 114, 128]
    } else if (log) {
      statusText = "RECEIVED"
      statusColor = [22, 163, 74]
    }

    const itemsText = isFuture 
      ? "-" 
      : log 
        ? log.items.map((i: any) => `${i.name} (${i.quantity}${i.unit})`).join(", ") 
        : "No deliveries logged"

    const costText = isFuture ? "-" : `${log ? log.totalAmount : 0} Rs`
    const paymentText = paymentAmount > 0 ? `+${paymentAmount} Rs Paid` : "-"

    return [
      dateFormatted,
      { content: statusText, styles: { textColor: statusColor, fontStyle: 'bold' } },
      itemsText,
      { content: costText, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: paymentText, styles: { fontStyle: 'bold', halign: 'right', textColor: paymentAmount > 0 ? [22, 163, 74] : [107, 114, 128] } }
    ]
  })

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [["DATE", "STATUS", "DELIVERY ITEMS", "COST", "PAYMENTS"]],
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
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: [30, 41, 59],
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.4 }
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 26 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  })

  // ─── 5. FOOTER (all pages) ────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, H - 14, W, 14, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, H - 14, W, H - 14)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(99, 102, 241)
    doc.text("DEVINBOOK", 14, H - 6)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text("Secure Financial Intelligence", W / 2, H - 6, { align: 'center' })
    doc.text(`${i} / ${pageCount}`, W - 14, H - 6, { align: 'right' })
  }

  doc.save(`${account.name}_Delivery_Report_${monthLabel.replace(/\s/g, '_')}.pdf`)
}
