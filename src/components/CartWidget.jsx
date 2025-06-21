import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import styles from './CartWidget.module.scss';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useQuery } from '@tanstack/react-query';

const MySwal = withReactContent(Swal);

const CartWidget = () => {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [orderComments, setOrderComments] = useState('');

  // Detectar si es móvil
  const isMobile = window.innerWidth < 992;

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
          return data && data.status ? { code, status: data.status } : null;
        } catch (error) {
          console.error(`Error fetching status for order ${code}:`, error);
          return null;
        }
      }));
      return results.filter(Boolean);
    },
    refetchInterval: 240000 // refresca cada 4 minutos
  });

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
            <label for="userAddress" class="form-label">Dirección de entrega</label>
            <input type="text" class="form-control" id="userAddress" required>
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
              title: '¡Pedido realizado!',
              html: `<p>Tu código de pedido es: <b>${data.code}</b></p>
                     <h4>Resumen:</h4>
                     <ul style="text-align:left;">${orderData.items.map(item => `<li>${item.quantity} x ${cart.find(p => p._id === item.product)?.name || 'Producto'}</li>`).join('')}</ul>
                     <p><b>Total: $${orderData.total}</b></p>
                     <p style='font-size: 0.95em; text-align: center;'>
                       ALIAS MP: Panzaverde.lib
                       </p>
                     <div class="swal-qr-row" style='display: flex; align-items: center; gap: 16px; margin-top: 24px;'>
                       <img src='https://placehold.co/160x160?text=QR' alt='QR de pago' style='width: 160px; height: 160px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.10);'>
                       <div style='font-size: 0.95em; text-align: left;'>
                         Te compartimos el código QR y/o alias de Mercado por si preferis adelantar el pago, o aguarda a que te contactemos para coordinar y completar tu pedido. .<br>
                         <strong>¡Muchas gracias por tu confianza! Visita el carrito para conocer el estado de tu pedido.</strong>
                       </div>
                     </div>
                     <style>
                       @media (max-width: 600px) {
                         .swal-qr-row {
                           flex-direction: column !important;
                           align-items: center !important;
                           text-align: center !important;
                         }
                         .swal-qr-row img {
                           width: 80vw !important;
                           height: 80vw !important;
                           max-width: 320px !important;
                           max-height: 320px !important;
                         }
                         .swal-qr-row div {
                           text-align: center !important;
                           margin-top: 1rem;
                         }
                       }
                     </style>`,
              confirmButtonText: 'Aceptar'
            });
          } else {
            await MySwal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo crear el pedido' });
          }
        } catch (error) {
          await MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor' });
        }
      }
    } catch (error) {
      console.error('Error en la confirmación de compra:', error);
      await MySwal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al confirmar la compra.' });
    }
  };

  const getOrderStatusVisual = (status) => {
    switch (status) {
      case 'pendiente':
        return { styleKey: 'pending', icon: 'bi-clock', text: 'Pendiente de Pago' };
      case 'procesando':
        return { styleKey: 'processing', icon: 'bi-cash-coin', text: 'Pago Confirmado' };
      case 'enviado':
        return { styleKey: 'shipping', icon: 'bi-truck', text: 'En Preparación' };
      case 'completado':
        return { styleKey: 'completed', icon: 'bi-check-circle', text: 'Entregado' };
      case 'cancelado':
        return { styleKey: 'cancelled', icon: 'bi-x-circle', text: 'Cancelado' };
      default:
        return { styleKey: 'unknown', icon: 'bi-question-circle', text: 'Desconocido' };
    }
  };

  // Flotante en escritorio y mobile
  return (
    <>
      <div className={styles.cartWidgetFloat} ref={dropdownRef}>
        <button className={styles.cartButton} onClick={handleDropdown}>
          <i className="bi bi-cart"></i>
          {cart.length > 0 && (
            <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
        {/* Dropdown flotante */}
        <div className={`${styles.dropdownMenu} ${showDropdown ? styles.show : ''}`}>
          <div className={styles.dropdownHeader}>Carrito de Compras</div>
          {/* Estado del pedido */}
          {orderStatusList.length > 0 && (
            <div className={styles.orderStatusList}>
              <strong>Seguimiento de pedidos:</strong>
              <ul>
                {orderStatusList.map((order) => {
                  const visual = getOrderStatusVisual(order.status);
                  return (
                    <li key={order.code} className={`${styles.orderStatusItem} ${styles[visual.styleKey]}`}>
                      <i className={`${styles.statusIcon} bi ${visual.icon}`} />
                      <span className={styles.statusCode}>{order.code}</span>
                      <span className={styles.statusText}>{visual.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {cart.length === 0 ? (
            <div className={styles.emptyCartText}>Tu carrito está vacío</div>
          ) : (
            <>
              <div>
                {cart.map((item) => (
                  <div key={item._id} className={styles.cartItem}>
                    <img src={item.image} alt={item.name} />
                    <div className={styles.itemInfo}>
                      <div>{item.name}</div>
                      <div className={styles.itemQuantity}>
                        <button
                          className={styles.quantityButton}
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, item.quantity - 1); }}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, item.quantity + 1, item.stock); }}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button className={styles.removeButton} onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.cartFooter}>
                <div className={styles.totalSection}>
                  <span>Total:</span>
                  <span>${getTotal()}</span>
                </div>
                <button
                  className={`${styles.actionButton} ${styles.clear}`}
                  onClick={(e) => { e.stopPropagation(); clearCart(); }}
                >
                  Vaciar Carrito
                </button>
                <button
                  className={`${styles.actionButton} ${styles.confirm}`}
                  onClick={handleConfirmPurchase}
                  disabled={cart.length === 0}
                >
                  Confirmar Compra
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Modal de confirmación de compra */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar compra</h5>
                <button type="button" className="btn-close" onClick={handleModal}></button>
              </div>
              <div className="modal-body">
                <p>¿Deseas confirmar la compra?</p>
                <ul className="list-group mb-3">
                  {cart.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-end mb-3">
                  <strong>Total: ${getTotal()}</strong>
                </div>
                <div className="mb-3">
                  <label htmlFor="orderComments" className="form-label">
                    <i className="bi bi-chat-left-text me-2"></i>
                    Comentarios para tu pedido
                  </label>
                  <textarea
                    className="form-control"
                    id="orderComments"
                    rows="3"
                    placeholder="Agrega cualquier comentario o instrucción especial para tu pedido..."
                    value={orderComments}
                    onChange={(e) => setOrderComments(e.target.value)}
                  ></textarea>
                  <div className="form-text">
                    Por ejemplo: "Entregar después de las 18hs" o "Llamar antes de entregar"
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 mt-4" style={{ minHeight: 100 }}>
                  <div style={{ minWidth: 100 }}>
                    <img src="https://placehold.co/100x100?text=QR" alt="QR de pago" className="img-fluid rounded shadow" />
                  </div>
                  <div className="flex-grow-1 small text-start">
                    Te facilitamos el código QR para que puedas adelantar el pago, o bien aguardá a que te contactemos para avanzar con el pedido.<br/>
                    <strong>¡Muchas gracias por elegirnos!</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={handleModal}>Cerrar</button>
                <button type="button" className="btn btn-success" disabled>Confirmar compra</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartWidget; 