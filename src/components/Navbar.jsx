import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import CartWidget from './CartWidget';

const Navbar = () => {
  const { cart } = useCart();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-success w-100">
      <div className="container-fluid px-4 justify-content-between">
        <Link to="/" className="navbar-logo" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
          Libreria Panza Verde
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`}>
          <div className="navbar-nav ms-auto">
            <Link to="/" className="nav-link" onClick={() => setIsNavCollapsed(true)}>Inicio</Link>
            <Link to="/productos" className="nav-link" onClick={() => setIsNavCollapsed(true)}>Productos</Link>
            <Link to="/history" className="nav-link" onClick={() => setIsNavCollapsed(true)}>Historia</Link>
            <Link to="/gallery" className="nav-link" onClick={() => setIsNavCollapsed(true)}>Galería</Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsNavCollapsed(true)}>Contacto</Link>
          </div>
          <div className="navbar-nav d-lg-none">
            {/* Mostrar el carrito solo en móviles */}
            <CartWidget />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 