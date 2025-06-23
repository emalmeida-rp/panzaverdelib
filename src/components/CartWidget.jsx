import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import styles from './CartWidget.module.scss';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useQuery } from '@tanstack/react-query';
import OrderDetailModal from './OrderDetailModal';

const MySwal = withReactContent(Swal);

const CartWidget = () => {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [orderComments, setOrderComments] = useState('');

  // Estados para el modal de detalle de pedido
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Detectar si es móvil
  const isMobile = window.innerWidth < 992;

  // Configuración segura para SweetAlert2 (evitar conflictos de z-index)
  const safeSwalConfig = {
    customClass: {
      container: 'swal2-container-custom',
      popup: 'swal2-popup-custom'
    },
    didOpen: () => {
      const container = document.querySelector('.swal2-container');
      if (container) {
        container.style.zIndex = '10000';
      }
    }
  };

  const handleDropdown = () => setShowDropdown(!showDropdown);
  const handleModal = () => setShowModal(!showModal);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // React Query para seguimiento de pedidos
  const { data: orderStatusList = [] } = useQuery({
    queryKey: ['orderStatusList', localStorage.getItem('orderCodes')],
    queryFn: async () => {
      const orderCodesStr = localStorage.getItem('orderCodes');
      const orderCodes = orderCodesStr ? JSON.parse(orderCodesStr) : [];
      if (orderCodes.length === 0) return [];

      const results = await Promise.all(orderCodes.map(async code => {
        try {
          const res = await fetch(`${API_URL}/orders/code/${code}`);
          if (!res.ok) {
            if (res.status === 404) {
              const updatedCodes = orderCodes.filter(c => c !== code);
              localStorage.setItem('orderCodes', JSON.stringify(updatedCodes));
            }
            return null;
          }
          const data = await res.json();
          return data; // Devolver el objeto de pedido completo
        } catch (error) {
          console.error(`Error fetching status for order ${code}:`, error);
          return null;
        }
      }));
      return results.filter(Boolean);
    },
    refetchInterval: 240000 // refresca cada 4 minutos
  });

  // Limpiar estado del modal cuando se cierre
  useEffect(() => {
    if (!showDetailModal) {
      setSelectedOrder(null);
    }
  }, [showDetailModal]);

  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseOrderDetail = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const handleConfirmPurchase = async () => {
    try {
      const { value: formValues } = await MySwal.fire({
        title: 'Confirmar compra',
        html: `
          <div class="mb-3">
            <label for="userName" class="form-label">Nombre completo</label>
            <input type="text" class="form-control" id="userName" required>
          </div>
          <div class="mb-3">
            <label for="userEmail" class="form-label">Email</label>
            <input type="email" class="form-control" id="userEmail" required>
          </div>
          <div class="mb-3">
            <label for="userPhone" class="form-label">Teléfono</label>
            <input type="tel" class="form-control" id="userPhone" required>
          </div>
          <div class="mb-3">
            <label for="userAddress" class="form-label">Método de pago</label>
            <select class="form-control" id="userAddress" required>
              <option value="">Selecciona método de pago</option>
              <option value="QR MercadoPago">QR MercadoPago</option>
              <option value="Presencial">Presencial (efectivo/tarjeta)</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="orderComments" class="form-label">
              <i class="bi bi-chat-left-text me-2"></i>
              Comentarios para tu pedido
            </label>
            <textarea
              class="form-control"
              id="orderComments"
              rows="3"
              placeholder="Agrega cualquier comentario o instrucción especial para tu pedido..."
            ></textarea>
            <div class="form-text">
              Por ejemplo: "Entregar después de las 18hs" o "Llamar antes de entregar"
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        ...safeSwalConfig,
        preConfirm: () => {
          const userName = document.getElementById('userName').value;
          const userEmail = document.getElementById('userEmail').value;
          const userPhone = document.getElementById('userPhone').value;
          const userAddress = document.getElementById('userAddress').value;
          const comments = document.getElementById('orderComments').value;
          if (!userName || !userEmail || !userPhone || !userAddress) {
            Swal.showValidationMessage('Todos los campos son obligatorios');
            return false;
          }
          return { userName, userEmail, userPhone, userAddress, comments };
        }
      });

      if (formValues) {
        const orderData = {
          ...formValues,
          items: cart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price
          })),
          total: getTotal(),
        };
        try {
          const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });
          const data = await response.json();
          if (response.ok) {
            clearCart();
            setOrderComments('');
            // Guardar el código del pedido en localStorage (array)
            let orderCodes = [];
            try {
              orderCodes = JSON.parse(localStorage.getItem('orderCodes')) || [];
            } catch {
              orderCodes = [];
            }
            orderCodes.push(data.code);
            localStorage.setItem('orderCodes', JSON.stringify(orderCodes));
            localStorage.setItem('lastOrderCode', data.code);
            await MySwal.fire({
              icon: 'success',
              title: '¡Pedido realizado exitosamente!',
              html: `
                <div style="text-align: center;">
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h5 style="color: #495057; margin-bottom: 10px;">📋 Código de Pedido</h5>
                    <span style="font-size: 1.25em; font-weight: bold; color: #28a745;">${data.code}</span>
                  </div>
                  
                  <div style="text-align: left; background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; margin: 15px 0;">
                    <h6 style="color: #495057; margin-bottom: 10px; text-align: center;">📦 Resumen del Pedido</h6>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                      ${orderData.items.map(item => `<li>${item.quantity} x ${cart.find(p => p._id === item.product)?.name || 'Producto'}</li>`).join('')}
                    </ul>
                    <hr style="margin: 10px 0;">
                    <div style="text-align: center;">
                      <strong style="font-size: 1.1em; color: #28a745;">Total: $${orderData.total}</strong>
                    </div>
                  </div>

                  <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h6 style="color: #0056b3; margin-bottom: 10px;">💳 Información de Pago</h6>
                    <p style="margin: 5px 0; color: #495057;"><strong>Método seleccionado:</strong> ${formValues.userAddress}</p>
                    <p style="margin: 5px 0; color: #495057; font-size: 0.9em;">
                      <strong>Alias MercadoPago:</strong> Panzaverde.lib
                    </p>
                  </div>

                  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #856404; font-size: 0.95em; line-height: 1.5;">
                      <strong>📞 Próximos pasos:</strong><br>
                      Te contactaremos pronto para coordinar tu pedido. Mientras tanto, puedes consultar el estado desde el ícono del carrito.
                    </p>
                  </div>

                  <p style="margin-top: 20px; color: #28a745; font-weight: bold;">
                    ¡Gracias por confiar en nosotros! 🌟
                  </p>
                </div>`,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#28a745',
              ...safeSwalConfig,
            });
          } else {
            await MySwal.fire({ 
              icon: 'error', 
              title: 'Error', 
              text: data.message || 'No se pudo crear el pedido',
              ...safeSwalConfig
            });
          }
        } catch (error) {
          await MySwal.fire({ 
            icon: 'error', 
            title: 'Error', 
            text: 'No se pudo conectar con el servidor',
            ...safeSwalConfig
          });
        }
      }
    } catch (error) {
      console.error('Error en la confirmación de compra:', error);
      await MySwal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: 'Ocurrió un error al confirmar la compra.',
        ...safeSwalConfig
      });
    }
  };

  const getOrderStatusVisual = (status) => {
    switch (status) {
      case 'pago_pendiente':
        return { text: 'Pendiente de pago', color: '#f39c12', icon: 'bi-hourglass-split' };
      case 'pendiente':
        return { text: 'Pendiente', color: '#f39c12', icon: 'bi-hourglass-split' };
      case 'procesando':
        return { text: 'Pago confirmado', color: '#3498db', icon: 'bi-patch-check-fill' };
      case 'on_hold':
        return { text: 'En preparación', color: '#8e44ad', icon: 'bi-box-seam' };
      case 'enviado':
        return { text: 'Listo para retirar', color: '#1abc9c', icon: 'bi-truck' };
      case 'completado':
        return { text: 'Entregado', color: '#2ecc71', icon: 'bi-check2-circle' };
      case 'cancelado':
        return { text: 'Cancelado', color: '#e74c3c', icon: 'bi-x-circle' };
      default:
        return { text: 'Desconocido', color: '#7f8c8d', icon: 'bi-question-circle' };
    }
  };

  const hasContent = cart.length > 0 || orderStatusList.length > 0;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div className={styles.cartWidgetContainer} ref={dropdownRef}>
        <button className={styles.cartButton} onClick={handleDropdown}>
          <i className="bi bi-cart3"></i>
          {cartItemCount > 0 && (
            <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
              {cartItemCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className={`${styles.dropdownMenu} ${showDropdown ? styles.show : ''}`}>
            {hasContent ? (
              <>
                {/* Sección del carrito */}
                <div className={styles.cartContent}>
                  <h6 className={styles.dropdownSectionTitle}>
                    <i className="bi bi-cart-check me-2"></i>Mi Carrito
                  </h6>
                  {cart.length > 0 ? (
                    <>
                      {cart.map((item) => (
                        <div key={item._id} className={styles.cartItem}>
                          <img src={item.image} alt={item.name} />
                          <div className={styles.itemInfo}>
                            <span>{item.name}</span>
                            <div className={styles.itemQuantity}>
                              <button
                                className={styles.quantityButton}
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                className={styles.quantityButton}
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className={styles.itemPrice}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                          <button
                            className={styles.removeButton}
                            onClick={() => removeFromCart(item._id)}
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      ))}
                      <div className={styles.cartFooter}>
                        <div className={styles.totalSection}>
                          <span>Total:</span>
                          <span>${getTotal()}</span>
                        </div>
                        <button
                          className={styles.actionButton}
                          onClick={handleConfirmPurchase}
                        >
                          Confirmar Compra
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.clear}`}
                          onClick={clearCart}
                        >
                          Vaciar Carrito
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className={styles.emptyCartText}>Tu carrito está vacío.</p>
                  )}
                </div>

                {/* Sección de seguimiento de pedidos */}
                {orderStatusList.length > 0 && (
                  <>
                    <hr className={styles.divider} />
                    <h6 className={styles.dropdownSectionTitle}>
                      <i className="bi bi-receipt-cutoff me-2"></i>Seguimiento de pedidos
                    </h6>
                    <ul className={styles.statusList}>
                      {orderStatusList.map((order, index) => {
                        if (!order || !order.status) return null;
                        const visual = getOrderStatusVisual(order.status);
                        return (
                          <li key={index} className={styles.statusItem}>
                            <button onClick={() => handleOpenOrderDetail(order)} className={styles.statusButton}>
                              <span className={styles.statusIcon} style={{ color: visual.color }}>
                                <i className={visual.icon}></i>
                              </span>
                              <div className={styles.statusDetails}>
                                <span className={styles.statusCode}>Pedido #{order.code}</span>
                                <span className={styles.statusText} style={{ color: visual.color }}>
                                  {visual.text}
                                </span>
                              </div>
                              <span className={styles.statusChevron}>
                                <i className="bi bi-chevron-right"></i>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className={styles.emptyCartText}>
                Tu carrito está vacío y no tienes pedidos para seguir.
              </p>
            )}
          </div>
        )}
      </div>

      <OrderDetailModal
        show={showDetailModal}
        onHide={handleCloseOrderDetail}
        order={selectedOrder}
      />
    </>
  );
};

export default CartWidget; 