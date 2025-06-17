import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import styles from './AdminDashboard.module.scss';
import Modal from 'react-bootstrap/Modal';
import Swal from 'sweetalert2';

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { showAlert } = useAlert();
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // React Query para obtener todas las ventas
  const { data: salesData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const [onlineOrders, presentialSales] = await Promise.all([
        fetchWithAuth('/orders/history'),
        fetchWithAuth('/sales')
      ]);

      if (!onlineOrders.ok || !presentialSales.ok) {
        throw new Error('Error al cargar las ventas');
      }

      const orders = await onlineOrders.json();
      const sales = await presentialSales.json();

      // Unificar y estandarizar los datos
      return [
        ...orders.map(order => ({
          ...order,
          type: 'online',
          date: order.createdAt,
          total: order.total,
          customerName: order.userName,
          customerEmail: order.userEmail,
          customerPhone: order.userPhone,
          paymentMethod: order.paymentMethod || 'online'
        })),
        ...sales.map(sale => ({
          ...sale,
          type: 'presential',
          date: sale.date,
          total: sale.total,
          customerName: sale.customerName,
          customerEmail: sale.customerEmail,
          customerPhone: sale.customerPhone,
          paymentMethod: sale.paymentMethod
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    refetchInterval: 60000 // refresca cada 1 minuto
  });

  // KPIs
  const kpis = React.useMemo(() => {
    const now = dayjs();
    const today = salesData.filter(sale => dayjs(sale.date).isSame(now, 'day'));
    const thisMonth = salesData.filter(sale => dayjs(sale.date).isSame(now, 'month'));
    const thisYear = salesData.filter(sale => dayjs(sale.date).isSame(now, 'year'));

    const totalToday = today.reduce((sum, sale) => sum + sale.total, 0);
    const totalMonth = thisMonth.reduce((sum, sale) => sum + sale.total, 0);
    const totalYear = thisYear.reduce((sum, sale) => sum + sale.total, 0);

    const onlineSales = salesData.filter(sale => sale.type === 'online');
    const presentialSales = salesData.filter(sale => sale.type === 'presential');

    const onlineTotal = onlineSales.reduce((sum, sale) => sum + sale.total, 0);
    const presentialTotal = presentialSales.reduce((sum, sale) => sum + sale.total, 0);

    // Productos más vendidos
    const productSales = {};
    salesData.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            total: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].total += item.quantity * item.price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalToday,
      totalMonth,
      totalYear,
      onlineTotal,
      presentialTotal,
      topProducts,
      totalSales: salesData.length,
      averageTicket: salesData.length ? (onlineTotal + presentialTotal) / salesData.length : 0
    };
  }, [salesData]);

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setIsViewing(true);
    setShowModal(true);
    setSaleItems(sale.items.map(item => ({
      product: item.product,
      quantity: item.quantity
    })));
    setCustomer({
      name: sale.customerName || '',
      email: sale.customerEmail || '',
      phone: sale.customerPhone || ''
    });
  };

  const handleDeleteSale = async (sale) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el registro de venta de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const endpoint = sale.type === 'online' ? `/orders/history/${sale._id}` : `/sales/${sale._id}`;
      const response = await fetchWithAuth(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la venta');
      }

      refetch();
      showAlert('Venta eliminada correctamente', 'success');
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al eliminar la venta', 'error');
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setModalLoading(true);
    setModalError(null);
    setSaleItems([]);
    setCustomer({ name: '', email: '', phone: '' });
    setSearchProduct('');
    setSelectedProduct(null);
    try {
      const res = await fetchWithAuth('/products');
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      setModalProducts(data);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSaleItems([]);
    setCustomer({ name: '', email: '', phone: '' });
    setSearchProduct('');
    setSelectedProduct(null);
    setSelectedSale(null);
    setIsViewing(false);
  };

  const handleAddProductToSale = (product) => {
    if (!product) return;
    const already = saleItems.find(item => item.product._id === product._id);
    if (already) return;
    setSaleItems([...saleItems, { product, quantity: 1 }]);
  };

  const handleChangeQuantity = (productId, qty) => {
    setSaleItems(items => items.map(item =>
      item.product._id === productId
        ? { ...item, quantity: Math.max(1, Math.min(qty, item.product.stock)) }
        : item
    ));
  };

  const handleRemoveProductFromSale = (productId) => {
    setSaleItems(items => items.filter(item => item.product._id !== productId));
  };

  const handleSaveSale = async () => {
    if (saleItems.length === 0) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const items = saleItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      }));
      const body = {
        items,
        customerName: customer.name || 'Venta presencial',
        customerEmail: customer.email || 'presencial@panzaverde.com',
        customerPhone: customer.phone,
        paymentMethod: 'efectivo'
      };

      const res = await fetchWithAuth('/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la venta');
      }
      showAlert('Venta registrada correctamente', 'success');
      refetch();
      handleCloseModal();
    } catch (err) {
      setModalError(err.message);
      showAlert('Error al registrar la venta', 'error');
      console.error('Error al registrar la venta:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredModalProducts = modalProducts.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const totalSale = saleItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);

  const filteredSales = salesData.filter(sale => 
    sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error.message}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard de Ventas</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => refetch()}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refrescar
          </button>
          <button className="btn btn-success" onClick={handleOpenModal}>
            <i className="bi bi-plus-circle me-1"></i>
            Nueva Venta
          </button>
          <button 
            className="btn btn-success"
            onClick={() => {
              const headers = ['Código', 'Tipo', 'Cliente', 'Email', 'Teléfono', 'Total', 'Método de Pago', 'Fecha'];
              const csvData = salesData.map(sale => [
                sale.code,
                sale.type === 'online' ? 'Online' : 'Presencial',
                sale.customerName,
                sale.customerEmail,
                sale.customerPhone,
                sale.total,
                sale.paymentMethod,
                dayjs(sale.date).format('YYYY-MM-DD HH:mm')
              ]);
              const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `ventas-${dayjs().format('YYYY-MM-DD')}.csv`;
              link.click();
            }}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar a CSV
          </button>
        </div>
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

      {/* Sales List */}
      <div className="card">
        <div className="card-body">
          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar ventas por código, cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Total</th>
                  <th>Método de Pago</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map(sale => (
                  <tr key={sale._id}>
                    <td>{sale.code}</td>
                    <td>
                      <span className={`badge ${sale.type === 'online' ? 'bg-primary' : 'bg-success'}`}>
                        {sale.type === 'online' ? 'Online' : 'Presencial'}
                      </span>
                    </td>
                    <td>{sale.customerName}</td>
                    <td>{sale.customerEmail}</td>
                    <td>{sale.customerPhone}</td>
                    <td>${sale.total.toFixed(2)}</td>
                    <td>{sale.paymentMethod}</td>
                    <td>{dayjs(sale.date).format('DD/MM/YYYY HH:mm')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleViewSale(sale)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteSale(sale)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * itemsPerPage >= filteredSales.length}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Venta */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{isViewing ? 'Detalles de la Venta' : 'Nueva Venta'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div>Cargando datos...</div>
          ) : modalError ? (
            <div className="alert alert-danger">{modalError}</div>
          ) : (
            <>
              {!isViewing && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar producto por nombre o código..."
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                  />
                </div>
              )}
              {!isViewing && filteredModalProducts.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {filteredModalProducts.slice(0, 10).map(product => (
                    <button
                      key={product._id}
                      className="list-group-item list-group-item-action mb-1"
                      onClick={() => handleAddProductToSale(product)}
                      disabled={!!saleItems.find(item => item.product._id === product._id) || product.stock === 0}
                    >
                      {product.name} (Stock: {product.stock}) - ${product.price}
                    </button>
                  ))}
                </div>
              )}
              {searchProduct && filteredModalProducts.length === 0 && !isViewing && (
                <div className="alert alert-info mt-2">No se encontraron productos</div>
              )}

              <h6 className="mt-4">Productos en la venta</h6>
              <div style={{ maxHeight: saleItems.length > 3 ? 220 : 'none', overflowY: saleItems.length > 3 ? 'auto' : 'visible' }}>
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      {!isViewing && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map(item => (
                      <tr key={item.product._id}>
                        <td>{item.product?.name || 'Producto desconocido'}</td>
                        <td>${item.product?.price?.toFixed(2) || 'N/A'}</td>
                        <td>
                          {isViewing ? (
                            item.quantity
                          ) : (
                            <>
                              <input
                                type="number"
                                min="1"
                                max={item.product?.stock || 1}
                                value={item.quantity}
                                onChange={e => handleChangeQuantity(item.product._id, Number(e.target.value))}
                                style={{ width: 60 }}
                              />
                              <span className="ms-1 text-muted">/ {item.product?.stock || 0} disp.</span>
                            </>
                          )}
                        </td>
                        <td>${(item.quantity * item.product?.price || 0).toFixed(2)}</td>
                        {!isViewing && (
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRemoveProductFromSale(item.product._id)}>
                              <i className="bi bi-x"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {saleItems.length === 0 && (
                      <tr><td colSpan={isViewing ? 4 : 5} className="text-center">No hay productos agregados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h6 className="mt-4">Datos del Cliente</h6>
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del cliente (opcional)"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    disabled={isViewing}
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email (opcional)"
                    value={customer.email}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    disabled={isViewing}
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Teléfono (opcional)"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    disabled={isViewing}
                  />
                </div>
              </div>

              <div className="mt-3 text-end">
                <h5>Total: ${totalSale.toFixed(2)}</h5>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseModal}>
            Cerrar
          </button>
          {!isViewing && (
            <button 
              className="btn btn-success" 
              onClick={handleSaveSale}
              disabled={saleItems.length === 0 || modalLoading}
            >
              {modalLoading ? 'Guardando...' : 'Guardar Venta'}
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SalesDashboard; 