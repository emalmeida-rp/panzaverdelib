import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

const NotificationsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      // Manejo de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRead = async (notif) => {
    if (!notif.read) {
      await fetchWithAuth(`/notifications/${notif._id}/read`, { method: 'PATCH' });
      fetchNotifications();
    }
    // Redirigir según el tipo de notificación
    if (notif.type === 'stock_low') {
      navigate(`/admin/products/${notif.product}`);
    } else if (notif.type === 'pedido') {
      const code = notif.link?.split('=')[1];
      if (code) navigate(`/admin/orders/${code}`);
    }
  };

  const handleDelete = async (notifId) => {
    await fetchWithAuth(`/notifications/${notifId}`, { method: 'DELETE' });
    fetchNotifications();
  };

  if (loading) return <div>Cargando notificaciones...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2>Bandeja de Notificaciones</h2>
      {notifications.length === 0 ? (
        <p>No hay notificaciones.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notifications.map((notif) => (
            <li key={notif._id} style={{
              background: notif.read ? '#e6ffe6' : '#fff',
              border: '1px solid #ccc',
              borderRadius: 8,
              marginBottom: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => handleRead(notif)}>
                {notif.read ? (
                  <span style={{ color: 'green', fontSize: 20 }}>✔️</span>
                ) : (
                  <span style={{ color: '#ccc', fontSize: 20 }}>⬜</span>
                )}
                <span>{notif.message}</span>
              </div>
              <button onClick={() => handleDelete(notif._id)} style={{ background: 'none', border: 'none', color: 'red', fontSize: 18, cursor: 'pointer' }} title="Eliminar">🗑️</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsAdmin; 