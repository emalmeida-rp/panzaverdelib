import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Navbar = () => {
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDropdown = () => setShowDropdown(!showDropdown);
  const handleModal = () => setShowModal(!showModal);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-success">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          Panza Verde
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/history" className="nav-link">Historia</Link>
          <Link to="/gallery" className="nav-link">Galería</Link>
          <Link to="/contact" className="nav-link">Contacto</Link>
          <Link to="/cart" className="nav-link">Carrito</Link>
          <div className="nav-item dropdown" style={{ position: 'relative' }}>
            <button
              className="btn btn-link nav-link position-relative"
              style={{ color: 'white', fontSize: '1.5rem' }}
              onClick={handleDropdown}
            >
              <i className="bi bi-cart"></i>
              {cart.length > 0 && (
                <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
            {showDropdown && (
              <div className="dropdown-menu show p-3" style={{ minWidth: 320, right: 0, left: 'auto' }}>
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
                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => updateQuantity(item.name, item.quantity - 1)} disabled={item.quantity === 1}>-</button>
                            <span>{item.quantity}</span>
                            <button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => updateQuantity(item.name, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                        <span className="ms-2">{item.price}</span>
                        <button className="btn btn-sm btn-danger ms-2" onClick={() => removeFromCart(item.name)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                    <div className="dropdown-divider"></div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold">${getTotal()}</span>
                    </div>
                    <button className="btn btn-primary w-100 mt-2" onClick={handleModal}>
                      Ver resumen
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de resumen */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Resumen del carrito</h5>
                <button type="button" className="btn-close" onClick={handleModal}></button>
              </div>
              <div className="modal-body">
                {cart.length === 0 ? (
                  <p>El carrito está vacío.</p>
                ) : (
                  <ul className="list-group">
                    {cart.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{item.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 text-end">
                  <strong>Total: ${getTotal()}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleModal}>Cerrar</button>
                <button type="button" className="btn btn-success" disabled>Finalizar compra</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 