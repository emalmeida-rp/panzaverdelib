import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../../utils/api';
import { useAlert } from '../../../context/AlertContext';
import styles from '../AdminDashboard.module.scss';
import { FaBellSlash, FaCheck, FaCheckDouble, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const NotificationDropdown = ({ onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Obtener todas las notificaciones (leídas y no leídas)
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: async () => {
      const response = await fetchWithAuth('/notifications');
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      return response.json();
    },
  });

  const markAsRead = async (id) => {
    try {
      const response = await fetchWithAuth(`/notifications/${id}`, { 
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true }) 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al marcar como leída');
      }

      // Actualizar las queries relacionadas
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      
      showAlert('Notificación marcada como leída', 'success');
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showAlert(error.message || 'Error al marcar la notificación como leída', 'error');
    }
  };

  const markAsUnread = async (id) => {
    try {
      const response = await fetchWithAuth(`/notifications/${id}`, { 
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: false }) 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al marcar como no leída');
      }

      // Actualizar las queries relacionadas
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      
      showAlert('Notificación marcada como no leída', 'info');
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      showAlert(error.message || 'Error al marcar la notificación como no leída', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetchWithAuth(`/notifications/${id}`, { 
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar notificación');
      }

      // Actualizar las queries relacionadas
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      
      showAlert('Notificación eliminada', 'success');
    } catch (error) {
      console.error("Error deleting notification:", error);
      showAlert(error.message || 'Error al eliminar la notificación', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetchWithAuth('/notifications/mark-all-read', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al marcar todas como leídas');
      }

      // Actualizar las queries relacionadas
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      
      showAlert('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showAlert(error.message || 'Error al marcar todas las notificaciones como leídas', 'error');
    }
  };

  const handleNotificationClick = (notification) => {
    // Navegar según el tipo de notificación
    if (notification.type === 'pedido') {
      // Buscar código del pedido con patrón más general
      // Formato: 3 letras + guión + alfanumérico (ej: QRD-ac6f0eauf20W, ORD-123ABC)
      let codeMatch = notification.message.match(/[A-Z]{3}-[A-Za-z0-9]+/);
      
      // Si no encuentra el patrón general, buscar otros patrones posibles
      if (!codeMatch) {
        // Buscar patrones como "pedido: CODIGO", "código: CODIGO" o "recibido: CODIGO"
        const altMatch = notification.message.match(/(?:pedido|código|code|recibido):\s*([A-Z0-9-]+)/i);
        if (altMatch) {
          codeMatch = [altMatch[1]];
        }
      }
      
      if (codeMatch) {
        console.log('🔍 Código de pedido extraído:', codeMatch[0]);
        navigate('/belpvsrvadm-ey', { 
          state: { 
            activeSection: 'orders', 
            searchTerm: codeMatch[0] 
          } 
        });
      } else {
        console.log('⚠️ No se pudo extraer código del mensaje:', notification.message);
        // Si no se puede extraer el código, ir a pedidos sin filtro
        navigate('/belpvsrvadm-ey', { 
          state: { 
            activeSection: 'orders' 
          } 
        });
      }
    } else if (notification.type === 'stock_low' && notification.product) {
      // Para notificaciones de stock bajo, usar el nombre del producto
      console.log('🔍 Producto de stock bajo:', notification.product.name);
      navigate('/belpvsrvadm-ey', { 
        state: { 
          activeSection: 'products', 
          searchTerm: notification.product.name 
        } 
      });
    } else {
      // Para otros tipos, ir al dashboard
      navigate('/belpvsrvadm-ey');
    }
    
    // Cerrar el dropdown
    onClose();
  };

  // Separar notificaciones leídas y no leídas
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className={styles.notifDropdown}>
      <div className={styles.notifHeader}>
        <h5 className="mb-0">
          Notificaciones 
          {unreadNotifications.length > 0 && (
            <span className="badge bg-danger ms-2">{unreadNotifications.length}</span>
          )}
        </h5>
        <div className="d-flex gap-2">
          {unreadNotifications.length > 0 && (
            <button 
              className="btn btn-sm btn-outline-success" 
              onClick={markAllAsRead}
              title="Marcar todas como leídas"
            >
              <FaCheckDouble />
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      
      <div className={styles.notifList}>
        {isLoading && (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 mb-0 text-muted">Cargando notificaciones...</p>
          </div>
        )}
        
        {!isLoading && notifications.length === 0 && (
          <div className={styles.noNotifications}>
            <FaBellSlash size={24} className="text-muted mb-2" />
            <p className="text-muted mb-0">No hay notificaciones</p>
          </div>
        )}
        
        {!isLoading && notifications.length > 0 && (
          <>
            {/* Notificaciones No Leídas */}
            {unreadNotifications.length > 0 && (
              <>
                <div className={styles.notifSectionHeader}>
                  <small className="text-muted fw-bold">NO LEÍDAS</small>
                </div>
                {unreadNotifications.map(notif => (
                  <div key={notif._id} className={`${styles.notifItem} ${styles.unread}`}>
                    <div 
                      className={styles.notifContent}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <p className={styles.notifMessage}>{notif.message}</p>
                          <small className={styles.notifTime}>
                            {dayjs(notif.createdAt).fromNow()}
                          </small>
                        </div>
                      </div>
                      
                      {notif.type === 'stock_low' && notif.product && (
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">
                            Stock Bajo: {notif.product.name}
                          </span>
                        </div>
                      )}
                      
                      {notif.type === 'pedido' && (
                        <div className="mt-2">
                          <span className="badge bg-info">
                            Nuevo Pedido
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.notifActions}>
                      <button 
                        className="btn btn-sm btn-outline-success" 
                        title="Marcar como leída" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        title="Eliminar notificación" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif._id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Notificaciones Leídas */}
            {readNotifications.length > 0 && (
              <>
                <div className={styles.notifSectionHeader}>
                  <small className="text-muted fw-bold">LEÍDAS</small>
                </div>
                {readNotifications.slice(0, 5).map(notif => (
                  <div key={notif._id} className={`${styles.notifItem} ${styles.read}`}>
                    <div 
                      className={styles.notifContent}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <p className={styles.notifMessage}>{notif.message}</p>
                          <small className={styles.notifTime}>
                            {dayjs(notif.createdAt).fromNow()}
                          </small>
                        </div>
                      </div>
                      
                      {notif.type === 'stock_low' && notif.product && (
                        <div className="mt-2">
                          <span className="badge bg-secondary">
                            Stock Bajo: {notif.product.name}
                          </span>
                        </div>
                      )}
                      
                      {notif.type === 'pedido' && (
                        <div className="mt-2">
                          <span className="badge bg-secondary">
                            Pedido
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.notifActions}>
                      <button 
                        className="btn btn-sm btn-outline-secondary" 
                        title="Marcar como no leída" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsUnread(notif._id);
                        }}
                      >
                        <FaEyeSlash />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        title="Eliminar notificación" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif._id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {readNotifications.length > 5 && (
                  <div className="text-center py-2">
                    <small className="text-muted">
                      ... y {readNotifications.length - 5} más leídas
                    </small>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown; 