import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useCart } from '../context/CartContext';
import { fetchWithAuth } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

const ItemListContainer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetchWithAuth('/products');
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
                  <h4 className="card-text price">${product.price}</h4>
                  <p className="card-text description">{product.description}</p>
                  <button 
                    className={`btn w-100 ${product.isAvailable && product.stock > 0 ? 'btn-secondary' : 'btn-danger'}`}
                    onClick={() => addToCart(product)}
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
      <style jsx>{`
        .search-container {
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .search-input {
          border: none;
          padding: 12px;
          font-size: 1.1rem;
        }
        .search-input:focus {
          box-shadow: none;
          border-color: #ced4da;
        }
        .search-icon {
          background-color: white;
          border: none;
          padding: 12px 15px;
        }
        .clear-search {
          border: none;
          padding: 12px 15px;
          background-color: white;
        }
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .product-image-container {
          height: 200px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
        }
        .product-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-image-container img {
          transform: scale(1.05);
        }
        .price {
          color: #28a745;
          font-weight: bold;
          font-size: 1.25rem;
        }
        .description {
          color: #6c757d;
          font-size: 0.9rem;
          min-height: 40px;
        }
      `}</style>
    </div>
  );
};

export default ItemListContainer; 