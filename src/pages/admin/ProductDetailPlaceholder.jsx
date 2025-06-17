import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ProductDetailPlaceholder = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError('No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}>Cargando producto...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  if (!product) return <div style={{ padding: 32 }}>Producto no encontrado</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2>Detalle de Producto</h2>
      <img src={product.image} alt={product.name} style={{ maxWidth: 200, marginBottom: 16 }} />
      <h3>{product.name}</h3>
      <p><b>Descripción:</b> {product.description}</p>
      <p><b>Precio:</b> ${product.price}</p>
      <p><b>Stock:</b> {product.stock}</p>
      <p><b>Categoría:</b> {product.category?.name || product.category}</p>
      <p><b>Disponible:</b> {product.isAvailable ? 'Sí' : 'No'}</p>
      {/* Agrega más campos si es necesario */}
    </div>
  );
};

export default ProductDetailPlaceholder; 