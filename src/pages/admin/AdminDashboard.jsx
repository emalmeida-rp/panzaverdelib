import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import GalleryAdmin from './GalleryAdmin';
import OrdersAdmin from './OrdersAdmin';
import SalesDashboard from './SalesDashboard';
import { useQuery } from '@tanstack/react-query';
import styles from './AdminDashboard.module.scss';
import ProductList from './components/ProductList';
import CampaignsAdmin from './CampaignsAdmin';
import BrandAdmin from './BrandAdmin';
import BannerAdmin from './BannerAdmin';
import NotificationDropdown from './components/NotificationDropdown';
import StockMonitor from './StockMonitor';
import { FaTachometerAlt, FaBoxOpen, FaShoppingCart, FaTags, FaBullhorn, FaImages, FaBell, FaSignOutAlt, FaBars, FaTimes, FaHome, FaUsers, FaClipboardCheck, FaCamera, FaCog } from 'react-icons/fa';
import PushNotificationManager from '../../components/PushNotificationManager';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  // Manejar navegación desde notificaciones
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
      if (location.state.searchTerm) {
        setSearchTerm(location.state.searchTerm);
      }
      // Limpiar el estado para evitar conflictos usando setTimeout para evitar bucles
      setTimeout(() => {
      navigate(location.pathname, { replace: true });
      }, 0);
    }
  }, [location.state?.activeSection, location.state?.searchTerm, navigate, location.pathname]); // Solo dependencias específicas

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: () => fetchWithAuth('/notifications?read=false&countOnly=true').then(res => res.json()),
    retry: 1,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    refetchOnWindowFocus: false,
    staleTime: 15000, // Considerar datos fresh por 15 segundos
  });
  const unreadCount = notifications?.count || 0;

  const handleLogout = async () => {
    showAlert('Cerrando sesión', 'info');
    localStorage.removeItem('adminToken');
    navigate('/belpvsrvadm-ey/login');
  };

  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setSearchTerm(''); // Limpiar búsqueda al cambiar sección
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const sections = useMemo(() => [
    { 
      id: 'dashboard', 
      icon: <FaTachometerAlt />, 
      label: 'Dashboard', 
      component: <SalesDashboard /> 
    },
    { 
      id: 'orders', 
      icon: <FaShoppingCart />, 
      label: 'Pedidos', 
      component: <OrdersAdmin searchTerm={searchTerm} onSearchTermChange={setSearchTerm} /> 
    },
    { 
      id: 'products', 
      icon: <FaBoxOpen />, 
      label: 'Productos', 
      component: <ProductList searchTerm={searchTerm} onSearchTermChange={setSearchTerm} /> 
    },
    { 
      id: 'stock-monitor', 
      icon: <FaClipboardCheck />, 
      label: 'Monitoreo Stock', 
      component: <StockMonitor /> 
    },
    { 
      id: 'campaigns', 
      icon: <FaBullhorn />, 
      label: 'Campañas', 
      component: <CampaignsAdmin /> 
    },
    { 
      id: 'banners', 
      icon: <FaImages />, 
      label: 'Banners', 
      component: <BannerAdmin /> 
    },
    { 
      id: 'brands', 
      icon: <FaTags />, 
      label: 'Marcas', 
      component: <BrandAdmin /> 
    },
    { 
      id: 'gallery', 
      icon: <FaCamera />, 
      label: 'Galería', 
      component: <GalleryAdmin /> 
    },
    { 
      id: 'settings', 
      icon: <FaCog />, 
      label: 'Configuración', 
      component: (
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <h2 className="mb-4">⚙️ Configuración del Sistema</h2>
              <PushNotificationManager 
                userRole="admin" 
                showSettings={true}
              />
            </div>
          </div>
        </div>
      )
    }
  ], [searchTerm]);

  const renderContent = useMemo(() => {
    const activeItem = sections.find(item => item.id === activeSection);
    return activeItem ? activeItem.component : <SalesDashboard />;
  }, [sections, activeSection]);

  const sidebarRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 768 && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para agregar/quitar clase al body cuando el sidebar se colapsa
  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isSidebarCollapsed]);

  return (
    <div className={styles.dashboardLayout}>
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${isSidebarOpen ? styles.isOpen : ''} ${isSidebarCollapsed ? styles.isCollapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <button className={styles.hamburger} onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h2 className={styles.sidebarTitle}>Admin</h2>
        </div>
        <ul className={styles.sidebarNav}>
          {sections.map(item => (
            <li
              key={item.id}
              className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
              onClick={() => { handleSectionChange(item.id); }}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span> 
              <span className={styles.navLabel}>{item.label}</span>
            </li>
          ))}
        </ul>
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton} title="Cerrar Sesión">
            <FaSignOutAlt /> 
            <span className={styles.logoutLabel}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.isOpen : ''}`}
        onClick={() => setIsSidebarOpen(false)} 
      />

      <div className={`${styles.contentWrapper} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.mobileMenuButton} onClick={toggleSidebar}>
              <FaBars />
            </button>
            {searchTerm && (
              <div className="badge bg-info">
                Filtrado por: "{searchTerm}"
                <button 
                  className="btn-close btn-close-white ms-2" 
                  onClick={() => setSearchTerm('')}
                  style={{ fontSize: '0.6rem' }}
                ></button>
              </div>
            )}
          </div>
          <div className={styles.headerRight}>
            <button className={styles.notificationButton} onClick={() => setShowNotifications(s => !s)}>
              <FaBell />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
            <Link to="/" className={styles.homeButton} title="Ir al Inicio">
              <FaHome />
            </Link>
          </div>
        </header>

        {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}

        <main className={styles.mainContent}>
          {renderContent}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 