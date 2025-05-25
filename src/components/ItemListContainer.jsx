import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useCart } from '../context/CartContext';
import { fetchWithAuth } from '../utils/api';
import ProductDetailModal from './ProductDetailModal';
import './ItemListContainer.css';

const API_URL = import.meta.env.VITE_API_URL;

const ItemListContainer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  // Obtener el ID del producto de la URL
  const productId = searchParams.get('product');

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetchWithAuth('/products');
        const data = await response.json();
        setProducts(data);
        
        // Si hay un ID en la URL, buscar y mostrar ese producto
        if (productId) {
          const product = data.find(p => p._id === productId);
          if (product) {
            setSelectedProduct(product);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productId]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchTerm && filteredProducts.length === 0) {
      setShowNoResults(true);
    } else {
      setShowNoResults(false);
    }
  }, [searchTerm, filteredProducts]);

  const handleAddToCart = (product) => {
    setSelectedProduct(product);
    setSearchParams({ product: product._id });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSearchParams({});
  };

  if (loading) return (
    <div className="container mt-4">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
        {[...Array(8)].map((_, idx) => (
          <div className="col" key={idx}>
            <div className="card h-100 bg-light card-products placeholder-glow">
              <div className="card-img-top img-market placeholder" style={{ height: 180, background: '#e0e0e0', borderRadius: 12 }}></div>
              <div className="card-header text-center">
                <h3 className="h5 mb-0 placeholder col-8" style={{ height: 24, background: '#d0d0d0', borderRadius: 6 }}></h3>
              </div>
              <div className="card-body text-center">
                <h4 className="card-text placeholder col-6" style={{ height: 20, background: '#e0e0e0', borderRadius: 6 }}></h4>
                <p className="card-text placeholder col-10" style={{ height: 16, background: '#f0f0f0', borderRadius: 6 }}></p>
                <button className="btn btn-secondary w-100 disabled placeholder col-8" style={{ height: 38, background: '#d0d0d0', borderRadius: 8 }} disabled></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="cart">
      <header className="text-center py-5" data-aos="fade-down">
        <h1>Productos</h1>
        <p className="lead">Desde aquí podrás autogestionar tus compras de artículos de librería o insumos escolares. ¡Ofrecemos distintos medios de pago, facilidad y precios imbatibles!</p>
      </header>
      <div className="container">
        <div className="mb-4" data-aos="fade-up">
          <div className="input-group search-container">
            <span className="input-group-text search-icon">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Buscar productos por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary clear-search" 
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          {showNoResults && (
            <div className="alert alert-info mt-3 text-center" role="alert" data-aos="fade-up">
              <i className="bi bi-emoji-frown me-2"></i>
              No se encontraron productos que coincidan con tu búsqueda
            </div>
          )}
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
          {filteredProducts.map((product, idx) => (
            <div className="col" key={product._id} data-aos="fade-up" data-aos-delay={idx * 50}>
              <div className="card h-100 bg-light card-products product-card">
                <div className="product-image-container">
                  <img src={product.image} className="card-img-top img-fluid img-thumbnail img-market" alt={product.name} />
                </div>
                <div className="card-header text-center">
                  <h3 className="h5 mb-0">{product.name}</h3>
                </div>
                <div className="card-body text-center">
                  <h4 className="card-text price mb-3">${product.price}</h4>
                  <button 
                    className={`btn w-100 ${product.isAvailable && product.stock > 0 ? 'btn-secondary' : 'btn-danger'}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.isAvailable || product.stock <= 0}
                  >
                    {product.isAvailable && product.stock > 0 ? 'Agregar al carrito' : 'No disponible'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProductDetailModal 
        show={!!selectedProduct}
        onHide={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default ItemListContainer; 