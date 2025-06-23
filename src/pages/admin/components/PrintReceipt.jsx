import React from 'react';
import logoImg from '../../../assets/images/Logo.webp';

const PrintReceipt = ({ sale, onClose }) => {
  if (!sale) {
    return null;
  }

  const handleGeneratePDF = () => {
    const printContent = document.getElementById('print-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <html>
        <head>
          <title>Factura ${sale.code || 'Venta'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.3;
              color: #333;
              background: white;
            }
            
            .receipt-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm;
              background: white;
            }
            
            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 2px solid #2c5530;
              padding-bottom: 15px;
            }
            
            .company-info {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .logo {
              width: 120px;
              height: 120px;
              object-fit: contain;
              border-radius: 8px;
              border: 2px solid #2c5530;
              background: white;
              padding: 5px;
            }
            
            .company-details h1 {
              font-size: 18px;
              color: #2c5530;
              margin-bottom: 3px;
              font-weight: bold;
            }
            
            .company-details p {
              font-size: 10px;
              color: #666;
              margin: 1px 0;
            }
            
            .invoice-info {
              text-align: right;
              border: 2px solid #333;
              padding: 10px;
              min-width: 140px;
            }
            
            .invoice-info .date-box {
              display: flex;
              gap: 10px;
              margin-bottom: 8px;
              font-size: 10px;
            }
            
            .date-box span {
              border: 1px solid #ccc;
              padding: 2px 8px;
              min-width: 20px;
              text-align: center;
            }
            
            .invoice-number {
              font-size: 14px;
              font-weight: bold;
              color: #2c5530;
            }
            
            /* Document Title */
            .document-title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              color: #2c5530;
              margin: 20px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            /* Customer Data */
            .customer-section {
              display: flex;
              gap: 20px;
              margin-bottom: 25px;
            }
            
            .customer-column {
              flex: 1;
            }
            
            .customer-field {
              margin-bottom: 12px;
              display: flex;
              align-items: center;
            }
            
            .field-label {
              font-weight: bold;
              min-width: 70px;
              font-size: 11px;
            }
            
            .field-value {
              border-bottom: 1px solid #333;
              flex: 1;
              padding: 2px 5px;
              min-height: 18px;
              font-size: 11px;
            }
            
            /* Products Table */
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 2px solid #333;
            }
            
            .products-table th {
              background: #2c5530;
              color: white;
              padding: 8px 5px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              border: 1px solid #333;
            }
            
            .products-table td {
              padding: 6px 5px;
              border: 1px solid #333;
              text-align: center;
              font-size: 10px;
              min-height: 20px;
            }
            
            .products-table .product-desc {
              text-align: left;
              max-width: 200px;
            }
            
            .products-table .amount {
              text-align: right;
              font-weight: bold;
            }
            
            /* Totals */
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
            }
            
            .totals-box {
              background: #f8f9fa;
              border: 2px solid #2c5530;
              padding: 15px;
              min-width: 200px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            
            .total-row.final {
              border-top: 2px solid #2c5530;
              padding-top: 8px;
              margin-top: 8px;
              font-weight: bold;
              font-size: 14px;
              color: #2c5530;
            }
            
            /* Footer */
            .footer {
              background: linear-gradient(135deg, #2c5530, #4a7c59);
              color: white;
              padding: 15px;
              margin-top: 30px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 15px;
            }
            
            .footer-column {
              flex: 1;
              min-width: 120px;
            }
            
            .footer-column h4 {
              font-size: 11px;
              margin-bottom: 8px;
              color: #a8d5aa;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .footer-column p {
              font-size: 10px;
              margin: 3px 0;
              line-height: 1.4;
            }
            
            .footer-logo {
              position: absolute;
              right: 15px;
              bottom: 10px;
              opacity: 0.1;
              font-size: 40px;
              color: white;
            }
            
            /* Disclaimer */
            .disclaimer {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              margin: 15px 0;
              border-radius: 4px;
              font-size: 9px;
              text-align: center;
              color: #856404;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .receipt-container { 
                max-width: none;
                margin: 0;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return { day, month, year };
  };

  const { day, month, year } = formatDate(sale.date || sale.createdAt || new Date());
  const items = sale.items || [];

  // Calcular totales sin IVA (emprendimiento sin registro fiscal)
  const subtotal = sale.total || 0;
  const iva = 0; // Sin IVA para emprendimiento
  const total = subtotal + iva;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
      <div className="bg-white rounded p-4" style={{ maxWidth: '95vw', maxHeight: '95vh', overflow: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Vista Previa - Factura {sale.code || 'Venta'}</h5>
          <div>
            <button className="btn btn-success me-2" onClick={handleGeneratePDF}>
              📄 Guardar como PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        
        <div id="print-content">
          <div className="receipt-container">
            {/* Header */}
            <div className="header">
              <div className="company-info">
                <img src={logoImg} alt="Panza Verde Logo" className="logo" />
                <div className="company-details">
                  <h1>LIBRERÍA PANZA VERDE</h1>
                  <p>📍 Sucre 608 P.B(Planta Baja)</p>
                  <p>📞 Teléfono: 1176108135</p>
                  <p>📧 Email: libreriapanzaverde@gmail.com</p>
                </div>
              </div>
              <div className="invoice-info">
                <div className="date-box">
                  <span>FECHA</span>
                  <span>{day}</span>
                  <span>{month}</span>
                  <span>{year}</span>
                </div>
                <div className="invoice-number">
                  Factura<br/>N° {sale.code || 'SIN-CODIGO'}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="document-title">DOCUMENTO NO VÁLIDO COMO COMPROBANTE FISCAL DE PAGO</div>

            {/* Customer Data */}
            <div className="customer-section">
              <div className="customer-column">
                <div className="customer-field">
                  <span className="field-label">Cliente:</span>
                  <span className="field-value">{sale.customerName || 'Cliente General'}</span>
                </div>
                <div className="customer-field">
                  <span className="field-label">Dirección:</span>
                  <span className="field-value">{sale.customerAddress || 'No especificada'}</span>
                </div>
              </div>
              <div className="customer-column">
                <div className="customer-field">
                  <span className="field-label">Teléfono:</span>
                  <span className="field-value">{sale.userPhone || sale.customerPhone || 'No especificado'}</span>
                </div>
                <div className="customer-field">
                  <span className="field-label">Correo:</span>
                  <span className="field-value">{sale.userEmail || sale.customerEmail || 'No especificado'}</span>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <table className="products-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>CANTIDAD</th>
                  <th style={{ width: '50%' }}>PRODUCTO</th>
                  <th style={{ width: '20%' }}>PRECIO UNIT.</th>
                  <th style={{ width: '20%' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, index) => {
                  const productName = item.product?.name || item.name || 'Producto sin nombre';
                  const quantity = item.quantity || 1;
                  const price = item.price || item.product?.price || 0;
                  const subtotal = quantity * price;
                  
                  return (
                    <tr key={index}>
                      <td>{quantity}</td>
                      <td className="product-desc">{productName}</td>
                      <td className="amount">${price.toFixed(2)}</td>
                      <td className="amount">${subtotal.toFixed(2)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td>1</td>
                    <td className="product-desc">Venta sin detalles de productos</td>
                    <td className="amount">${(sale.total || 0).toFixed(2)}</td>
                    <td className="amount">${(sale.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                
                {/* Empty rows for spacing */}
                {[...Array(Math.max(0, 8 - items.length))].map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals-section">
              <div className="totals-box">
                <div className="total-row final">
                  <span>TOTAL:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="disclaimer">
              ⚠️ ESTE DOCUMENTO NO SIRVE COMO COMPROBANTE FISCAL DE PAGO<br/>
              Solo para uso interno y control de inventario - Emprendimiento sin registro fiscal
            </div>

            {/* Footer */}
            <div className="footer" style={{ position: 'relative' }}>
              <div className="footer-column">
                <h4>Contacto</h4>
                <p>📧 Libreriapanzaverde@gmail.com</p>
                <p>📞 11-7610-8135</p>
              </div>
              <div className="footer-column">
                <h4>Ubicación</h4>
                <p>📍 Sucre 608 planta baja</p>
                <p>El Zorzal, General Pacheco</p>
              </div>
              <div className="footer-column">
                <h4>Horarios</h4>
                <p>🕐 Lu-vi de 8.30 a 13 y de 17 a 18</p>
              </div>
              <div className="footer-logo">📚</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt; 