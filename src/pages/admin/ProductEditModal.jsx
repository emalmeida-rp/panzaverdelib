import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import styles from './AdminDashboard.module.scss';
import axios from 'axios';

const ProductEditModal = ({ show, onHide, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    isAvailable: true,
    category: '',
    image: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const CLOUDINARY_UPLOAD_PRESET = 'upload_lpv';
  const CLOUDINARY_CLOUD_NAME = 'libpanzaverdearcloudinary';

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        isAvailable: product.isAvailable,
        category: product.category,
        image: product.image
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        isAvailable: true,
        category: '',
        image: ''
      });
    }
  }, [product]);

  useEffect(() => {
    if (!show) {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        isAvailable: true,
        category: '',
        image: ''
      });
    }
  }, [show]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth('/categories');
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        showAlert('Error al cargar categorías', 'error');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      setFormData(prev => ({ ...prev, image: res.data.secure_url }));
    } catch (err) {
      showAlert('Error al subir la imagen a Cloudinary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const img = formData.image.trim();
      if (!img.match(/^(https?:\/\/|\/|\.\/)/)) {
        showAlert('La imagen debe ser una URL válida o una ruta local que comience con / o ./', 'error');
        setLoading(false);
        return;
      }
      const isEditing = !!(product && product._id);
      const endpoint = isEditing ? `/products/${product._id}` : '/products';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetchWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock)
        })
      });
      if (!response.ok) throw new Error(isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto');
      const updatedProduct = await response.json();
      showAlert(isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
      onSuccess(updatedProduct);
      onHide();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal style={{ top: '3rem' }} show={show} onHide={onHide} size="lg" dialogClassName="custom-modal-dialog">
      <Modal.Header closeButton>
        <Modal.Title>{product ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className={`form-control ${styles.dashboardInput}`}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Precio</label>
              <input
                type="number"
                className={`form-control ${styles.dashboardInput}`}
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Stock</label>
              <input
                type="number"
                className={`form-control ${styles.dashboardInput}`}
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Categoría</label>
              <select
                className={`form-select ${styles.dashboardSelect}`}
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                className={`form-control ${styles.dashboardInput}`}
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Imagen</label>
              <div className="mb-2">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  style={{ maxWidth: 300 }}
                  onChange={handleFileChange}
                  tabIndex={-1}
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  className={`form-control ${styles.dashboardInput}`}
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  placeholder="URL o ruta local de la imagen"
                />
              </div>
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  id="isAvailable"
                />
                <label className="form-check-label" htmlFor="isAvailable">
                  Producto disponible
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-end gap-2">
            <button
              type="button"
              className={`btn btn-secondary ${styles.dashboardBtn} ${styles.dashboardBtnOutline}`}
              onClick={onHide}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${styles.dashboardBtn} ${styles.dashboardBtnPrimary}`}
              disabled={loading}
            >
              {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ProductEditModal; 