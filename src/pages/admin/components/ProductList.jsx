import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../../utils/api';
import { useAlert } from '../../../context/AlertContext';
import styles from '../AdminDashboard.module.scss';
import ProductEditModal from '../ProductEditModal';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const ProductList = ({ searchTerm = '', onSearchTermChange }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { showAlert } = useAlert();



  // Sincronizar con el searchTerm del padre
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Limpiar estado cuando se cierre el modal
  useEffect(() => {
    if (!showEditModal) {
      setSelectedProduct(null);
    }
  }, [showEditModal]);



  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetchWithAuth('/products');
      if (!response.ok) throw new Error('Error al cargar los productos');
      return response.json();
    }
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetchWithAuth('/categories');
      if (!response.ok) throw new Error('Error al cargar las categorías');
      return response.json();
    }
  });

  const handleSearchChange = (value) => {
    setLocalSearchTerm(value);
    if (onSearchTermChange) {
      onSearchTermChange(value);
    }
    setCurrentPage(1); // Reset pagination when searching
  };

  const getCategoryName = (catId) => {
    const category = categoriesData.find(c => c._id === catId);
    return category ? category.name : 'Sin categoría';
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowEditModal(true);
  };

  const handleSuccess = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    refetch();
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (productId) => {
    // Configuración segura para SweetAlert2
    const safeSwalConfig = {
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
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

    const result = await Swal.fire(safeSwalConfig);

    if (result.isConfirmed) {
      try {
        await fetchWithAuth(`/products/${productId}`, { method: 'DELETE' });
        showAlert('Producto eliminado con éxito', 'success');
        refetch();
      } catch (err) {
        showAlert('Error al eliminar el producto', 'error');
      }
    }
  };

  const filteredProducts = productsData?.filter(product =>
    product.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(localSearchTerm.toLowerCase())
  ) || [];

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (isLoading) return <div>Cargando productos...</div>;
  if (error) return <div className="alert alert-danger">Error: {error.message}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Gestión de Productos</h2>
        <div className={styles.headerActions}>
          <button className="btn btn-success" onClick={handleCreate}>
            <FaPlus /> Nuevo Producto
          </button>
        </div>
      </div>
      
      <div className={styles.card}>
        {/* Barra de búsqueda y filtros */}
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar productos..."
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        {/* Mostrar filtro activo si hay searchTerm */}
        {localSearchTerm && (
          <div className="alert alert-info mb-4 d-flex justify-content-between align-items-center">
            <span>Filtrando por: "<strong>{localSearchTerm}</strong>"</span>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleSearchChange('')}
            >
              Limpiar filtro
            </button>
          </div>
        )}
        
        {/* Vista de Tabla para Escritorio */}
        <div className={styles.responsiveTableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => {
                // Resaltar producto si coincide exactamente con la búsqueda
                const isHighlighted = localSearchTerm && 
                  product.name.toLowerCase().includes(localSearchTerm.toLowerCase());
                
                return (
                  <tr 
                    key={product._id} 
                    className={isHighlighted ? 'table-success' : ''}
                    style={isHighlighted ? { backgroundColor: '#d1edff !important' } : {}}
                  >
                    <td><img src={product.image} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /></td>
                    <td>
                      <strong className={isHighlighted ? 'text-primary' : ''}>
                        {product.name}
                      </strong>
                    </td>
                    <td>{getCategoryName(product.category)}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                        {product.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btn + ' ' + styles.btnPrimary} onClick={() => handleEdit(product)}><FaEdit /></button>
                        <button className={styles.btn + ' ' + styles.btnDanger} onClick={() => handleDelete(product._id)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas para Móvil */}
        <div className={styles.cardList}>
          {paginatedProducts.map(product => {
            const isHighlighted = localSearchTerm && 
              product.name.toLowerCase().includes(localSearchTerm.toLowerCase());
              
            return (
              <div 
                className={`${styles.cardItem} ${isHighlighted ? 'border-primary bg-light' : ''}`} 
                key={product._id}
              >
                <div className={styles.cardItemHeader}>
                  <span className={isHighlighted ? 'text-primary fw-bold' : ''}>
                    {product.name}
                  </span>
                  <span>${product.price.toFixed(2)}</span>
                </div>
                <div className={styles.cardItemContent}>
                  <p><strong>Stock:</strong> {product.stock}</p>
                  <p><strong>Categoría:</strong> {getCategoryName(product.category)}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`badge ${product.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                      {product.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </p>
                </div>
                <div className={styles.actionButtons}>
                  <button className={styles.btn + ' ' + styles.btnPrimary} onClick={() => handleEdit(product)}><FaEdit /> Editar</button>
                  <button className={styles.btn + ' ' + styles.btnDanger} onClick={() => handleDelete(product._id)}><FaTrash /></button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Paginación */}
        <div className={styles.pagination}>
          <p>
            Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
            {localSearchTerm && ` (filtrados de ${productsData?.length || 0} total)`}
          </p>
          <div>
            <button className={styles.button} onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Anterior</button>
            <button className={styles.button} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Siguiente</button>
          </div>
        </div>
      </div>

      <ProductEditModal
        show={showEditModal}
        onHide={handleCloseModal}
        product={selectedProduct}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ProductList; 