import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabajadores')
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export const exportToPDF = (data: any[], columns: string[], fileName: string) => {
    const doc = new jsPDF()
    const tableRows = data.map(item => columns.map(col => item[col] || ''))

    // @ts-ignore
    doc.autoTable({
        head: [columns],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillStyle: 'darkblue' }
    })

    doc.save(`${fileName}.pdf`)
}

export const printTable = (id: string) => {
    const content = document.getElementById(id)
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
    <html>
      <head>
        <title>Impresión de Tabla</title>
        <style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `)
    printWindow.document.close()
}
