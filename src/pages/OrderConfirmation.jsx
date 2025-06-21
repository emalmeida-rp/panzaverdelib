import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const OrderConfirmation = () => {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/code/${code}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          const errorData = await response.json();
          console.error('Error fetching order:', response.status, errorData);
          setError(`Error: ${errorData.message || 'Pedido no encontrado'}`);
        }
      } catch (error) {
        console.error('Error al cargar el pedido:', error);
        setError('Error al cargar el pedido. Revisa la consola para más detalles.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [code]);

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;
  if (!order) return <div className="text-center p-4">No se encontró el pedido</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">¡Pedido Confirmado!</h1>
        <div className="mb-4">
          <p className="text-lg">Código de Pedido: <span className="font-bold">{order.code}</span></p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Detalles del Pedido</h2>
          <p><strong>Nombre:</strong> {order.userName}</p>
          <p><strong>Email:</strong> {order.userEmail}</p>
          <p><strong>Teléfono:</strong> {order.userPhone}</p>
          <p><strong>Dirección:</strong> {order.userAddress}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Productos</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-2">
              <span>{item.product.name} x {item.quantity}</span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-green-600 font-semibold">Gracias por tu compra</p>
          <p className="text-sm text-gray-600 mt-2">Te enviaremos un email con los detalles del pedido</p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 