import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = 'upload_lpv';
const CLOUDINARY_CLOUD_NAME = 'libpanzaverdearcloudinary';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    stock: '',
    isAvailable: true
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetchWithAuth(`/products/${id}`);
      if (!response.ok) throw new Error('Error al cargar el producto');
      const product = await response.json();
      setFormData({
        ...product,
        price: product.price.toString(),
        stock: product.stock.toString()
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const isValidImage = (url) => {
    return (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/')
    );
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    if (e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let imageUrl = formData.image;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        imageUrl = res.data.secure_url;
      } catch (err) {
        showAlert('Error al subir la imagen a Cloudinary', 'danger');
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    } else if (!isValidImage(imageUrl)) {
      setError('La URL de la imagen debe ser una URL válida o una ruta local que comience con /');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        ...formData,
        image: imageUrl,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      const response = await fetchWithAuth(
        isEditing ? `/products/${id}` : '/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(productData)
        }
      );

      if (!response.ok) throw new Error('Error al guardar el producto');

      showAlert(
        isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
        'success'
      );
      navigate('/belpvsrvadm-ey');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h1>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Descripción</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="price" className="form-label">Precio</label>
          <input
            type="number"
            className="form-control"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">Imagen del producto</label>
          <input
            type="file"
            className="form-control mb-2"
            accept="image/*"
            onChange={handleFileChange}
          />
          <input
            type="text"
            className="form-control"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            disabled={!!file}
            placeholder="URL de la imagen (opcional si subes archivo)"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            type="number"
            className="form-control"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="isAvailable"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isAvailable">
            Disponible
          </label>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || uploading}
          >
            {loading ? 'Guardando...' : uploading ? 'Subiendo imagen...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/belpvsrvadm-ey')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 