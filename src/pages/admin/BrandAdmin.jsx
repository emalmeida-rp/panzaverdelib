import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import styles from './AdminDashboard.module.scss';
import { FaPlus, FaEdit, FaTrash, FaImage, FaTags } from 'react-icons/fa';

const BrandAdmin = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({ name: '', imageUrl: '' });
  const [editingBrand, setEditingBrand] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Función para obtener la URL correcta de la imagen
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/placeholder.webp';
    
    // Si ya es una URL completa, usarla directamente
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Si es una imagen local del proyecto
    if (imageUrl.startsWith('/') || imageUrl.includes('public/') || imageUrl.includes('assets/')) {
      if (imageUrl.startsWith('/public/')) {
        return imageUrl.replace('/public', '');
      }
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      return `/${imageUrl}`;
    }
    
    // Si es una URL del servidor backend
    if (API_URL && !imageUrl.startsWith('/')) {
      return `${API_URL}/${imageUrl}`;
    }
    
    // Fallback
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  // Función para manejar errores de imagen
  const handleImageError = (e, originalUrl) => {
    if (e.target.getAttribute('data-fallback-attempted')) {
      e.target.src = '/placeholder.webp';
      return;
    }

    e.target.setAttribute('data-fallback-attempted', 'true');
    
    const fallbackUrls = [];
    
    if (!originalUrl.startsWith('/') && !originalUrl.startsWith('http')) {
      fallbackUrls.push(`/${originalUrl}`);
    }
    
    if (!originalUrl.startsWith('http')) {
      fallbackUrls.push(`/img/${originalUrl.replace(/^\/+/, '')}`);
    }
    
    if (API_URL) {
      fallbackUrls.push(`${API_URL}${originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl}`);
    }
    
    if (fallbackUrls.length > 0) {
      e.target.src = fallbackUrls[0];
      e.target.onerror = () => {
        const nextFallback = fallbackUrls[1];
        if (nextFallback) {
          e.target.src = nextFallback;
          e.target.onerror = () => e.target.src = '/placeholder.webp';
        } else {
          e.target.src = '/placeholder.webp';
        }
      };
    } else {
      e.target.src = '/placeholder.webp';
    }
  };

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetchWithAuth('/brands').then(res => res.json())
  });

  const mutation = useMutation({
    mutationFn: (brandData) => {
      const url = editingBrand ? `/brands/${editingBrand._id}` : '/brands';
      const method = editingBrand ? 'PUT' : 'POST';
      return fetchWithAuth(url, { method, body: JSON.stringify(brandData), headers: {'Content-Type': 'application/json'} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['brands']);
      showAlert(`Marca ${editingBrand ? 'actualizada' : 'creada'} con éxito`, 'success');
      handleCancelEdit();
    },
    onError: (error) => showAlert(`Error: ${error.message}`, 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchWithAuth(`/brands/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['brands']);
      showAlert('Marca eliminada con éxito', 'success');
    },
    onError: (error) => showAlert(`Error al eliminar: ${error.message}`, 'error')
  });

  useEffect(() => {
    if (editingBrand) {
      setFormData({ 
        name: editingBrand.name, 
        imageUrl: editingBrand.imageUrl || editingBrand.logo || '' // Mapear tanto imageUrl como logo
      });
    } else {
      setFormData({ name: '', imageUrl: '' });
    }
  }, [editingBrand]);

  const handleEdit = (brand) => setEditingBrand(brand);
  const handleCancelEdit = () => setEditingBrand(null);
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro?')) deleteMutation.mutate(id);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Mapear los datos del formulario al formato del backend
    const backendData = {
      name: formData.name,
      logo: formData.imageUrl, // El backend espera 'logo' no 'imageUrl'
      website: formData.website || '',
      description: formData.description || '',
      active: true,
      order: 0
    };
    mutation.mutate(backendData);
  };

  if (isLoading) return <p>Cargando marcas...</p>;

      return (
      <>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>
            <FaTags className="me-2" />
            {editingBrand ? 'Editando Marca' : 'Administrar Marcas'}
          </h2>
          {editingBrand && (
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleCancelEdit}
            >
              <FaPlus /> Nueva Marca
            </button>
          )}
        </div>
      
      <div className={styles.contentCard} style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                <FaImage className="me-1" />
                Nombre de la Marca *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Laprida, BIC, Maped"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                <FaImage className="me-1" />
                URL del Logo *
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://ejemplo.com/logo.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </div>
          </div>
          
          {formData.imageUrl && (
            <div className="row mt-3">
              <div className="col-12">
                <label className="form-label">Vista Previa del Logo:</label>
                <div className="text-center">
                  <img 
                    src={getImageUrl(formData.imageUrl)}
                    alt="Vista previa"
                    style={{
                      maxWidth: '150px',
                      maxHeight: '100px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid #dee2e6',
                      backgroundColor: '#f8f9fa',
                      padding: '10px'
                    }}
                    onError={(e) => handleImageError(e, formData.imageUrl)}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="row mt-3">
            <div className="col-12 d-flex gap-2">
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={mutation.isLoading}
              >
                {editingBrand ? <><FaEdit /> Actualizar</> : <><FaPlus /> Agregar Marca</>}
              </button>
              {editingBrand && (
                <button 
                  type="button" 
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className={styles.contentCard}>
        <h4 className="mb-3">Marcas Existentes</h4>
        
        {brands.length === 0 ? (
          <div className="text-center py-4">
            <FaImage size={48} className="text-muted mb-3" />
            <p className="text-muted">No hay marcas registradas. ¡Agrega tu primera marca!</p>
          </div>
        ) : (
          <div className="row">
            {brands.map(brand => (
              <div key={brand._id} className="col-md-4 col-lg-3 mb-4">
                <div className="card h-100">
                  <div className="card-body text-center d-flex flex-column">
                    <div style={{ height: '80px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={getImageUrl(brand.imageUrl || brand.logo)} 
                        alt={brand.name} 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '80px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => handleImageError(e, brand.imageUrl || brand.logo)}
                        data-original-url={brand.imageUrl || brand.logo}
                      />
                    </div>
                    <h6 className="card-title mb-3">{brand.name}</h6>
                    
                    {brand.description && (
                      <p className="card-text text-muted small mb-3">
                        {brand.description.length > 50 
                          ? `${brand.description.substring(0, 50)}...` 
                          : brand.description
                        }
                      </p>
                    )}
                    
                    {brand.website && (
                      <a 
                        href={brand.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm mb-2"
                      >
                        Ver sitio web
                      </a>
                    )}
                    
                    <div className="mt-auto d-flex justify-content-center gap-2">
                      <button 
                        onClick={() => handleEdit(brand)} 
                        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                        title="Editar marca"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand._id)} 
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                        title="Eliminar marca"
                        disabled={deleteMutation.isLoading}
                      >
                        <FaTrash />
                      </button>
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
  
  export default BrandAdmin; 