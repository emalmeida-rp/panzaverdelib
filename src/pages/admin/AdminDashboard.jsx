import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import GalleryAdmin from './GalleryAdmin';
import OrdersAdmin from './OrdersAdmin';
import Modal from 'react-bootstrap/Modal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useCart } from '../../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import styles from './AdminDashboard.module.scss';
import ProductEditModal from './ProductEditModal';
dayjs.extend(utc);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('adminItemsPerPage');
    return saved ? Number(saved) : 10;
  });
  const navigate = useNavigate();
  const { showAlert } = useAlert();
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
  // Categorías
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', description: '' });
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategory, setEditCategory] = useState({ name: '', icon: '', description: '' });
  const [migrateFromCategory, setMigrateFromCategory] = useState('');
  const [migrateToCategory, setMigrateToCategory] = useState('');
  const [migrating, setMigrating] = useState(false);
  const notifDropdownRef = useRef(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('readNotifIds')) || [];
    } catch {
      return [];
    }
  });
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: notifOrders = [], isLoading: notifLoading, error: notifError, refetch: refetchNotif } = useQuery({
    queryKey: ['notifOrders'],
    queryFn: async () => {
      const res = await fetchWithAuth('/orders');
      if (!res.ok) throw new Error('Error al cargar pedidos');
      const data = await res.json();
      return data.filter(o => o.status === 'pendiente').slice(0, 5);
    },
    refetchInterval: 60000 // refresca cada 1 minuto
  });

  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetchWithAuth('/orders');
      if (!response.ok) throw new Error('Error al cargar los pedidos');
      return response.json();
    }
  });

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

  // Fetch categorías
  useEffect(() => {
    // Fetch categorías al montar el componente
    const fetchCategories = async () => {
      setCatLoading(true);
      try {
        const res = await fetchWithAuth('/categories');
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setCatError(err.toString());
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
      refetchOrders();
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

  // Crear categoría
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const res = await fetchWithAuth('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (!res.ok) throw new Error('Error al crear categoría');
      const cat = await res.json();
      setCategories([...categories, cat]);
      setNewCategory({ name: '', icon: '', description: '' });
    } catch (err) {
      setCatError(err.message);
    }
  };

  // Editar categoría
  const handleEditCategory = (cat) => {
    setEditCategoryId(cat._id);
    setEditCategory({ name: cat.name, icon: cat.icon, description: cat.description });
  };
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`/categories/${editCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCategory)
      });
      if (!res.ok) throw new Error('Error al actualizar categoría');
      const updated = await res.json();
      setCategories(categories.map(cat => cat._id === editCategoryId ? updated : cat));
      setEditCategoryId(null);
      setEditCategory({ name: '', icon: '', description: '' });
    } catch (err) {
      setCatError(err.message);
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      const res = await fetchWithAuth(`/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar categoría');
      setCategories(categories.filter(cat => cat._id !== id));
    } catch (err) {
      setCatError(err.message);
    }
  };

  // Helper para mostrar el nombre de la categoría
  const getCategoryName = (catId) => {
    if (!catId) return 'Sin categoría';
    const found = categories.find(c => c._id?.toString() === catId?.toString());
    return found ? found.name : catId;
  };

  // Migrar productos masivamente
  const handleMigrateProducts = async (e) => {
    e.preventDefault();
    if (!migrateFromCategory || !migrateToCategory) {
      showAlert('Selecciona las categorías de origen y destino', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción moverá todos los productos de la categoría seleccionada a la nueva categoría.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, migrar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setMigrating(true);
    try {
      const response = await fetchWithAuth('/products/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCategory: migrateFromCategory,
          toCategory: migrateToCategory
        })
      });

      if (!response.ok) throw new Error('Error al migrar los productos');
      
      const data = await response.json();
      showAlert(`Migración completada. ${data.modifiedCount} productos actualizados.`, 'success');
      
      // Refrescar la lista de productos
      const productsResponse = await fetchWithAuth('/products');
      if (productsResponse.ok) {
        const updatedProducts = await productsResponse.json();
        setProducts(updatedProducts);
      }
    } catch (err) {
      showAlert('Error al migrar los productos', 'error');
    } finally {
      setMigrating(false);
      setMigrateFromCategory('');
      setMigrateToCategory('');
    }
  };

  const handleMarkAsRead = (id) => {
    const updated = [...new Set([...readNotifIds, id])];
    setReadNotifIds(updated);
    localStorage.setItem('readNotifIds', JSON.stringify(updated));
  };

  // Guardar itemsPerPage en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('adminItemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedProduct) => {
    setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
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
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Panel de Administración</h1>
        <div className="d-flex gap-2">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className={`btn btn-outline-primary position-relative ${styles.dashboardBtn} ${styles.dashboardBtnOutline}`} onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} ref={notifDropdownRef}>
            <i className="bi bi-bell" style={{ fontSize: 22 }}></i>
              {notifOrders.filter(o => !readNotifIds.includes(o._id)).length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {notifOrders.filter(o => !readNotifIds.includes(o._id)).length}
              </span>
            )}
          </button>
            {notifDropdownOpen && (
              <div className={`${styles.notifDropdownAnchored} ${styles.animateFadeSlide}`} ref={notifDropdownRef}>
                <div className={styles.notifDropdownArrow}></div>
                <div className="dropdown-menu show p-3 shadow border-0">
                  <h6 className="dropdown-header">Notificaciones de nuevos pedidos</h6>
                  {notifLoading ? (
                    <div className="text-center text-muted">Cargando notificaciones...</div>
                  ) : notifOrders.length === 0 ? (
                    <div className="text-center text-muted">No hay pedidos nuevos pendientes.</div>
                  ) : (
                    <ul className="list-group mb-2">
                      {notifOrders.map(order => (
                        <li key={order._id} className={`list-group-item d-flex justify-content-between align-items-center ${readNotifIds.includes(order._id) ? 'bg-light text-muted' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleMarkAsRead(order._id)}
                        >
                          <span className="fw-bold">{order.code}</span>
                          <span className="badge bg-warning text-dark">Pendiente</span>
                          {readNotifIds.includes(order._id) && <i className="bi bi-check2-circle ms-2 text-success"></i>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button className="btn btn-outline-secondary w-100" onClick={() => refetchNotif()}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refrescar
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            className={`btn btn-primary ${styles.dashboardBtn} ${styles.dashboardBtnPrimary}`}
            onClick={() => { setSelectedProduct(null); setShowEditModal(true); }}
          >
            Agregar Producto
          </button>
          <button 
            className={`btn btn-danger ${styles.dashboardBtn} ${styles.dashboardBtnDanger}`}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <ul className={styles.dashboardTabs + ' nav nav-tabs mb-4'}>
        <li className="nav-item">
          <button
            className={styles.dashboardTab + (activeTab === 'productos' ? ' active' : '') + ' ' + styles.dashboardBtn}
            onClick={() => setActiveTab('productos')}
          >
            Productos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={styles.dashboardTab + (activeTab === 'galeria' ? ' active' : '') + ' ' + styles.dashboardBtn}
            onClick={() => setActiveTab('galeria')}
          >
            Galería
          </button>
        </li>
        <li className="nav-item">
          <button
            className={styles.dashboardTab + (activeTab === 'pedidos' ? ' active' : '') + ' ' + styles.dashboardBtn}
            onClick={() => setActiveTab('pedidos')}
          >
            Pedidos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={styles.dashboardTab + (activeTab === 'historico' ? ' active' : '') + ' ' + styles.dashboardBtn}
            onClick={() => setActiveTab('historico')}
          >
            Histórico
          </button>
        </li>
        <li className="nav-item">
          <button
            className={styles.dashboardTab + (activeTab === 'categorias' ? ' active' : '') + ' ' + styles.dashboardBtn}
            onClick={() => setActiveTab('categorias')}
          >
            Categorías
          </button>
        </li>
      </ul>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos' && (
        catLoading || categories.length === 0 ? (
          <div className="text-center my-4">Cargando categorías...</div>
        ) : (
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
                  className={styles.dashboardSelect + ' form-select d-inline-block w-auto'}
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
                  className={styles.dashboardInput + ' form-control'}
                placeholder="Buscar productos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

            <div className={styles.tableContainer}>
              <table className={styles.dashboardTable}>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                    <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                  {products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <img 
                        src={product.image} 
                        alt={product.name}
                          className={styles.productThumbnail}
                      />
                    </td>
                    <td>{product.name}</td>
                      <td>{getCategoryName(product.category)}</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                        <span className={`${styles.statusBadge} ${product.isAvailable ? styles.statusActive : styles.statusInactive}`}>
                        {product.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className={`btn btn-sm ${styles.dashboardBtn} ${styles.dashboardBtnPrimary}`}
                      >
                        Editar
                          </button>
                      <button 
                        onClick={() => handleDelete(product._id)}
                            className={`btn btn-sm ${styles.dashboardBtn} ${styles.dashboardBtnDanger}`}
                      >
                        Eliminar
                      </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )
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
                              {order.comments && (
                                <div className="mt-3">
                                  <strong>Comentarios del cliente:</strong>
                                  <div className="alert alert-info mt-1 mb-0">{order.comments}</div>
                                </div>
                              )}
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
      {activeTab === 'categorias' && (
        <div className="mb-5">
          <h3 className="mb-3">Administrar Categorías</h3>
          {catError && <div className="alert alert-danger">{catError}</div>}
          
          {/* Formulario de migración masiva */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Migración Masiva de Productos</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleMigrateProducts} className="row g-3 align-items-end">
                <div className="col-md-5">
                  <label className="form-label">Categoría de origen</label>
                  <select 
                    className={styles.dashboardSelect + ' form-select'}
                    value={migrateFromCategory}
                    onChange={(e) => setMigrateFromCategory(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label">Categoría de destino</label>
                  <select 
                    className={styles.dashboardSelect + ' form-select'}
                    value={migrateToCategory}
                    onChange={(e) => setMigrateToCategory(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button 
                    type="submit" 
                    className={`btn btn-primary w-100 ${styles.dashboardBtn} ${styles.dashboardBtnPrimary}`}
                    disabled={migrating}
                  >
                    {migrating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Migrando...
                      </>
                    ) : 'Migrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Formulario de creación/edición de categorías */}
          <form className="row g-2 align-items-end mb-4" onSubmit={editCategoryId ? handleUpdateCategory : handleCreateCategory}>
            <div className="col-md-3">
              <label className="form-label">Nombre</label>
              <input type="text" className={styles.dashboardInput + ' form-control'} required maxLength={32}
                value={editCategoryId ? editCategory.name : newCategory.name}
                onChange={e => editCategoryId ? setEditCategory({ ...editCategory, name: e.target.value }) : setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Ícono (opcional)</label>
              <input type="text" className={styles.dashboardInput + ' form-control'} maxLength={32}
                value={editCategoryId ? editCategory.icon : newCategory.icon}
                onChange={e => editCategoryId ? setEditCategory({ ...editCategory, icon: e.target.value }) : setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="bi-book, bi-pencil..."
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Descripción</label>
              <input type="text" className={styles.dashboardInput + ' form-control'} maxLength={64}
                value={editCategoryId ? editCategory.description : newCategory.description}
                onChange={e => editCategoryId ? setEditCategory({ ...editCategory, description: e.target.value }) : setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
            <div className="col-md-2 d-grid">
              <button type="submit" className={`btn btn-${editCategoryId ? 'warning' : 'primary'} ${styles.dashboardBtn} ${styles.dashboardBtnPrimary}`}>{editCategoryId ? 'Actualizar' : 'Crear'}</button>
              {editCategoryId && (
                <button type="button" className={`btn btn-secondary mt-2 ${styles.dashboardBtn} ${styles.dashboardBtnOutline}`} onClick={() => { setEditCategoryId(null); setEditCategory({ name: '', icon: '', description: '' }); }}>Cancelar</button>
              )}
            </div>
          </form>
          {catLoading ? (
            <div className="text-center my-4">Cargando categorías...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Ícono</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat._id}>
                      <td>{cat.icon && <i className={`bi ${cat.icon} me-2`}></i>}</td>
                      <td>{cat.name}</td>
                      <td>{cat.description}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditCategory(cat)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCategory(cat._id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan="4" className="text-center">No hay categorías registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal para crear/editar pedido histórico */}
      <Modal style={{ top: '3rem' }} show={showHistoryModal} onHide={() => {
        setShowHistoryModal(false);
        setEditingOrder(null);
      }} size="lg" dialogClassName="custom-modal-dialog">
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
                className={styles.dashboardInput + ' form-control'}
                value={historyFormData.userName}
                onChange={(e) => setHistoryFormData({...historyFormData, userName: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={styles.dashboardInput + ' form-control'}
                value={historyFormData.userEmail}
                onChange={(e) => setHistoryFormData({...historyFormData, userEmail: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className={styles.dashboardInput + ' form-control'}
                value={historyFormData.userPhone}
                onChange={(e) => setHistoryFormData({...historyFormData, userPhone: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className={styles.dashboardInput + ' form-control'}
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
                          className={styles.dashboardInput + ' form-control'}
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
                          className={styles.dashboardInput + ' form-control'}
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

      <ProductEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        product={selectedProduct}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default AdminDashboard; 