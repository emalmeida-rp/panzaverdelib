import React, { useState, useMemo } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import styles from './AdminDashboard.module.scss';
import Swal from 'sweetalert2';
import { FaFileCsv, FaEye, FaTrash, FaPlus, FaSync } from 'react-icons/fa';
import SalesModal from './components/SalesModal';

const SalesDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { showAlert } = useAlert();
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const { data: salesData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['salesDashboardData'],
    queryFn: async () => {
      const [onlineRes, presentialRes] = await Promise.all([
        fetchWithAuth('/orders/history'),
        fetchWithAuth('/sales'),
      ]);

      if (!onlineRes.ok || !presentialRes.ok) {
        throw new Error('Error al cargar los datos de ventas');
      }

      const orders = await onlineRes.json();
      const sales = await presentialRes.json();

      const combined = [
        ...orders.map(o => ({ ...o, _id: o._id, type: 'online', date: o.createdAt, customerName: o.userName, total: o.total })),
        ...sales.map(s => ({ ...s, _id: s._id, type: 'presential' })),
      ];

      return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
  });

  const kpis = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { 
        totalToday: 0, 
        totalMonth: 0, 
        averageTicket: 0, 
        ticketCount: 0,
        onlineTotal: 0,
        presentialTotal: 0,
        topProducts: []
      };
    }
    const now = dayjs();
    const todaySales = salesData.filter(s => dayjs(s.date).isSame(now, 'day'));
    const monthSales = salesData.filter(s => dayjs(s.date).isSame(now, 'month'));
    
    const totalToday = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalMonth = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalRevenue = salesData.reduce((sum, s) => sum + (s.total || 0), 0);
    const averageTicket = salesData.length ? totalRevenue / salesData.length : 0;

    const onlineSales = salesData.filter(sale => sale.type === 'online');
    const presentialSales = salesData.filter(sale => sale.type === 'presential');

    const onlineTotal = onlineSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const presentialTotal = presentialSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    const productSales = {};
    salesData.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (item.product) {
            const productId = item.product._id;
            if (!productSales[productId]) {
              productSales[productId] = {
                name: item.product.name,
                quantity: 0,
                total: 0
              };
            }
            productSales[productId].quantity += item.quantity || 0;
            productSales[productId].total += (item.quantity || 0) * (item.price || item.product.price || 0);
          }
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { 
      totalToday, 
      totalMonth, 
      averageTicket, 
      ticketCount: salesData.length,
      onlineTotal,
      presentialTotal,
      topProducts
    };
  }, [salesData]);

  // Función para generar PDF directamente
  const handleGeneratePDF = (sale) => {
    if (!sale) {
      showAlert('Error: No se seleccionó ninguna venta', 'error');
      return;
    }

    // Crear el contenido HTML para PDF
    const createPDFContent = () => {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return { day, month, year };
      };

      const { day, month, year } = formatDate(sale.date || sale.createdAt || new Date());
      const items = sale.items || [];
      const total = sale.total || 0;

      return `
        <html>
          <head>
            <title>Factura ${sale.code || 'Venta'}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.3; color: #333; background: white; }
              .receipt-container { max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #2c5530; padding-bottom: 15px; }
              .company-info { display: flex; align-items: center; gap: 15px; }
              .logo { width: 120px; height: 120px; object-fit: contain; border-radius: 8px; border: 2px solid #2c5530; background: white; padding: 5px; }
              .company-details h1 { font-size: 18px; color: #2c5530; margin-bottom: 3px; font-weight: bold; }
              .company-details p { font-size: 10px; color: #666; margin: 1px 0; }
              .invoice-info { text-align: right; border: 2px solid #333; padding: 10px; min-width: 140px; }
              .invoice-info .date-box { display: flex; gap: 10px; margin-bottom: 8px; font-size: 10px; }
              .date-box span { border: 1px solid #ccc; padding: 2px 8px; min-width: 20px; text-align: center; }
              .invoice-number { font-size: 14px; font-weight: bold; color: #2c5530; }
                             .document-title { text-align: center; font-size: 16px; font-weight: bold; color: #2c5530; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
              .customer-section { display: flex; gap: 20px; margin-bottom: 25px; }
              .customer-column { flex: 1; }
              .customer-field { margin-bottom: 12px; display: flex; align-items: center; }
              .field-label { font-weight: bold; min-width: 70px; font-size: 11px; }
              .field-value { border-bottom: 1px solid #333; flex: 1; padding: 2px 5px; min-height: 18px; font-size: 11px; }
              .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #333; }
              .products-table th { background: #2c5530; color: white; padding: 8px 5px; text-align: center; font-size: 11px; font-weight: bold; border: 1px solid #333; }
              .products-table td { padding: 6px 5px; border: 1px solid #333; text-align: center; font-size: 10px; min-height: 20px; }
              .products-table .product-desc { text-align: left; max-width: 200px; }
              .products-table .amount { text-align: right; font-weight: bold; }
              .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
              .totals-box { background: #f8f9fa; border: 2px solid #2c5530; padding: 15px; min-width: 200px; }
              .total-row.final { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; color: #2c5530; }
              .footer { background: linear-gradient(135deg, #2c5530, #4a7c59); color: white; padding: 15px; margin-top: 30px; border-radius: 8px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; position: relative; }
              .footer-column { flex: 1; min-width: 120px; }
              .footer-column h4 { font-size: 11px; margin-bottom: 8px; color: #a8d5aa; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer-column p { font-size: 10px; margin: 3px 0; line-height: 1.4; }
              .footer-logo { position: absolute; right: 15px; bottom: 10px; opacity: 0.1; font-size: 40px; color: white; }
              .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; border-radius: 4px; font-size: 9px; text-align: center; color: #856404; }
              @media print { body { -webkit-print-color-adjust: exact; } .receipt-container { max-width: none; margin: 0; padding: 10mm; } }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header">
                <div class="company-info">
                   <img src="${window.location.origin}/img/Logo.webp" alt="Panza Verde Logo" class="logo" />
                                     <div class="company-details">
                     <h1>LIBRERÍA PANZA VERDE</h1>
                     <p>📍 Sucre 608 P.B(Planta Baja)</p>
                     <p>📞 Teléfono: 1176108135</p>
                     <p>📧 Email: libreriapanzaverde@gmail.com</p>
                   </div>
                </div>
                <div class="invoice-info">
                  <div class="date-box">
                    <span>FECHA</span>
                    <span>${day}</span>
                    <span>${month}</span>
                    <span>${year}</span>
                  </div>
                  <div class="invoice-number">
                    Factura<br/>N° ${sale.code || 'SIN-CODIGO'}
                  </div>
                </div>
              </div>

                             <div class="document-title">DOCUMENTO NO VÁLIDO COMO COMPROBANTE FISCAL DE PAGO</div>

              <div class="customer-section">
                <div class="customer-column">
                  <div class="customer-field">
                    <span class="field-label">Cliente:</span>
                    <span class="field-value">${sale.customerName || 'Cliente General'}</span>
                  </div>
                  <div class="customer-field">
                    <span class="field-label">Dirección:</span>
                    <span class="field-value">${sale.customerAddress || 'No especificada'}</span>
                  </div>
                </div>
                <div class="customer-column">
                  <div class="customer-field">
                    <span class="field-label">Teléfono:</span>
                    <span class="field-value">${sale.userPhone || sale.customerPhone || 'No especificado'}</span>
                  </div>
                  <div class="customer-field">
                    <span class="field-label">Correo:</span>
                    <span class="field-value">${sale.userEmail || sale.customerEmail || 'No especificado'}</span>
                  </div>
                </div>
              </div>

              <table class="products-table">
                <thead>
                  <tr>
                    <th style="width: 10%">CANTIDAD</th>
                    <th style="width: 50%">PRODUCTO</th>
                    <th style="width: 20%">PRECIO UNIT.</th>
                    <th style="width: 20%">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length > 0 ? items.map((item, index) => {
                    const productName = item.product?.name || item.name || 'Producto sin nombre';
                    const quantity = item.quantity || 1;
                    const price = item.price || item.product?.price || 0;
                    const subtotal = quantity * price;
                    
                    return `
                      <tr>
                        <td>${quantity}</td>
                        <td class="product-desc">${productName}</td>
                        <td class="amount">$${price.toFixed(2)}</td>
                        <td class="amount">$${subtotal.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td>1</td>
                      <td class="product-desc">Venta sin detalles de productos</td>
                      <td class="amount">$${total.toFixed(2)}</td>
                      <td class="amount">$${total.toFixed(2)}</td>
                    </tr>
                  `}
                  ${Array(Math.max(0, 8 - items.length)).fill().map(() => `
                    <tr>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals-section">
                <div class="totals-box">
                  <div class="total-row final">
                    <span>TOTAL:</span>
                    <span>$${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div class="disclaimer">
                ⚠️ ESTE DOCUMENTO NO SIRVE COMO COMPROBANTE FISCAL DE PAGO<br/>
                Solo para uso interno y control de inventario - Emprendimiento sin registro fiscal
              </div>

                               <div class="footer">
                   <div class="footer-column">
                     <h4>Contacto</h4>
                     <p>📧 Libreriapanzaverde@gmail.com</p>
                     <p>📞 11-7610-8135</p>
                   </div>
                   <div class="footer-column">
                     <h4>Ubicación</h4>
                     <p>📍 Sucre 608 planta baja</p>
                     <p>El Zorzal, General Pacheco</p>
                   </div>
                   <div class="footer-column">
                     <h4>Horarios</h4>
                     <p>🕐 Lu-vi de 8.30 a 13 y de 17 a 18</p>
                   </div>
                   <div class="footer-logo">📚</div>
                 </div>
            </div>
          </body>
        </html>
      `;
    };

    // Abrir ventana de impresión directamente
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert('Error: No se pudo abrir ventana de impresión. Verifica el bloqueador de pop-ups.', 'error');
      return;
    }

    printWindow.document.write(createPDFContent());
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      showAlert('💾 Usa "Guardar como PDF" en la ventana de impresión para generar el archivo', 'info');
    };
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleDeleteSale = async (sale) => {
    const safeSwalConfig = {
      title: '¿Estás seguro?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'No, cancelar',
      confirmButtonText: 'Sí, eliminar',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom'
      },
      didOpen: () => {
        const container = document.querySelector('.swal2-container');
        if (container) {
          container.style.zIndex = '10000';
        }
      }
    };

    const result = await Swal.fire(safeSwalConfig);

    if (result.isConfirmed) {
      const endpoint = sale.type === 'online' ? `/orders/history/${sale._id}` : `/sales/${sale._id}`;
      try {
        await fetchWithAuth(endpoint, { method: 'DELETE' });
        refetch();
        Swal.fire('Eliminado', 'La venta ha sido eliminada.', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la venta.', 'error');
      }
    }
  };

  const handleOpenModal = () => {
    setSelectedSale(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const filteredSales = useMemo(() => {
    if (!salesData) return [];
    return salesData.filter(sale => {
      const search = searchTerm.toLowerCase();
      return (
        (sale.code?.toLowerCase() || '').includes(search) ||
        (sale.customerName?.toLowerCase() || '').includes(search)
      );
    });
  }, [salesData, searchTerm]);
  
  const paginatedSales = useMemo(() => {
    return filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['Código', 'Tipo', 'Cliente', 'Total', 'Fecha'];
    const data = filteredSales.map(s => [
      s.code || 'N/A',
      s.type,
      s.customerName,
      s.total || 0,
      dayjs(s.date).format('YYYY-MM-DD HH:mm')
    ]);
    const csv = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reporte-ventas.csv';
    link.click();
  };

  if (isLoading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error.message}</div>;

  return (
    <div className="container mt-4">
      <div className={styles.pageHeader}>
        <h1>Dashboard de Ventas</h1>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => refetch()} title="Refrescar datos">
            <FaSync />
          </button>
          <button className="btn btn-info me-2" onClick={handleExportCSV} title="Exportar a CSV">
            <FaFileCsv/>
          </button>

          <button className={styles.btn + ' ' + styles.btnPrimary} onClick={handleOpenModal}>
            <FaPlus /> Nueva Venta
          </button>
        </div>
      </div>

      {/* Información sobre generación de PDF */}
      <div className="alert alert-info mb-3">
        <strong>📄 GENERAR FACTURAS:</strong> 
        Haz clic en "📄 Generar PDF" para crear facturas profesionales.
        <strong> 💾 Tip:</strong> Usa "Guardar como PDF" en la ventana de impresión para crear archivos digitales.
      </div>

      {/* KPIs Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ventas Hoy</h5>
              <h3 className="card-text">${kpis.totalToday.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ventas del Mes</h5>
              <h3 className="card-text">${kpis.totalMonth.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ventas Online</h5>
              <h3 className="card-text">${kpis.onlineTotal.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ventas Presenciales</h5>
              <h3 className="card-text">${kpis.presentialTotal.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Productos Más Vendidos</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Total Vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
                        <td>${product.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard + ' mt-4'}>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <input type="text" className="form-control" style={{maxWidth: 400}} placeholder="Buscar por código o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        {/* Tabla y Lista de Tarjetas para ventas */}
        <div className={styles.responsiveTableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map(sale => (
                <tr key={sale._id}>
                  <td>{sale.code || 'N/A'}</td>
                  <td><span className={`badge ${sale.type === 'online' ? 'bg-primary' : 'bg-success'}`}>{sale.type}</span></td>
                  <td>{sale.customerName || 'N/A'}</td>
                  <td>${(sale.total || 0).toFixed(2)}</td>
                  <td>{dayjs(sale.date).format('DD/MM/YYYY HH:mm')}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewSale(sale)}
                        title="Ver detalles"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleGeneratePDF(sale)}
                        title="Generar factura PDF"
                      >
                        📄 Generar PDF
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteSale(sale)}
                        title="Eliminar venta"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.cardList}>
          {paginatedSales.map(sale => (
            <div className={styles.cardItem} key={sale._id}>
                <div className={styles.cardItemHeader}>
                  <strong>{sale.code || 'Venta Presencial'}</strong>
                  <span className={`badge ${sale.type === 'online' ? 'bg-primary' : 'bg-success'}`}>{sale.type}</span>
                </div>
                <div className={styles.cardItemContent}>
                  <p><strong>Cliente:</strong> {sale.customerName || 'N/A'}</p>
                  <p><strong>Fecha:</strong> {dayjs(sale.date).format('DD/MM/YYYY HH:mm')}</p>
                  <p><strong>Total:</strong> <span className={styles.totalAmount}>${(sale.total || 0).toFixed(2)}</span></p>
                </div>
                <div className={styles.actionButtons}>
                    <button onClick={() => handleViewSale(sale)}><FaEye/> Ver</button>
                    <button onClick={() => handleGeneratePDF(sale)} className="success">📄 PDF</button>
                    <button className='danger' onClick={() => handleDeleteSale(sale)}><FaTrash/> Borrar</button>
                </div>
            </div>
          ))}
        </div>
        
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>Página {currentPage} de {totalPages}</span>
          <div className={styles.btnGroup}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Siguiente</button>
          </div>
        </div>
      </div>

      {showModal && (
        <SalesModal
          show={showModal}
          onHide={handleCloseModal}
          sale={selectedSale}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default SalesDashboard; 