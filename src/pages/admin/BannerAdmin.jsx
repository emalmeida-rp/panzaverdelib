import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import styles from './AdminDashboard.module.scss';
import { FaPlus, FaEdit, FaTrash, FaImages, FaLink, FaFileAlt, FaArrowUp, FaArrowDown, FaSortNumericDown } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BannerAdmin = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({ 
    title: '', 
    imageUrl: '', 
    link: '', 
    description: '',
    isActive: true,
    order: 0
  });
  const [editingBanner, setEditingBanner] = useState(null);

  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const response = await fetchWithAuth('/banners');
      if (!response.ok) throw new Error('Error al obtener banners');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (bannerData) => {
      const response = await fetchWithAuth('/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      if (!response.ok) throw new Error('Error al crear banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['banners']);
      showAlert('Banner creado exitosamente', 'success');
      handleReset();
    },
    onError: (error) => {
      showAlert(`Error al crear banner: ${error.message}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (bannerData) => {
      const response = await fetchWithAuth(`/banners/${editingBanner._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      if (!response.ok) throw new Error('Error al actualizar banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['banners']);
      showAlert('Banner actualizado exitosamente', 'success');
      handleReset();
    },
    onError: (error) => {
      showAlert(`Error al actualizar banner: ${error.message}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetchWithAuth(`/banners/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['banners']);
      showAlert('Banner eliminado exitosamente', 'success');
    },
    onError: (error) => {
      showAlert(`Error al eliminar banner: ${error.message}`, 'error');
    }
  });

  useEffect(() => {
    if (editingBanner) {
      setFormData({
        title: editingBanner.title || '',
        imageUrl: editingBanner.imageUrl || editingBanner.image || '', // Mapear tanto imageUrl como image
        link: editingBanner.link || '',
        description: editingBanner.description || editingBanner.message || '', // Mapear description y message
        isActive: editingBanner.isActive !== false && editingBanner.active !== false, // Mapear isActive y active
        order: editingBanner.order || 0
      });
    }
  }, [editingBanner]);

  const handleEdit = (banner) => {
    setEditingBanner(banner);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este banner?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleReset = () => {
    setEditingBanner(null);
    setFormData({ 
      title: '', 
      imageUrl: '', 
      link: '', 
      description: '',
      isActive: true,
      order: banners.length // Siguiente orden disponible
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showAlert('El título es requerido', 'error');
      return;
    }
    
    if (!formData.imageUrl.trim()) {
      showAlert('La URL de la imagen es requerida', 'error');
      return;
    }

    // Mapear los datos del formulario al formato del backend
    const backendData = {
      title: formData.title,
      image: formData.imageUrl, // El backend espera 'image' no 'imageUrl'
      link: formData.link,
      message: formData.description, // El backend espera 'message' no 'description'
      active: formData.isActive, // El backend espera 'active' no 'isActive'
      order: formData.order
    };

    if (editingBanner) {
      updateMutation.mutate(backendData);
    } else {
      createMutation.mutate(backendData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getImageUrl = (imageUrl) => {
    // Función para obtener la URL de imagen correcta desde el objeto banner
    const getImageFromBanner = (banner) => {
      return banner?.imageUrl || banner?.image || '';
    };
    
    // Si es un objeto banner completo, extraer la URL
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      imageUrl = getImageFromBanner(imageUrl);
    }
    
    if (!imageUrl) return '/placeholder.webp';
    
    // Si ya es una URL completa, usarla directamente
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Si es una imagen local del proyecto (del public o src/assets)
    if (imageUrl.startsWith('/') || imageUrl.includes('public/') || imageUrl.includes('assets/')) {
      // Para imágenes en public folder (accesibles directamente)
      if (imageUrl.startsWith('/public/')) {
        return imageUrl.replace('/public', '');
      }
      // Para imágenes que ya empiezan con / (ruta absoluta del public)
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      // Para imágenes en assets o rutas relativas
      return `/${imageUrl}`;
    }
    
    // Si es una URL del servidor backend (para uploads)
    if (API_URL && !imageUrl.startsWith('/')) {
      return `${API_URL}/${imageUrl}`;
    }
    
    // Fallback: intentar como ruta local primero
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  // Función mejorada para manejar errores de imagen con múltiples fallbacks
  const handleImageError = (e, originalUrl) => {
    if (e.target.getAttribute('data-fallback-attempted')) {
      // Si ya intentamos fallbacks, usar placeholder final
      e.target.src = '/placeholder.webp';
      return;
    }

    // Marcar que estamos intentando fallbacks
    e.target.setAttribute('data-fallback-attempted', 'true');
    
    // Intentar diferentes estrategias de fallback
    const fallbackUrls = [];
    
    // Si la URL original no empieza con /, probar agregándola
    if (!originalUrl.startsWith('/') && !originalUrl.startsWith('http')) {
      fallbackUrls.push(`/${originalUrl}`);
    }
    
    // Si es una URL local, probar en la carpeta img del public
    if (!originalUrl.startsWith('http')) {
      fallbackUrls.push(`/img/${originalUrl.replace(/^\/+/, '')}`);
      fallbackUrls.push(`/public/img/${originalUrl.replace(/^\/+/, '')}`);
    }
    
    // Si hay un API_URL configurado, probar esas rutas
    if (API_URL) {
      fallbackUrls.push(`${API_URL}${originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl}`);
      fallbackUrls.push(`${API_URL}/uploads/${originalUrl.replace(/^\/+/, '')}`);
    }
    
    // Probar el primer fallback disponible
    if (fallbackUrls.length > 0) {
      e.target.src = fallbackUrls[0];
      
      // Si este también falla, probar el siguiente
      e.target.onerror = () => {
        const nextFallback = fallbackUrls[1];
        if (nextFallback) {
          e.target.src = nextFallback;
          e.target.onerror = () => {
            e.target.src = '/placeholder.webp';
          };
        } else {
          e.target.src = '/placeholder.webp';
        }
      };
    } else {
      e.target.src = '/placeholder.webp';
    }
  };

  // Función para reordenar banners
  const reorderMutation = useMutation({
    mutationFn: async ({ bannerId, newOrder }) => {
      const response = await fetchWithAuth(`/banners/${bannerId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      if (!response.ok) throw new Error('Error al reordenar banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['banners']);
      showAlert('Banner reordenado exitosamente', 'success');
    },
    onError: (error) => {
      showAlert(`Error al reordenar: ${error.message}`, 'error');
    }
  });

  const handleReorder = (bannerId, direction) => {
    const currentBanner = banners.find(b => b._id === bannerId);
    const currentOrder = currentBanner?.order || 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    if (newOrder < 0 || newOrder >= banners.length) return;
    
    reorderMutation.mutate({ bannerId, newOrder });
  };

  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando banners...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger" role="alert">
      Error al cargar banners: {error.message}
    </div>
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          <FaImages className="me-2" />
          {editingBanner ? 'Editando Banner' : 'Administrar Banners del Carrusel'}
        </h2>
        {editingBanner && (
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleReset}
          >
            <FaPlus /> Nuevo Banner
          </button>
        )}
      </div>

      <div className={styles.contentCard} style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                <FaFileAlt className="me-1" />
                Título del Banner *
              </label>
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="Ej: Oferta Especial de Verano"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">
                <FaImages className="me-1" />
                URL de la Imagen *
              </label>
              <input
                type="url"
                name="imageUrl"
                className="form-control"
                placeholder="https://ejemplo.com/imagen.jpg o /uploads/banner.jpg"
                value={formData.imageUrl}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">
                <FaLink className="me-1" />
                Enlace (Opcional)
              </label>
              <input
                type="url"
                name="link"
                className="form-control"
                placeholder="https://ejemplo.com/pagina-destino"
                value={formData.link}
                onChange={handleInputChange}
              />
            </div>
            
                         <div className="col-md-3">
               <label className="form-label">
                 <FaSortNumericDown className="me-1" />
                 Orden
               </label>
               <input
                 type="number"
                 name="order"
                 className="form-control"
                 placeholder="0"
                 value={formData.order}
                 onChange={handleInputChange}
                 min="0"
               />
               <small className="form-text text-muted">
                 Orden de aparición en el carrusel
               </small>
             </div>
             
             <div className="col-md-3">
               <label className="form-label">Estado</label>
               <div className="form-check">
                 <input
                   type="checkbox"
                   name="isActive"
                   className="form-check-input"
                   id="isActive"
                   checked={formData.isActive}
                   onChange={handleInputChange}
                 />
                 <label className="form-check-label" htmlFor="isActive">
                   Banner Activo
                 </label>
               </div>
             </div>
            
            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btnPrimary} w-100`}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingBanner ? <><FaEdit /> Actualizar</> : <><FaPlus /> Agregar</>}
              </button>
            </div>
          </div>
          
          <div className="row mt-3">
            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                placeholder="Descripción del banner (opcional)"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {formData.imageUrl && (
            <div className="row mt-3">
              <div className="col-12">
                <label className="form-label">Vista Previa:</label>
                <div className="text-center">
                                      <img 
                      src={getImageUrl(formData.imageUrl)}
                      alt="Vista previa"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #dee2e6'
                      }}
                      onError={(e) => handleImageError(e, formData.imageUrl)}
                    />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className={styles.contentCard}>
        <h4 className="mb-3">Banners Existentes</h4>
        
        {banners.length === 0 ? (
          <div className="text-center py-4">
            <FaImages size={48} className="text-muted mb-3" />
            <p className="text-muted">No hay banners registrados. ¡Crea tu primer banner!</p>
          </div>
        ) : (
          <div className="row">
            {banners
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((banner, index) => (
              <div className="col-md-6 col-lg-4 mb-4" key={banner._id}>
                <div className={`card h-100 position-relative ${styles.bannerCard}`}>
                  {/* Badge de orden y controles de reordenamiento */}
                  <div className={`position-absolute top-0 start-0 m-2 ${styles.zIndex2}`}>
                    <span className="badge bg-primary">#{banner.order || 0}</span>
                  </div>
                  <div className={`position-absolute top-0 end-0 m-2 ${styles.zIndex2}`}>
                    <div className="btn-group-vertical" role="group">
                      <button
                        className="btn btn-sm btn-light opacity-75"
                        onClick={() => handleReorder(banner._id, 'up')}
                        disabled={index === 0 || reorderMutation.isLoading}
                        title="Mover arriba"
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        className="btn btn-sm btn-light opacity-75"
                        onClick={() => handleReorder(banner._id, 'down')}
                        disabled={index === banners.length - 1 || reorderMutation.isLoading}
                        title="Mover abajo"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </div>
                  
                  {/* Imagen del banner */}
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <img 
                      src={getImageUrl(banner.imageUrl || banner.image)}
                      alt={banner.title}
                      className="card-img-top"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => handleImageError(e, banner.imageUrl || banner.image)}
                      data-original-url={banner.imageUrl || banner.image}
                    />
                  </div>
                  
                  {/* Contenido del card */}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{banner.title}</h5>
                    
                    {(banner.description || banner.message) && (
                      <p className="card-text text-muted small flex-grow-1">
                        {((banner.description || banner.message) || '').length > 100 
                          ? `${(banner.description || banner.message).substring(0, 100)}...` 
                          : (banner.description || banner.message)
                        }
                      </p>
                    )}
                    
                    {banner.link && (
                      <a 
                        href={banner.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm mb-2 text-decoration-none"
                      >
                        <FaLink className="me-1" /> Ver enlace
                      </a>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className={`badge ${(banner.isActive !== false && banner.active !== false) ? 'bg-success' : 'bg-secondary'}`}>
                        {(banner.isActive !== false && banner.active !== false) ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="btn-group">
                        <button 
                          onClick={() => handleEdit(banner)} 
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          title="Editar banner"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(banner._id)}
                          title="Eliminar banner"
                          disabled={deleteMutation.isLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BannerAdmin; 