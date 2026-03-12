import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Packer,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  TextDirection,
  VerticalAlign,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType
} from 'docx'

export async function generateComisionDocx({
  trabajadorNombre,
  fechaDocumento,
  fechasComision,
  dirigidoA,
  cargoDirigidoA,
  copias,
  archivo,
  sexo
}: {
  trabajadorNombre: string
  fechaDocumento: string
  fechasComision: string
  dirigidoA: string
  cargoDirigidoA: string
  copias: string[]
  archivo: boolean
  sexo?: string
}): Promise<Blob> {

  const isFemenino = sexo?.toLowerCase() === 'femenino'
  const prepCompanero = isFemenino ? " la compañera " : " el compañero "

  // Formato C.c.p.
  const copiasText = []
  if (copias && copias.length > 0) {
      copias.forEach(c => {
          copiasText.push(new Paragraph({
              children: [
                  new TextRun({ text: "C.c.p.      ", size: 16, bold: true }),
                  new TextRun({ text: c, size: 16 })
              ],
              spacing: { after: 0, line: 240 }
          }))
      })
  }

  if (archivo) {
      copiasText.push(new Paragraph({
          children: [
              new TextRun({ text: "C.c.p.      ", size: 16, bold: true, color: "FFFFFF" }), // Invisible "C.c.p." just for alignment if needed, or omit
              new TextRun({ text: "Archivo.", size: 16 })
          ],
          spacing: { after: 0, line: 240 }
      }))
  }

  const doc = new Document({
      creator: "SUTEMA",
      title: "Oficio Comisión Sindical",
      description: "Oficio de Licencia Sindical",
      sections: [
          {
              properties: {
                  page: {
                    size: {
                        width: '215.9mm',
                        height: '279.4mm',
                    },
                      margin: {
                          top: '2cm',
                          right: '2.5cm',
                          bottom: '2cm',
                          left: '2.5cm'
                      }
                  }
              },
              children: [
                  // Fecha
                  new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [
                          new TextRun({
                              text: `Aguascalientes, Ags. a ${fechaDocumento}`,
                              size: 22, // 11pt * 2
                              font: "Calibri"
                          })
                      ],
                      spacing: {
                          after: 600
                      }
                  }),
                  // Destinatario
                  new Paragraph({
                      children: [
                          new TextRun({
                              text: dirigidoA,
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ],
                      spacing: { after: 0 }
                  }),
                  new Paragraph({
                      children: [
                          new TextRun({
                              text: cargoDirigidoA,
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ],
                      spacing: { after: 0 }
                  }),
                  new Paragraph({
                      children: [
                          new TextRun({
                              text: "P R E S E N T E",
                              bold: true,
                              size: 22,
                              font: "Calibri",
                              break: 1
                          })
                      ],
                      spacing: { after: 600 }
                  }),
                  // Cuerpo del mensaje
                  new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: {
                          line: 360, // 1.5 line spacing
                      },
                      children: [
                          new TextRun({
                              text: "Por medio del presente. Me permito solicitar de manera atenta y respetuosa, una ",
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: "LICENCIA SINDICAL",
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: ` para${prepCompanero}`,
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: trabajadorNombre,
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: " con fundamento en lo dispuesto por la normatividad laboral vigente y el Contrato Colectivo de Trabajo del Sindicato Único de Trabajadores Estatales y Municipales del Estado de Aguascalientes (SUTEMA).",
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: {
                          line: 360, // 1.5 line spacing
                          before: 200
                      },
                      children: [
                          new TextRun({
                              text: "\tLa presente licencia se solicita del día ",
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: fechasComision,
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          }),
                          new TextRun({
                              text: ", con la finalidad de participar en tareas inherentes a la representación, organización y gestión sindical.",
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: {
                          line: 360, // 1.5 line spacing
                          before: 200
                      },
                      children: [
                          new TextRun({
                              text: "\tAgradezco de antemano su atención y apoyo, reiterando mi compromiso con el cumplimiento de mis responsabilidades laborales y sindicales.",
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  // Despedida
                  new Paragraph({
                      alignment: AlignmentType.LEFT,
                      spacing: {
                          before: 400,
                          after: 800
                      },
                      children: [
                          new TextRun({
                              text: "Sin otro particular de momento, quedo atenta a su respuesta.",
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  // Atentamente
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: {
                          before: 400,
                          after: 0
                      },
                      children: [
                          new TextRun({
                              text: "A T E N T A M E N T E",
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: {
                          after: 1200
                      },
                      children: [
                          new TextRun({
                              text: "\"UNIDOS PROGRESAREMOS\"",
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  // Firma
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: {
                          after: 0
                      },
                      children: [
                          new TextRun({
                              text: "MTRA. MARISOL PAREJA SENA",
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: {
                          after: 800
                      },
                      children: [
                          new TextRun({
                              text: "SECRETARIA GENERAL DEL SUTEMA",
                              bold: true,
                              size: 22,
                              font: "Calibri"
                          })
                      ]
                  }),
                  // Copias
                  ...copiasText
              ]
          }
      ]
  })

  // Pack the document into a blob
  return await Packer.toBlob(doc)
}
