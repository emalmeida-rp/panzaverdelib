import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAlert } from '../context/AlertContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

const OrderForm = () => {
  const { cart, getTotal, clearCart } = useCart();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    userAddress: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createOrder = async (orderData) => {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al crear el pedido');
    return data;
  };

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      showAlert('Pedido creado exitosamente', 'success');
      clearCart();
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['notifOrders']);
      navigate(`/order-confirmation/${data.code}`);
    },
    onError: () => {
      showAlert('Error al crear el pedido', 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      items: cart.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price
      })),
      total: getTotal()
    };
    mutation.mutate(orderData);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Finalizar Pedido</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumen del Carrito</h2>
          {cart.map(item => (
            <div key={item._id} className="flex justify-between mb-2">
              <span>{item.name} x {item.quantity}</span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${getTotal()}</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Nombre</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="userEmail"
              value={formData.userEmail}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Teléfono</label>
            <input
              type="tel"
              name="userPhone"
              value={formData.userPhone}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Dirección</label>
            <textarea
              name="userAddress"
              value={formData.userAddress}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            disabled={mutation.isLoading}
          >
            Confirmar Pedido
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm; 