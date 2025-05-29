import React, { useState } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import { useQuery } from '@tanstack/react-query';

const OrdersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { showAlert } = useAlert();
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // React Query para pedidos
  const { data: ordersData = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('[React Query] Fetching pedidos desde OrdersAdmin');
      const response = await fetchWithAuth('/orders');
      if (!response.ok) throw new Error('Error al cargar los pedidos');
      return response.json();
    },
    refetchInterval: 60000 // refresca cada 1 minuto
  });

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

  const filteredOrders = ordersData.filter(order => 
    order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Pedidos</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => refetch()}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refrescar
          </button>
        <button 
          className="btn btn-success"
          onClick={exportToCSV}
        >
          <i className="bi bi-file-earmark-excel me-2"></i>
          Exportar a CSV
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
            placeholder="Buscar pedidos por código, nombre o email..."
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

      <div className="d-flex justify-content-between align-items-center mt-4">
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
          <span className="ms-2">Pedidos por página</span>
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
    </div>
  );
  if (queryError) return <div className="container mt-4 alert alert-danger">{queryError.message}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Pedidos</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => refetch()}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refrescar
          </button>
        <button 
          className="btn btn-success"
          onClick={exportToCSV}
        >
          <i className="bi bi-file-earmark-excel me-2"></i>
          Exportar a CSV
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
            placeholder="Buscar pedidos por código, nombre o email..."
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
            {paginatedOrders.map(order => (
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
                  <td>
                    <select
                      className="form-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="pendiente">Pendiente de Pago</option>
                      <option value="procesando">Pago Confirmado</option>
                      <option value="enviado">En Preparación</option>
                      <option value="completado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="historico">Mover a Históricos</option>
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(order._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                {expandedOrderId === order._id && (
                  <tr id={`order-details-${order._id}`}>
                    <td colSpan="8">
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
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
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
          <span className="ms-2">pedidos por página</span>
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
    </div>
  );
};

export default OrdersAdmin; 