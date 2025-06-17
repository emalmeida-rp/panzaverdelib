import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const OrderDetailPlaceholder = () => {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/orders/code/${code}`);
        setOrder(data);
      } catch (err) {
        setError('No se pudo cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [code]);

  if (loading) return <div style={{ padding: 32 }}>Cargando pedido...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  if (!order) return <div style={{ padding: 32 }}>Pedido no encontrado</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2>Detalle de Pedido</h2>
      <p><b>Código:</b> {order.code}</p>
      <p><b>Cliente:</b> {order.userName}</p>
      <p><b>Email:</b> {order.userEmail}</p>
      <p><b>Teléfono:</b> {order.userPhone}</p>
      <p><b>Dirección:</b> {order.userAddress}</p>
      <p><b>Estado:</b> {order.status}</p>
      <p><b>Total:</b> ${order.total}</p>
      <p><b>Comentarios:</b> {order.comments}</p>
      <h3>Productos:</h3>
      <ul>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.product?.name || item.product} - Cantidad: {item.quantity} - Precio: ${item.price}
          </li>
        ))}
      </ul>
      {/* Agrega más campos si es necesario */}
    </div>
  );
};

export default OrderDetailPlaceholder; 