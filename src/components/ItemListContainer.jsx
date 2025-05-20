import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useCart } from '../context/CartContext';
import { fetch } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

const ItemListContainer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}api/products`);
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

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="cart">
      <header className="text-center py-5" data-aos="fade-down">
        <h1>Productos</h1>
        <p className="lead">Desde aquí podrás autogestionar tus compras de artículos de librería o insumos escolares. ¡Ofrecemos distintos medios de pago, facilidad y precios imbatibles!</p>
      </header>
      <div className="container">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
          {products.map((product, idx) => (
            <div className="col" key={product._id} data-aos="fade-up" data-aos-delay={idx * 50}>
              <div className="card h-100 bg-light card-products">
                <img src={product.image} className="card-img-top img-fluid img-thumbnail img-market" alt={product.name} />
                <div className="card-header text-center">
                  <h3 className="h5 mb-0">{product.name}</h3>
                </div>
                <div className="card-body text-center">
                  <h4 className="card-text">${product.price}</h4>
                  <p className="card-text">{product.description}</p>
                  <button 
                    className="btn btn-secondary w-100" 
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
    </div>
  );
};

export default ItemListContainer; 