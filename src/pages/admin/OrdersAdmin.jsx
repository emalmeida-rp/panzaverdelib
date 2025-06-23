import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import { useQuery } from '@tanstack/react-query';
import OrderEditModal from './OrderEditModal';
import styles from './AdminDashboard.module.scss';
import { FaPencilAlt, FaTrash, FaQrcode, FaChevronDown, FaChevronUp, FaSync, FaFileCsv, FaPause, FaTimes } from 'react-icons/fa';

const OrdersAdmin = ({ searchTerm = '', onSearchTermChange }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { showAlert } = useAlert();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [generatingQrOrderId, setGeneratingQrOrderId] = useState(null);
  const [deletingQrOrderId, setDeletingQrOrderId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Sincronizar con el searchTerm del padre
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // React Query para pedidos
  const { data: ordersData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('[React Query] Fetching pedidos desde OrdersAdmin');
      const response = await fetchWithAuth('/orders');
      if (!response.ok) throw new Error('Error al cargar los pedidos');
      return response.json();
    },
  });

  const handleSearchChange = (value) => {
    setLocalSearchTerm(value);
    if (onSearchTermChange) {
      onSearchTermChange(value);
    }
    setCurrentPage(1); // Reset pagination when searching
  };

  const handleGenerateQr = async (orderId) => {
    setGeneratingQrOrderId(orderId);
    try {
      const response = await fetchWithAuth(`/orders/${orderId}/generate-qr`, {
        method: 'POST',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al generar el código QR');
      }

      showAlert('Código QR generado/actualizado con éxito', 'success');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      showAlert(err.message || 'Error al generar el código QR', 'error');
    } finally {
      setGeneratingQrOrderId(null);
    }
  };

  const handleDeleteQr = async (orderId) => {
    const result = await Swal.fire({
      title: '¿Eliminar código QR?',
      text: 'Esta acción eliminará el código QR del pedido.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setDeletingQrOrderId(orderId);
    try {
      const response = await fetchWithAuth(`/orders/${orderId}/delete-qr`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el código QR');
      }

      showAlert('Código QR eliminado con éxito', 'success');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al eliminar el código QR', 'error');
    } finally {
      setDeletingQrOrderId(null);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
  };

  const handleSaveChanges = async (updatedOrder) => {
    try {
      const response = await fetchWithAuth(`/orders/${updatedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar el pedido');
      }
  
      showAlert('Pedido actualizado con éxito', 'success');
      handleCloseEditModal();
      refetch();
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al actualizar el pedido', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (newStatus === 'historico') {
        const response = await fetchWithAuth(`/orders/${orderId}/move-to-history`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Error al mover el pedido a históricos');
        }

        refetch();
        return;
      }

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

      refetch();
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al actualizar el estado', 'error');
    }
  };

  const handleDelete = async (orderId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el pedido de forma permanente.',
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
      const response = await fetchWithAuth(`/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el pedido');
      }

      refetch();
    } catch (err) {
      console.error('Error:', err);
      showAlert('Error al eliminar el pedido', 'error');
    }
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Cliente', 'Email', 'Teléfono', 'Dirección', 'Total', 'Estado', 'Fecha'];
    const csvData = ordersData.map(order => [
      order.code,
      order.userName,
      order.userEmail,
      order.userPhone,
      order.userAddress,
      order.total,
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pago_pendiente': return 'bg-warning';
      case 'procesando': return 'bg-info';
      case 'enviado': return 'bg-primary';
      case 'completado': return 'bg-success';
      case 'cancelado': return 'bg-danger';
      case 'on_hold': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const filteredOrders = ordersData.filter(order => 
    order.code.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    order.userName.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    order.userEmail.toLowerCase().includes(localSearchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return (
    <div className="container mt-4">
      <div className={styles.pageHeader}>
        <h1>Gestión de Pedidos</h1>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => refetch()}>
            <FaSync /> Refrescar
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={exportToCSV}>
            <FaFileCsv /> Exportar a CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar pedidos por código, nombre o email..."
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
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
            {[...Array(8)].map((_, idx) => (
              <tr key={idx} className="placeholder-glow">
                {Array.from({ length: 8 }).map((_, cidx) => (
                  <td key={cidx}>
                    <span className="placeholder col-10" style={{ height: 18, display: 'inline-block', borderRadius: 4 }}></span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>Página {currentPage} de {totalPages}</span>
        <div className={styles.btnGroup}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</button>
        </div>
      </div>
    </div>
  );

  if (queryError) return <div className="container mt-4 alert alert-danger">{queryError.message}</div>;

  return (
    <div className={styles.adminSection}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Gestión de Pedidos</h2>
        <div className={styles.headerActions}>
          <button onClick={() => refetch()} className={`${styles.btn} ${styles.btnSecondary}`}>
            <FaSync /> Refrescar
          </button>
          <button onClick={exportToCSV} className={`${styles.btn} ${styles.btnPrimary}`}>
            <FaFileCsv /> Exportar a CSV
          </button>
        </div>
      </div>

      <div className={styles.contentCard}>
        <input
          type="text"
          className="form-control mb-4"
          placeholder="Buscar pedidos por código, nombre o email..."
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        {/* Vista de Tabla para Escritorio */}
        <div className={styles.responsiveTableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map(order => (
                <React.Fragment key={order._id}>
                  <tr>
                    <td>
                      <button className="btn btn-link p-0 me-2" onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                        {expandedOrderId === order._id ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      {order.code}
                    </td>
                    <td>{order.userName}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        <option value="pago_pendiente">Pago Pendiente</option>
                        <option value="procesando">Procesando</option>
                        <option value="enviado">En Preparación</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="on_hold">On Hold</option>
                        <option value="historico">Mover a Histórico</option>
                      </select>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => handleEdit(order)}>
                        <FaPencilAlt />
                      </button>
                      <button className="btn btn-sm btn-danger" title="Eliminar" onClick={() => handleDelete(order._id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  {expandedOrderId === order._id && (
                    <tr>
                      <td colSpan="6">
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
                                  <td>{item.product?.name || 'Producto eliminado'}</td>
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
                          <div className="mt-3 pt-3 border-top">
                            <h6 className="mb-2">Código QR de Pago</h6>
                            {order.qrCodeBase64 ? (
                              <div className="text-center">
                                <img 
                                  src={`data:image/jpeg;base64,${order.qrCodeBase64}`} 
                                  alt="Código QR de pago" 
                                  style={{ maxWidth: '150px', borderRadius: '8px' }} 
                                />
                                <div className="mt-2">
                                  <button 
                                    className="btn btn-warning btn-sm me-2" 
                                    onClick={() => handleGenerateQr(order._id)}
                                    disabled={generatingQrOrderId === order._id}
                                  >
                                    {generatingQrOrderId === order._id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Regenerando...
                                      </>
                                    ) : (
                                      <>
                                        <FaQrcode className="me-1" />
                                        Regenerar QR
                                      </>
                                    )}
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-sm" 
                                    onClick={() => handleDeleteQr(order._id)}
                                    disabled={deletingQrOrderId === order._id}
                                  >
                                    {deletingQrOrderId === order._id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Eliminando...
                                      </>
                                    ) : (
                                      <>
                                        <FaTimes className="me-1" />
                                        Eliminar QR
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-muted small mb-3">No se ha generado un código QR para este pedido.</p>
                                <button 
                                  className="btn btn-success btn-sm" 
                                  onClick={() => handleGenerateQr(order._id)}
                                  disabled={generatingQrOrderId === order._id}
                                >
                                  {generatingQrOrderId === order._id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                      Generando...
                                    </>
                                  ) : (
                                    <>
                                      <FaQrcode className="me-1" />
                                      Generar QR
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas para Móvil */}
        <div className={styles.cardList}>
          {paginatedOrders.map(order => (
            <div className={styles.cardItem} key={order._id}>
              <div className={styles.cardItemHeader}>
                <strong>{order.code}</strong>
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status === 'on_hold' ? 'On Hold' : order.status}
                </span>
              </div>
              <div className={styles.cardItemContent}>
                <p><strong>Cliente:</strong> {order.userName}</p>
                <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Estado:</strong>
                  <select 
                    className="form-select form-select-sm mt-1" 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  >
                    <option value="pago_pendiente">Pago Pendiente</option>
                    <option value="procesando">Procesando</option>
                    <option value="enviado">En Preparación</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="on_hold">On Hold</option>
                    <option value="historico">Mover a Histórico</option>
                  </select>
                </p>
              </div>
              <div className={styles.actionButtons}>
                <button onClick={() => handleEdit(order)}>
                  <FaPencilAlt /> Editar
                </button>
                <button className='danger' onClick={() => handleDelete(order._id)}>
                  <FaTrash /> Eliminar
                </button>
                <button onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                  {expandedOrderId === order._id ? <FaChevronUp /> : <FaChevronDown />} Detalle
                </button>
              </div>
              {expandedOrderId === order._id && (
                <div className="p-2 mt-2 border-top">
                  <h6>Productos:</h6>
                  <ul className="list-unstyled">
                    {order.items.map(item => (
                      <li key={item.product?._id || item._id} className="small">
                        {item.product?.name || 'N/A'} x {item.quantity} - ${item.price}
                      </li>
                    ))}
                  </ul>
                  {order.comments && (
                    <div className="mt-2">
                      <strong>Comentarios:</strong> 
                      <p className="small text-muted">{order.comments}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <h6>QR de Pago:</h6>
                    {order.qrCodeBase64 ? (
                      <div className="text-center">
                        <img 
                          src={`data:image/jpeg;base64,${order.qrCodeBase64}`} 
                          alt="QR" 
                          style={{maxWidth: 120, borderRadius: 4}} 
                        />
                        <div className="mt-2">
                          <button 
                            className="btn btn-warning btn-sm me-1" 
                            onClick={() => handleGenerateQr(order._id)} 
                            disabled={generatingQrOrderId === order._id}
                          >
                            {generatingQrOrderId === order._id ? 'Regenerando...' : 'Regenerar'}
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDeleteQr(order._id)} 
                            disabled={deletingQrOrderId === order._id}
                          >
                            {deletingQrOrderId === order._id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-muted small">No generado</p>
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={() => handleGenerateQr(order._id)} 
                          disabled={generatingQrOrderId === order._id}
                        >
                          {generatingQrOrderId === order._id ? 'Generando...' : 'Generar QR'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Paginación */}
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>Mostrando {paginatedOrders.length} de {filteredOrders.length} pedidos</span>
          <div className={styles.btnGroup}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Siguiente</button>
          </div>
        </div>
      </div>
      
      {editingOrder && (
        <OrderEditModal
          show={showEditModal}
          onHide={handleCloseEditModal}
          order={editingOrder}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
};

export default OrdersAdmin; 