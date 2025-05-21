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
      fetchWithAuth('/orders')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setCompletedOrders(data.filter(o => o.status === 'completado'));
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
            <h3 className="mb-3">KPIs de Pedidos Completados</h3>
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
                  completedOrders.map(order => (
                    <tr key={order._id}>
                      <td>{order.code}</td>
                      <td>{order.userName}</td>
                      <td>{order.userEmail}</td>
                      <td>{order.userPhone}</td>
                      <td>${order.total}</td>
                      <td><span className="badge bg-success">Completado</span></td>
                      <td>{dayjs(order.createdAt).format('YYYY-MM-DD')}</td>
                    </tr>
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
    </div>
  );
};

export default AdminDashboard; 