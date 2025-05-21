import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './CartWidget.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const CartWidget = () => {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

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

  const handleConfirmPurchase = async () => {
    if (cart.length === 0) return;
    const { value: formValues } = await MySwal.fire({
      title: 'Facilita tus datos de contacto para coordinar la entrega',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Nombre y/o apellido" required autofocus>` +
        `<input id="swal-input2" class="swal2-input" placeholder="Mail: ejemplo@gmail.com" type="email" required>` +
        `<input id="swal-input3" class="swal2-input" placeholder="Teléfono: 11-1111-1111" required>` +
        `<input id="swal-input4" class="swal2-input" placeholder="Dirección: Calle Falsa 123" required>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Finalizar pedido',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const userName = document.getElementById('swal-input1').value;
        const userEmail = document.getElementById('swal-input2').value;
        const userPhone = document.getElementById('swal-input3').value;
        const userAddress = document.getElementById('swal-input4').value;
        if (!userName || !userEmail || !userPhone || !userAddress) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }
        return { userName, userEmail, userPhone, userAddress };
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
        total: getTotal()
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
          await MySwal.fire({
            icon: 'success',
            title: '¡Pedido realizado!',
            html: `<p>Tu código de pedido es: <b>${data.code}</b></p>
                   <h4>Resumen:</h4>
                   <ul style="text-align:left;">${orderData.items.map(item => `<li>${item.quantity} x ${cart.find(p => p._id === item.product)?.name || 'Producto'}</li>`).join('')}</ul>
                   <p><b>Total: $${orderData.total}</b></p>
                   <div class="swal-qr-row" style='display: flex; align-items: center; gap: 16px; margin-top: 24px;'>
                     <img src='https://placehold.co/160x160?text=QR' alt='QR de pago' style='width: 160px; height: 160px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.10);'>
                     <div style='font-size: 0.95em; text-align: left;'>
                       Te dejamos el código QR para que puedas adelantar el pago, o bien aguardar a que te contactemos y coordinar el pedido.<br>
                       <strong>¡Muchas gracias por tu confianza!</strong>
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
  };

  // Flotante en escritorio y mobile
  return (
    <>
      <div
        className="cart-widget-float"
        style={{
          position: 'fixed',
          right: 16,
          left: 'auto',
          bottom: 16,
          zIndex: 1050
        }}
        onClick={handleDropdown}
        ref={dropdownRef}
      >
        <button
          className="btn btn-success rounded-circle shadow-lg position-relative"
          style={{ width: 64, height: 64, fontSize: '2rem' }}
        >
          <i className="bi bi-cart"></i>
          {cart.length > 0 && (
            <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
        {/* Dropdown flotante */}
        {showDropdown && (
          <div className="dropdown-menu show p-3" style={{ minWidth: 320, right: 0, left: 'auto', position: 'absolute', bottom: 80 }}>
            <h6 className="dropdown-header">Carrito</h6>
            {cart.length === 0 ? (
              <span className="dropdown-item-text">El carrito está vacío</span>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center mb-2">
                    <img src={item.image} alt={item.name} width={40} height={40} className="me-2 rounded" />
                    <div className="flex-grow-1">
                      <div className="fw-bold">{item.name}</div>
                      <div className="d-flex align-items-center">
                        <button 
                          className="btn btn-sm btn-outline-secondary me-1" 
                          onClick={e => { e.stopPropagation(); updateQuantity(item._id, item.quantity - 1, item.stock); }} 
                          disabled={item.quantity === 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary ms-1" 
                          onClick={e => { e.stopPropagation(); updateQuantity(item._id, item.quantity + 1, item.stock); }}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="ms-2">${item.price * item.quantity}</span>
                    <button className="btn btn-sm btn-danger ms-2" onClick={e => { e.stopPropagation(); removeFromCart(item._id); }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
                <div className="dropdown-divider"></div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Total:</span>
                  <span className="fw-bold">${getTotal()}</span>
                </div>
                <button className="btn btn-danger w-100 mb-2" onClick={e => { e.stopPropagation(); clearCart(); }}>
                  Vaciar carrito
                </button>
                <button
                  type="button"
                  className="btn btn-success no-tilt"
                  disabled={cart.length === 0}
                  onClick={handleConfirmPurchase}
                >
                  Confirmar compra
                </button>
              </>
            )}
          </div>
        )}
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
                <p>¿Deseas confirmar la compra? (Funcionalidad en desarrollo)</p>
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
                <div className="d-flex align-items-center gap-3 mt-4" style={{ minHeight: 100 }}>
                  <div style={{ minWidth: 100 }}>
                    <img src="https://placehold.co/100x100?text=QR" alt="QR de pago" className="img-fluid rounded shadow" />
                  </div>
                  <div className="flex-grow-1 small text-start">
                    Te dejamos el código QR para que puedas adelantar el pago, o bien aguardar a que te contactemos y coordinar el pedido.<br />
                    <strong>¡Muchas gracias por tu confianza!</strong>
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