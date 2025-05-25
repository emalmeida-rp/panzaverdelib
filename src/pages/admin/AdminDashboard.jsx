import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import GalleryAdmin from './GalleryAdmin';
import OrdersAdmin from './OrdersAdmin';
import Modal from 'react-bootstrap/Modal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useCart } from '../../context/CartContext';
dayjs.extend(utc);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // valor por defecto
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [showNotif, setShowNotif] = useState(false);
  const [notifOrders, setNotifOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [historyFormData, setHistoryFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    userAddress: '',
    items: [],
    total: 0
  });
  const { cart, getTotal } = useCart();
  const [showCartItems, setShowCartItems] = useState(false);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetchWithAuth('/products');
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Polling para notificaciones de nuevos pedidos
  useEffect(() => {
    let interval;
    const fetchNotifs = async () => {
      try {
        const response = await fetchWithAuth('/orders');
        if (!response.ok) return;
        const data = await response.json();
        // Solo pedidos pendientes, últimos 5
        const pending = data.filter(o => o.status === 'pendiente').slice(0, 5);
        setNotifOrders(pending);
      } catch {}
    };
    fetchNotifs();
    interval = setInterval(fetchNotifs, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  // Fetch pedidos completados
  useEffect(() => {
    if (activeTab === 'historico') {
      setLoadingCompleted(true);
      fetchWithAuth('/orders/history')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setCompletedOrders(data);
        })
        .finally(() => setLoadingCompleted(false));
    }
  }, [activeTab]);

  // KPIs
  const now = dayjs();
  const kpiHoy = completedOrders.filter(o => dayjs(o.createdAt).local().isSame(now, 'day'));
  const kpiMes = completedOrders.filter(o => dayjs(o.createdAt).local().isSame(now, 'month'));
  const kpiAnio = completedOrders.filter(o => dayjs(o.createdAt).local().isSame(now, 'year'));
  const suma = arr => arr.reduce((acc, o) => acc + (o.total || 0), 0);

  // Refrescar pedidos y completados tras cambio de estado
  const refreshOrders = async () => {
    try {
      const response = await fetchWithAuth('/orders');
      if (!response.ok) return;
      const data = await response.json();
      setProducts(products); // No afecta productos
      setCompletedOrders(data.filter(o => o.status === 'completado'));
    } catch {}
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(`/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del pedido');
      }

      setCompletedOrders(completedOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      showAlert('Estado actualizado correctamente', 'success');
      // Refrescar ambos listados
      refreshOrders();
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al actualizar el estado', 'error');
    }
  };

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      // Actualizar la lista de productos
      setProducts(products.filter(product => product._id !== productId));
      showAlert('Producto eliminado correctamente', 'danger');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    showAlert('Cerrando sesión', 'info');
    localStorage.removeItem('adminToken');
    navigate('/belpvsrvadm-ey/login');
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateHistoryOrder = async () => {
    try {
      const itemsToSend = historyFormData.items.map(item => ({
        product: item.product._id || item.product,
        quantity: item.quantity,
        price: item.price
      }));
      const response = await fetchWithAuth('/orders/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...historyFormData, items: itemsToSend })
      });
      if (!response.ok) {
        throw new Error('Error al crear el pedido histórico');
      }
      const newOrder = await response.json();
      setCompletedOrders([...completedOrders, newOrder]);
      setShowHistoryModal(false);
      setHistoryFormData({
        userName: '',
        userEmail: '',
        userPhone: '',
        userAddress: '',
        items: [],
        total: 0
      });
      showAlert('Pedido histórico creado correctamente', 'success');
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al crear el pedido histórico', 'error');
    }
  };

  const handleUpdateHistoryOrder = async () => {
    try {
      const itemsToSend = historyFormData.items.map(item => ({
        product: item.product._id || item.product,
        quantity: item.quantity,
        price: item.price
      }));
      const response = await fetchWithAuth(`/orders/history/${editingOrder._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...historyFormData, items: itemsToSend })
      });
      if (!response.ok) {
        throw new Error('Error al actualizar el pedido histórico');
      }
      const updatedOrder = await response.json();
      setCompletedOrders(completedOrders.map(order => 
        order._id === editingOrder._id ? updatedOrder : order
      ));
      setShowHistoryModal(false);
      setEditingOrder(null);
      showAlert('Pedido histórico actualizado correctamente', 'success');
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al actualizar el pedido histórico', 'error');
    }
  };

  const handleDeleteHistoryOrder = async (orderId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el pedido histórico de forma permanente.',
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
      const response = await fetchWithAuth(`/orders/history/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el pedido histórico');
      }

      setCompletedOrders(completedOrders.filter(order => order._id !== orderId));
      showAlert('Pedido histórico eliminado correctamente', 'success');
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al eliminar el pedido histórico', 'error');
    }
  };

  const filteredHistoryOrders = completedOrders.filter(order => 
    order.code.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
    order.userName.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
    order.userEmail.toLowerCase().includes(searchHistoryTerm.toLowerCase())
  );

  const handleAddCartItems = () => {
    const cartItems = cart.map(item => ({
      product: { _id: item._id, name: item.name },
      quantity: item.quantity,
      price: item.price
    }));
    setHistoryFormData(prev => ({
      ...prev,
      items: [...prev.items, ...cartItems],
      total: prev.total + getTotal()
    }));
    setShowCartItems(false);
    showAlert('Productos del carrito agregados correctamente', 'success');
  };

  const handleSearchProducts = async (term) => {
    setSearchProductTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetchWithAuth(`/products/search?term=${term}`);
      if (!response.ok) return;
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity < 1) return;
    const newItem = {
      product: { _id: selectedProduct._id, name: selectedProduct.name },
      quantity: productQuantity,
      price: selectedProduct.price
    };
    setHistoryFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      total: prev.total + (selectedProduct.price * productQuantity)
    }));
    setSelectedProduct(null);
    setProductQuantity(1);
    setSearchProductTerm('');
    setSearchResults([]);
  };

  if (loading && activeTab === 'productos') return (
    <div className="container mt-4">
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, idx) => (
              <tr key={idx} className="placeholder-glow">
                {Array.from({ length: 7 }).map((_, cidx) => (
                  <td key={cidx}>
                    <span className="placeholder col-10" style={{ height: 18, display: 'inline-block', borderRadius: 4 }}></span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Panel de Administración</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary position-relative" onClick={() => setShowNotif(true)}>
            <i className="bi bi-bell" style={{ fontSize: 22 }}></i>
            {notifOrders.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notifOrders.length}
              </span>
            )}
          </button>
          <Link to="/admin/products/new" className="btn btn-primary">
            Agregar Producto
          </Link>
          <button 
            className="btn btn-danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'productos' ? ' active' : ''}`}
            onClick={() => setActiveTab('productos')}
          >
            Productos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'galeria' ? ' active' : ''}`}
            onClick={() => setActiveTab('galeria')}
          >
            Galería
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'pedidos' ? ' active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            Pedidos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'historico' ? ' active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            Histórico
          </button>
        </li>
      </ul>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos' && (
        <>
          {/* Selector de cantidad y paginación */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <label className="me-2">Mostrar:</label>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-select d-inline-block w-auto"
              >
                {[5, 10, 20, 50].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span className="ms-2">productos por página</span>
            </div>
            <div>
              Página {currentPage} de {totalPages}
              <button
                className="btn btn-sm btn-secondary ms-2"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <button
                className="btn btn-sm btn-secondary ms-2"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar productos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      <img 
                        src={product.image} 
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.description.substring(0, 50)}...</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                        {product.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/admin/products/edit/${product._id}`}
                        className="btn btn-sm btn-warning me-2"
                      >
                        Editar
                      </Link>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product._id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {activeTab === 'galeria' && (
        <GalleryAdmin />
      )}
      {activeTab === 'pedidos' && (
        <OrdersAdmin />
      )}
      {activeTab === 'historico' && (
        <>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="mb-0">KPIs de Pedidos Completados</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingOrder(null);
                  setHistoryFormData({
                    userName: '',
                    userEmail: '',
                    userPhone: '',
                    userAddress: '',
                    items: [],
                    total: 0
                  });
                  setShowHistoryModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Agregar Pedido Histórico
              </button>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="card card-body text-center bg-light border-success border-2">
                  <h5 className="mb-1">Hoy</h5>
                  <div className="fw-bold text-success">${suma(kpiHoy)}</div>
                  <div className="small">{kpiHoy.length} pedidos</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card card-body text-center bg-light border-primary border-2">
                  <h5 className="mb-1">Este mes</h5>
                  <div className="fw-bold text-primary">${suma(kpiMes)}</div>
                  <div className="small">{kpiMes.length} pedidos</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card card-body text-center bg-light border-dark border-2">
                  <h5 className="mb-1">Este año</h5>
                  <div className="fw-bold text-dark">${suma(kpiAnio)}</div>
                  <div className="small">{kpiAnio.length} pedidos</div>
                </div>
              </div>
            </div>
            <button className="btn btn-success mb-3" onClick={() => {
              const headers = ['Código', 'Cliente', 'Email', 'Teléfono', 'Dirección', 'Total', 'Estado', 'Fecha'];
              const csvData = completedOrders.map(order => [
                order.code,
                order.userName,
                order.userEmail,
                order.userPhone,
                order.userAddress,
                order.total,
                order.status,
                dayjs(order.createdAt).format('YYYY-MM-DD')
              ]);
              const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `historico-pedidos-${dayjs().format('YYYY-MM-DD')}.csv`;
              link.click();
            }}>
              <i className="bi bi-file-earmark-excel me-2"></i>
              Exportar histórico a CSV
            </button>
          </div>
          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar pedidos por código, nombre o email..."
                value={searchHistoryTerm}
                onChange={(e) => setSearchHistoryTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingCompleted ? (
                  [...Array(8)].map((_, idx) => (
                    <tr key={idx} className="placeholder-glow">
                      {Array.from({ length: 7 }).map((_, cidx) => (
                        <td key={cidx}>
                          <span className="placeholder col-10" style={{ height: 18, display: 'inline-block', borderRadius: 4 }}></span>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  filteredHistoryOrders.map(order => (
                    <React.Fragment key={order._id}>
                      <tr>
                        <td>
                          <button
                            className="btn btn-link p-0"
                            onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                            aria-expanded={expandedOrderId === order._id}
                            aria-controls={`order-details-${order._id}`}
                            title={expandedOrderId === order._id ? 'Ocultar detalle' : 'Ver detalle'}
                          >
                            <i className={`bi ${expandedOrderId === order._id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                          </button>
                          {order.code}
                        </td>
                        <td>{order.userName}</td>
                        <td>{order.userEmail}</td>
                        <td>{order.userPhone}</td>
                        <td>${order.total}</td>
                        <td><span className="badge bg-success">Completado</span></td>
                        <td>{dayjs(order.createdAt).format('YYYY-MM-DD')}</td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => {
                                setEditingOrder(order);
                                setHistoryFormData({
                                  userName: order.userName,
                                  userEmail: order.userEmail,
                                  userPhone: order.userPhone,
                                  userAddress: order.userAddress,
                                  items: order.items,
                                  total: order.total
                                });
                                setShowHistoryModal(true);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteHistoryOrder(order._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order._id && (
                        <tr id={`order-details-${order._id}`}>
                          <td colSpan="7">
                            <div className="p-3 bg-light border rounded">
                              <h6 className="mb-2">Detalle de productos</h6>
                              <table className="table table-sm mb-0">
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio unitario</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.product?.name || item.product?._id || 'Producto eliminado'}</td>
                                      <td>{item.quantity}</td>
                                      <td>${item.price}</td>
                                      <td>${item.price * item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de notificaciones */}
      <Modal show={showNotif} onHide={() => setShowNotif(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notificaciones de nuevos pedidos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notifOrders.length === 0 ? (
            <div className="text-center text-muted">No hay pedidos nuevos pendientes.</div>
          ) : (
            <ul className="list-group">
              {notifOrders.map(order => (
                <li key={order._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="fw-bold">{order.code}</span>
                  <span className="badge bg-warning text-dark">Pendiente</span>
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowNotif(false)}>Cerrar</button>
        </Modal.Footer>
      </Modal>

      {/* Modal para crear/editar pedido histórico */}
      <Modal show={showHistoryModal} onHide={() => {
        setShowHistoryModal(false);
        setEditingOrder(null);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingOrder ? 'Editar Pedido Histórico' : 'Nuevo Pedido Histórico'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre del Cliente</label>
              <input
                type="text"
                className="form-control"
                value={historyFormData.userName}
                onChange={(e) => setHistoryFormData({...historyFormData, userName: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={historyFormData.userEmail}
                onChange={(e) => setHistoryFormData({...historyFormData, userEmail: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                value={historyFormData.userPhone}
                onChange={(e) => setHistoryFormData({...historyFormData, userPhone: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className="form-control"
                value={historyFormData.userAddress}
                onChange={(e) => setHistoryFormData({...historyFormData, userAddress: e.target.value})}
              />
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Productos del pedido</h6>
                {!editingOrder && cart.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowCartItems(!showCartItems)}
                  >
                    <i className="bi bi-cart-plus me-1"></i>
                    {showCartItems ? 'Ocultar carrito' : 'Agregar del carrito'}
                  </button>
                )}
              </div>

              {/* Buscador de productos */}
              <div className="card mb-3">
                <div className="card-body">
                  <h6 className="card-title">Agregar producto</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar producto..."
                          value={searchProductTerm}
                          onChange={(e) => handleSearchProducts(e.target.value)}
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setSearchResults([])}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                      {searchResults.length > 0 && (
                        <div className="list-group mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {searchResults.map(product => (
                            <button
                              key={product._id}
                              className={`list-group-item list-group-item-action ${selectedProduct?._id === product._id ? 'active' : ''}`}
                              onClick={() => setSelectedProduct(product)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{product.name}</span>
                                <span className="badge bg-primary">${product.price}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-md-3">
                      <div className="input-group">
                        <span className="input-group-text">Cantidad</span>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleAddProduct}
                        disabled={!selectedProduct}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {showCartItems && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Productos en el carrito</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map(item => (
                            <tr key={item._id}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>${item.price}</td>
                              <td>${item.price * item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                            <td><strong>${getTotal()}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={handleAddCartItems}
                    >
                      Agregar al pedido
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla de productos del pedido */}
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyFormData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product?.name || item.product?._id || 'Producto eliminado'}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${item.price * item.quantity}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              const newItems = [...historyFormData.items];
                              newItems.splice(index, 1);
                              setHistoryFormData({
                                ...historyFormData,
                                items: newItems,
                                total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                              });
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td colSpan="2"><strong>${historyFormData.total}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={editingOrder ? handleUpdateHistoryOrder : handleCreateHistoryOrder}
            disabled={historyFormData.items.length === 0}
          >
            {editingOrder ? 'Actualizar' : 'Crear'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard; 