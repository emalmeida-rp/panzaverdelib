import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, TextRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export const generateInvoiceDocx = async (sale) => {
  const isOnline = sale.type === 'online';
  const items = sale.items || [];

  // Crear el documento
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header con logo (simulado con texto)
        new Paragraph({
          children: [
            new TextRun({
              text: "PANZA VERDE LIBRERÍA",
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),

        // Información de contacto
        new Paragraph({
          children: [
            new TextRun("📍 Dirección de la librería | 📞 Teléfono: (XXX) XXX-XXXX | 📧 Email: info@panzaverde.com")
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Título de la factura
        new Paragraph({
          children: [
            new TextRun({
              text: "FACTURA DE COMPRA",
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Disclaimer
        new Paragraph({
          children: [
            new TextRun({
              text: "⚠️ ESTE DOCUMENTO NO SIRVE COMO COMPROBANTE FISCAL DE PAGO ⚠️",
              bold: true,
              color: "FF0000",
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Solo para uso interno y control de inventario",
              italics: true,
              color: "FF0000",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Tabla de información de la factura
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "DATOS DE LA FACTURA",
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun(`Número de Factura: ${sale.code || 'N/A'}`)
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun(`Fecha y Hora: ${dayjs(sale.date).format('DD/MM/YYYY HH:mm')}`)
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun(`Tipo de Venta: ${isOnline ? 'Venta Online' : 'Venta Presencial'}`)
                      ],
                    }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "DATOS DEL CLIENTE",
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun(`Nombre/Razón Social: ${sale.customerName || 'Cliente General'}`)
                      ],
                    }),
                    ...(sale.userEmail ? [new Paragraph({
                      children: [new TextRun(`Email: ${sale.userEmail}`)],
                    })] : []),
                    ...(sale.userPhone ? [new Paragraph({
                      children: [new TextRun(`Teléfono: ${sale.userPhone}`)],
                    })] : []),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),

        // Espacio
        new Paragraph({ text: "", spacing: { after: 400 } }),

        // Título de productos
        new Paragraph({
          children: [
            new TextRun({
              text: "DETALLE DE PRODUCTOS Y SERVICIOS",
              bold: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Tabla de productos
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            // Header
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "DESCRIPCIÓN", bold: true })],
                    alignment: AlignmentType.CENTER,
                  })],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "CANT.", bold: true })],
                    alignment: AlignmentType.CENTER,
                  })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "PRECIO UNIT.", bold: true })],
                    alignment: AlignmentType.CENTER,
                  })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "TOTAL", bold: true })],
                    alignment: AlignmentType.CENTER,
                  })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            // Productos
            ...items.map(item => {
              const productName = item.product?.name || 'Producto sin nombre';
              const quantity = item.quantity || 1;
              const price = item.price || item.product?.price || 0;
              const subtotal = quantity * price;

              return new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(productName)],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun(quantity.toString())],
                      alignment: AlignmentType.CENTER,
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun(`$${price.toFixed(2)}`)],
                      alignment: AlignmentType.CENTER,
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: `$${subtotal.toFixed(2)}`,
                        bold: true,
                      })],
                      alignment: AlignmentType.CENTER,
                    })],
                  }),
                ],
              });
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),

        // Espacio
        new Paragraph({ text: "", spacing: { after: 400 } }),

        // Tabla de totales
        new Table({
          width: {
            size: 50,
            type: WidthType.PERCENTAGE,
          },
          alignment: AlignmentType.RIGHT,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("Subtotal:")],
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun(`$${(sale.total || 0).toFixed(2)}`)],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("Impuestos (0%):")],
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun("$0.00")],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "TOTAL GENERAL:",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: `$${(sale.total || 0).toFixed(2)}`,
                      bold: true,
                      size: 20,
                    })],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),

        // Espacio
        new Paragraph({ text: "", spacing: { after: 400 } }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "¡Gracias por su compra!",
              bold: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun("🌐 www.panzaverde.com | 📱 Síguenos en redes sociales")
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Documento generado el ${dayjs().format('DD/MM/YYYY HH:mm')}`,
              italics: true,
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  // Generar y descargar el archivo
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  
  const fileName = `Factura_${sale.code || 'Venta'}_${dayjs(sale.date).format('YYYY-MM-DD')}.docx`;
  saveAs(blob, fileName);
  
  return blob;
}; 