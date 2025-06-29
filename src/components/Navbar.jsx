import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useRef } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import CartWidget from './CartWidget';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../utils/api';
import styles from './Navbar.module.scss';

const Navbar = () => {
  const { cart } = useCart();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const categoryParam = params.get('category');
  const dropdownRef = useRef(null);
  const navCollapseRef = useRef(null);
  const togglerRef = useRef(null);

  useEffect(() => {
    if (!showCategories) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategories]);

  useEffect(() => {
    if (isNavCollapsed) return;

    const handleClickOutside = (event) => {
      if (
        navCollapseRef.current &&
        !navCollapseRef.current.contains(event.target) &&
        togglerRef.current &&
        !togglerRef.current.contains(event.target)
      ) {
        setIsNavCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavCollapsed]);

  const { data: categories = [], isLoading: catLoading, error: catError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetchWithAuth('/categories');
      if (!res.ok) throw new Error('Error al cargar categorías');
      return res.json();
    },
    refetchInterval: 300000
  });

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  return (
    <>
      <nav className="navbar z-index-100 navbar-expand-lg navbar-light bg-success position-sticky top-0">
      <div className="container-fluid px-4 justify-content-between">
          <Link to="/" className={styles.navbarLogo}>
            <span className={styles.fullBrandName}>Libreria Panza Verde</span>
            <span className={styles.shortBrandName}>L. Panza Verde</span>
        </Link>
        <button
            ref={togglerRef}
          className="navbar-toggler"
          type="button"
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
          <div ref={navCollapseRef} className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`}>
          <div className="navbar-nav ms-auto">
            <Link to="/" className="nav-link" onClick={() => setIsNavCollapsed(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home" aria-label="Inicio" style={{ marginRight: 8, verticalAlign: 'middle' }}><path d="M3 9.5L12 3l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Inicio
              </span>
            </Link>
              <div className="nav-item dropdown" ref={dropdownRef}>
                <a className="nav-link dropdown-toggle" href="#" role="button" onClick={(e) => {
                    e.preventDefault();
                    setShowCategories(!showCategories);
                  }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-box" aria-label="Productos" style={{ marginRight: 8, verticalAlign: 'middle' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  Productos
                </span>
                </a>
              <ul className={`dropdown-menu ${styles.categoryDropdown} ${showCategories ? 'show' : ''}`}>
                <li>
                    <button
                      className={`${styles.categoryBtn} ${!categoryParam ? styles.activeCategory : ''}`}
                      onClick={() => {
                        navigate('/productos');
                        setShowCategories(false);
                        setIsNavCollapsed(true);
                      }}
                    >
                    Todos
                  </button>
                </li>
                {catLoading ? (
                  <li className="dropdown-item text-muted">Cargando...</li>
                ) : catError ? (
                  <li className="dropdown-item text-danger">Error al cargar</li>
                ) : (
                  categories.map(cat => (
                    <li key={cat._id}>
                        <button
                          className={`${styles.categoryBtn} ${categoryParam === cat._id ? styles.activeCategory : ''}`}
                          onClick={() => {
                            navigate(`/productos?category=${cat._id}`);
                            setShowCategories(false);
                            setIsNavCollapsed(true);
                          }}
                        >
                        {cat.icon ? (
                          cat.icon.startsWith('bi-') ? (
                            <i className={`bi ${cat.icon} me-1`}></i>
                          ) : (
                            <span className="me-1">{cat.icon}</span>
                          )
                        ) : null}
                        {cat.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <Link to="/history" className="nav-link" onClick={() => setIsNavCollapsed(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-book" aria-label="Historia" style={{ marginRight: 8, verticalAlign: 'middle' }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>
                Historia
              </span>
            </Link>
            <Link to="/gallery" className="nav-link" onClick={() => setIsNavCollapsed(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-image" aria-label="Galería" style={{ marginRight: 8, verticalAlign: 'middle' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Galería
              </span>
            </Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsNavCollapsed(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail" aria-label="Contacto" style={{ marginRight: 8, verticalAlign: 'middle' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
                Contacto
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
      <CartWidget />
    </>
  );
};

export default Navbar; 