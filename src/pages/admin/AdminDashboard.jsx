import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import GalleryAdmin from './GalleryAdmin';
import OrdersAdmin from './OrdersAdmin';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // valor por defecto
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetchWithAuth('/products');
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      // Actualizar la lista de productos
      setProducts(products.filter(product => product._id !== productId));
      showAlert('Producto eliminado correctamente', 'danger');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    showAlert('Cerrando sesión', 'info');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Panel de Administración</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/products/new" className="btn btn-primary">
            Agregar Producto
          </Link>
          <button 
            className="btn btn-danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'productos' ? ' active' : ''}`}
            onClick={() => setActiveTab('productos')}
          >
            Productos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'galeria' ? ' active' : ''}`}
            onClick={() => setActiveTab('galeria')}
          >
            Galería
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'pedidos' ? ' active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            Pedidos
          </button>
        </li>
      </ul>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos' && (
        <>
          {/* Selector de cantidad y paginación */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <label className="me-2">Mostrar:</label>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-select d-inline-block w-auto"
              >
                {[5, 10, 20, 50].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span className="ms-2">productos por página</span>
            </div>
            <div>
              Página {currentPage} de {totalPages}
              <button
                className="btn btn-sm btn-secondary ms-2"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <button
                className="btn btn-sm btn-secondary ms-2"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar productos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      <img 
                        src={product.image} 
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.description.substring(0, 50)}...</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                        {product.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/admin/products/edit/${product._id}`}
                        className="btn btn-sm btn-warning me-2"
                      >
                        Editar
                      </Link>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product._id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {activeTab === 'galeria' && (
        <GalleryAdmin />
      )}
      {activeTab === 'pedidos' && (
        <OrdersAdmin />
      )}
    </div>
  );
};

export default AdminDashboard; 