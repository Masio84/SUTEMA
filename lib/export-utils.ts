import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabajadores')
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

const PRIVACY_NOTICE = "Aviso de Privacidad: Los datos personales contenidos en este documento están protegidos y su tratamiento es responsabilidad del Sindicato Único de Trabajadores Estatales y Municipales de Aguascalientes (SUTEMA). Esta información es para uso exclusivo de los fines sindicales autorizados."

export const exportToPDF = async (data: any[], columns: { id: string, label: string }[], fileName: string, title: string = 'Reporte SUTEMA') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // item[col.id] ensures we get the data using the ID, even if the label is different
  const tableRows = data.map(item => columns.map(col => item[col.id] || ''))

  autoTable(doc, {
    head: [columns.map(c => c.label)],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      overflow: 'linebreak',
      halign: 'center'
    },
    columnStyles: {
      // Specifically narrow columns that usually take too much space
      curp: { cellWidth: 25 },
      clave_elector: { cellWidth: 25 },
      curp_label: { cellWidth: 25 }, // fallback if ID mapping varies
      'CLAVE ELECTOR': { cellWidth: 25 },
      'CURP': { cellWidth: 25 },
    },
    // Dynamically apply narrow widths to CURP and Clave Elector based on index
    didParseCell: (data) => {
      const colId = columns[data.column.index].id;
      if (colId === 'curp' || colId === 'clave_elector') {
        data.cell.styles.cellWidth = 22;
        data.cell.styles.fontSize = 5.5; // Slightly smaller for long IDs
      }
    },
    headStyles: {
      fillColor: [176, 196, 222],
      textColor: 40,
      fontStyle: 'bold',
      fontSize: 6,
      halign: 'center',
      valign: 'middle'
    },
    margin: { top: 25, bottom: 25 },
    didDrawPage: (data: any) => {
      // Header
      const logoUrl = '/logo-color.png'
      try {
        // width: 30mm, height: 0 (auto-calculate based on aspect ratio)
        doc.addImage(logoUrl, 'PNG', 15, 8, 30, 0)
      } catch (e) {
        console.error("Could not load logo", e)
      }

      const pageWidth = doc.internal.pageSize.width
      doc.setFontSize(14)
      doc.setTextColor(40)
      // Centered title at the same height as the logo center roughly
      doc.text(title, pageWidth / 2, 16, { align: 'center' })

      const today = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
      doc.setFontSize(10)
      doc.text(`Fecha: ${today}`, pageWidth - 15, 16, { align: 'right' })

      // Footer
      const str = "Página " + (doc as any).internal.getNumberOfPages()
      doc.setFontSize(10)
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.height
      doc.text(str, pageSize.width - 15, pageHeight - 10, { align: 'right' })

      // Privacy Notice
      doc.setFontSize(7)
      doc.setTextColor(100)
      const splitNotice = doc.splitTextToSize(PRIVACY_NOTICE, pageSize.width - 60)
      doc.text(splitNotice, 15, pageHeight - 15)
    }
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
