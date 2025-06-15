import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import styles from './AdminDashboard.module.scss';
import dayjs from 'dayjs';
import Modal from 'react-bootstrap/Modal';
import Swal from 'sweetalert2';

const SalesAdmin = ({ onSaleSaved }) => {
  const [sales, setSales] = useState([]);
  const [historicalSales, setHistoricalSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState('active');

  const [kpis, setKpis] = useState({
    totalSalesToday: '0.00',
    countSalesMonth: 0,
    averageTicket: '0.00',
    topProducts: []
  });

  const [showModal, setShowModal] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [isViewing, setIsViewing] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchHistoricalSales();
    fetchSalesKPIs();
  }, []);

  const fetchSalesKPIs = async () => {
    try {
      const res = await fetchWithAuth('/sales/kpis');
      if (!res.ok) throw new Error('Error al cargar KPIs de ventas');
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error('Error al cargar KPIs de ventas:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetchWithAuth('/sales?isHistorical=false');
      if (!response.ok) throw new Error('Error al cargar ventas');
      const data = await response.json();
      setSales(data);

      const now = dayjs();
      const ventasHoy = data.filter(s => dayjs(s.date).isSame(now, 'day'));
      const ventasMes = data.filter(s => dayjs(s.date).isSame(now, 'month'));
    } catch (err) {
      setError(err.message);
      showAlert('Error al cargar ventas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalSales = async () => {
    try {
      const response = await fetchWithAuth('/sales?isHistorical=true');
      if (!response.ok) throw new Error('Error al cargar ventas históricas');
      const data = await response.json();
      setHistoricalSales(data);
    } catch (err) {
      console.error('Error al cargar ventas históricas:', err);
      showAlert('Error al cargar ventas históricas', 'error');
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistoricalSales = historicalSales.filter(sale => 
    sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedHistoricalSales = filteredHistoricalSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = async () => {
    setEditingSale(null);
    setIsViewing(false);
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

  const handleOpenEditModal = async (sale) => {
    setEditingSale(sale);
    setIsViewing(false);
    setShowModal(true);
    setModalLoading(true);
    setModalError(null);
    setCustomer({ name: sale.customerName, email: sale.customerEmail, phone: sale.customerPhone });
    const itemsForEdit = sale.items.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));
    setSaleItems(itemsForEdit);
    setSearchProduct('');
    setSelectedProduct(null);

    try {
      const res = await fetchWithAuth('/products');
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      setModalProducts(data);
      setModalLoading(false);
    } catch (err) {
      setModalError(err.message);
      setModalLoading(false);
    }
  };

  const filteredModalProducts = modalProducts.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchProduct.toLowerCase()))
  );

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

  const totalSale = saleItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);

  const handleCloseModal = () => {
    setShowModal(false);
    setSaleItems([]);
    setCustomer({ name: '', email: '', phone: '' });
    setSearchProduct('');
    setSelectedProduct(null);
    setEditingSale(null);
    setIsViewing(false);
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

      let res;
      if (editingSale) {
        res = await fetchWithAuth(`/sales/${editingSale._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        res = await fetchWithAuth('/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la venta');
      }
      showAlert(`Venta ${editingSale ? 'actualizada' : 'registrada'} correctamente`, 'success');
      fetchSales();
      fetchHistoricalSales();
      fetchSalesKPIs();
      if (onSaleSaved) {
        onSaleSaved();
      }
      handleCloseModal();
    } catch (err) {
      setModalError(err.message);
      showAlert(`Error al ${editingSale ? 'actualizar' : 'registrar'} la venta`, 'error');
      console.error(`Error al ${editingSale ? 'actualizar' : 'registrar'} la venta:`, err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSale = async (sale) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará este registro de venta histórica de forma permanente.',
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
      const res = await fetchWithAuth(`/sales/${sale._id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar venta histórica');
      showAlert('Venta histórica eliminada correctamente', 'success');
      fetchSales();
      fetchHistoricalSales();
      fetchSalesKPIs();
    } catch (err) {
      showAlert('Error al eliminar venta histórica', 'error');
      console.error('Error al eliminar venta histórica:', err);
    }
  };

  const handleMarkAsHistorical = async (saleId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas mover esta venta al histórico? Esto no se puede deshacer fácilmente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, mover a histórico',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetchWithAuth(`/sales/${saleId}/mark-historical`, {
        method: 'PUT'
      });

      if (!res.ok) throw new Error('Error al mover venta a histórico');

      showAlert('Venta movida a histórico correctamente', 'success');
      fetchSales();
      fetchHistoricalSales();
      fetchSalesKPIs();
      if (onSaleSaved) {
        onSaleSaved();
      }
    } catch (err) {
      showAlert('Error al mover venta a histórico', 'error');
      console.error('Error al mover venta a histórico:', err);
    }
  };

  const handleViewSale = async (sale) => {
    setEditingSale(sale);
    setIsViewing(true);
    setShowModal(true);
    setModalLoading(false);
    setModalError(null);
    setCustomer({ name: sale.customerName, email: sale.customerEmail, phone: sale.customerPhone });
    const itemsForView = sale.items.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));
    setSaleItems(itemsForView);
    setSearchProduct('');
    setSelectedProduct(null);
    setModalProducts([]);
  };

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Ventas</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => { fetchSales(); fetchHistoricalSales(); fetchSalesKPIs(); }}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refrescar
          </button>
          <button className="btn btn-success" onClick={handleOpenModal}>
            <i className="bi bi-plus-circle me-1"></i>
            Nueva Venta
          </button>
        </div>
      </div>

      {activeTab === 'active' && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white text-center p-3">
              <h5 className="card-title">Ventas Hoy (Presencial)</h5>
              <h2>${kpis.totalSalesToday}</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white text-center p-3">
              <h5 className="card-title">Ventas Mes (Presencial)</h5>
              <h2>{kpis.countSalesMonth}</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white text-center p-3">
              <h5 className="card-title">Ticket Promedio</h5>
              <h2>${kpis.averageTicket}</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark text-center p-3">
              <h5 className="card-title">Productos Más Vendidos</h5>
              <ul>
                {kpis.topProducts.map((p, index) => (
                  <li key={index}>{p.product}: {p.totalSold} uds</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Ventas Activas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'historical' ? 'active' : ''}`}
            onClick={() => setActiveTab('historical')}
          >
            Ventas Históricas
          </button>
        </li>
      </ul>

      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder={`Buscar ventas por código o cliente en ventas ${activeTab === 'active' ? 'activas' : 'históricas'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Método de Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(paginatedSales.length > 0) ? (
                paginatedSales.map(sale => (
                  <tr key={sale._id}>
                    <td>{sale.code}</td>
                    <td>{dayjs(sale.date).format('DD/MM/YYYY HH:mm')}</td>
                    <td>{sale.customerName}</td>
                    <td>${sale.total.toFixed(2)}</td>
                    <td>{sale.paymentMethod}</td>
                    <td>
                      <button className="btn btn-sm btn-info me-1" onClick={() => handleOpenEditModal(sale)} disabled={sale.isHistorical}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      {!sale.isHistorical && (
                         <button className="btn btn-sm btn-secondary me-1" onClick={() => handleMarkAsHistorical(sale._id)}>
                           <i className="bi bi-archive"></i>
                         </button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSale(sale)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center">No hay ventas activas encontradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <h4>Ventas Históricas (Presenciales)</h4>
          <input
            type="text"
            placeholder="Buscar venta histórica (código o cliente)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {loading ? (
            <p>Cargando ventas históricas...</p>
          ) : error ? (
            <p>Error al cargar ventas históricas: {error}</p>
          ) : paginatedHistoricalSales.length === 0 ? (
            <p>No hay ventas históricas para mostrar.</p>
          ) : (
            <table className={styles.dashboardTable}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistoricalSales.map(sale => (
                  <tr key={sale._id}>
                    <td>{sale.code}</td>
                    <td>{dayjs(sale.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                    <td>{sale.customerName}</td>
                    <td>${sale.total.toFixed(2)}</td>
                    <td>
                      <button onClick={() => handleViewSale(sale)} className={styles.actionButton}>Ver</button>
                      <button onClick={() => handleDeleteSale(sale)} className={styles.actionButton}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>Página {currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * itemsPerPage >= filteredHistoricalSales.length}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{isViewing ? 'Detalles de Venta' : editingSale ? 'Editar Venta' : 'Registrar Nueva Venta'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div>Cargando datos...</div>
          ) : modalError ? (
            <div className="alert alert-danger">{modalError}</div>
          ) : editingSale || isViewing ? (
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
                  {filteredModalProducts.length === 0 && (
                    <div className="alert alert-info">No se encontraron productos</div>
                  )}
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
                    type="text"
                    className="form-control"
                    placeholder="Teléfono (opcional)"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    disabled={isViewing}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <h5>Total: ${totalSale.toFixed(2)}</h5>
                {!isViewing && (
                  <button className="btn btn-primary" disabled={saleItems.length === 0 || modalLoading} onClick={handleSaveSale}>
                    {editingSale ? 'Guardar Cambios' : 'Registrar Venta'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar producto por nombre o código..."
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
              </div>
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
                {filteredModalProducts.length === 0 && (
                  <div className="alert alert-info">No se encontraron productos</div>
                )}
              </div>
              <h6 className="mt-4">Productos en la venta</h6>
              <div style={{ maxHeight: saleItems.length > 3 ? 220 : 'none', overflowY: saleItems.length > 3 ? 'auto' : 'visible' }}>
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map(item => (
                      <tr key={item.product._id}>
                        <td>{item.product.name}</td>
                        <td>${item.product.price}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={e => handleChangeQuantity(item.product._id, Number(e.target.value))}
                            style={{ width: 60 }}
                          />
                          <span className="ms-1 text-muted">/ {item.product.stock} disp.</span>
                        </td>
                        <td>${item.product.price * item.quantity}</td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => handleRemoveProductFromSale(item.product._id)}>
                            <i className="bi bi-x"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {saleItems.length === 0 && (
                      <tr><td colSpan="5" className="text-center">No hay productos agregados</td></tr>
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
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email (opcional)"
                      value={customer.email}
                      onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Teléfono (opcional)"
                      value={customer.phone}
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </div>
                </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <h5>Total: ${totalSale.toFixed(2)}</h5>
                <button className="btn btn-primary" disabled={saleItems.length === 0 || modalLoading} onClick={handleSaveSale}>
                  Registrar Venta
                </button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SalesAdmin; 
