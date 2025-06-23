import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchWithAuth } from '../utils/api';
import { useCampaigns } from '../hooks/useCampaigns';
import ProductDetailModal from './ProductDetailModal';
import { useQuery } from '@tanstack/react-query';
import styles from './ItemListContainer.module.scss';

// Los efectos visuales se aplican mediante clases CSS

const ItemListContainer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const location = useLocation();

  const { 
    activeCampaigns, 
    getProductInfo, 
    hasDiscount, 
    getDiscountBadge,
    getCampaign,
    loading: campaignsLoading,
    error: campaignsError
  } = useCampaigns();

  // Obtener el ID del producto y la categoría de la URL
  const productId = searchParams.get('product');
  const categoryParam = searchParams.get('category');

  // React Query para categorías
  const { data: categories = [], isLoading: catLoading, error: catError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetchWithAuth('/categories');
      if (!res.ok) throw new Error('Error al cargar categorías');
      return res.json();
    },
    refetchInterval: 300000 // refresca cada 5 minutos
  });

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Sincronizo selectedCategory con la URL
  useEffect(() => {
    setSelectedCategory(categoryParam || '');
  }, [categoryParam, location.key]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetchWithAuth('/products');
        const productsData = await productsRes.json();
        
        setProducts(productsData);
        
        if (productId) {
          const product = productsData.find(p => p._id === productId);
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

    fetchData();
  }, [productId]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (searchTerm && filteredProducts.length === 0) {
      setShowNoResults(true);
    } else {
      setShowNoResults(false);
    }
  }, [searchTerm, filteredProducts]);

  const handleAddToCart = (product) => {
    const productInfo = getProductInfo(product);
    
    // Agregar al carrito con el precio final (con descuento si aplica)
    const productWithPrice = {
      ...product,
      price: productInfo?.finalPrice || product.price
    };
    
    setSelectedProduct(productWithPrice);
    setSearchParams({ product: product._id });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSearchParams({});
  };

  const handleShare = (product, platform) => {
    const url = `${window.location.origin}/productos?product=${product._id}`;
    const text = `¡Mira este producto en Librería Panza Verde: ${product.name}!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
        break;
      default:
        break;
    }
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
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
        <div className={styles.searchBarContainer} data-aos="fade-up">
          <div className={styles.searchInputGroup}>
            <i className={`bi bi-search ${styles.searchIcon}`}></i>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar productos por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className={styles.clearButton}
                onClick={() => setSearchTerm('')}
                type="button"
                aria-label="Limpiar búsqueda"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          </div>
          
          {/* Filtros de categoría */}
          <div className={styles.categoryFilterBar}>
            <button className={`${styles.categoryFilterBtn} ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory(null)}>
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`${styles.categoryFilterBtn} ${selectedCategory === cat._id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat._id)}
              >
                {cat.icon ? (
                  cat.icon.startsWith('bi-') ? (
                    <i className={`bi ${cat.icon} me-1`}></i>
                  ) : (
                    <span className="me-1">{cat.icon}</span>
                  )
                ) : null}
                {cat.name}
              </button>
            ))}
          </div>

          {showNoResults && (
            <div className="alert alert-info mt-3 text-center" role="alert" data-aos="fade-up">
              <i className="bi bi-emoji-frown me-2"></i>
              No se encontraron productos que coincidan con tu búsqueda
            </div>
          )}

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
          {filteredProducts.map((product, idx) => {
            const productInfo = getProductInfo(product);
            const campaign = getCampaign(product);
            
            const effect = campaign?.visualEffect;
            const color = campaign?.color || '#e67e22';
            const getEffectStyles = () => {
              if (!campaign || !effect) return {};
              
              switch (effect) {
                case 'pulse':
                  return { animation: 'pulse 2s infinite' };
                case 'glow':
                  return { boxShadow: `0 0 20px ${color}40` };
                case 'bounce':
                  return { cursor: 'pointer' };
                default:
                  return {};
              }
            };
            
            const effectStyles = getEffectStyles();

            return (
              <div className="col" key={product._id} data-aos="fade-up" data-aos-delay={idx * 50}>
                <div
                  className={`card h-100 bg-light card-products ${campaign ? 'campaign-card' : ''} ${campaign && effect ? `effect-${effect}` : ''}`}
                  style={{
                    position: 'relative',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '--campaign-color': color || '#e67e22',
                     ...(campaign && effect === 'pulse' ? { 
                       animation: 'pulse 2s infinite ease-in-out',
                       transform: 'scale(1.01)',
                       boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                     } : {}),
                     ...(campaign && effect === 'glow' ? {
                       boxShadow: `0 0 25px ${color}66`,
                       border: `2px solid ${color}88`
                     } : {}),
                     ...(campaign && effect === 'firework' ? {
                       animation: 'fireworkPulse 3s infinite ease-in-out',
                       position: 'relative',
                       boxShadow: '0 12px 35px rgba(255,215,0,0.4)'
                     } : {}),
                    ...effectStyles
                  }}
                  data-campaign={campaign?.name || 'none'}
                  data-effect={effect || 'none'}
                  data-has-campaign={!!campaign}
                  onMouseEnter={effect === 'bounce' ? (e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                  } : undefined}
                  onMouseLeave={effect === 'bounce' ? (e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  } : undefined}
                >
                  {productInfo?.hasDiscount && (
                    <div
                      className={`campaign-badge ${effect ? `effect-${effect}` : 'effect-badge'} themed`}
                      style={{ 
                        background: color,
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 2,
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getDiscountBadge(product)}
                    </div>
                  )}
                  
                  {effect === 'firework' && (
                    <div className="campaign-particles"></div>
                  )}
                  <div className="product-image-container">
                    <img src={product.image} className="card-img-top img-fluid img-thumbnail img-market" alt={product.name} />
                  </div>
                  <div className="card-header text-center">
                    <h3 className="h5 mb-0">{product.name}</h3>
                  </div>
                  <div className="card-body text-center">
                    <div className="mb-3">
                      <h4 className="card-text price mb-0" style={{ color: '#218838', fontWeight: 600 }}>
                        ${productInfo?.finalPrice?.toFixed(2) || product.price.toFixed(2)}
                        {productInfo?.hasDiscount && (
                          <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9rem', marginLeft: 8 }}>
                            ${productInfo.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </h4>
                      {productInfo?.hasDiscount && productInfo.savings > 0 && (
                        <small className="text-warning" style={{ fontWeight: 500 }}>
                          ¡Ahorra ${productInfo.savings.toFixed(2)}!
                        </small>
                      )}
                    </div>
                    <button 
                      className={`btn w-100 ${product.isAvailable && product.stock > 0 ? 'btn-secondary' : 'btn-danger'}`}
                      onClick={() => handleOpenModal(product)}
                      disabled={!product.isAvailable || product.stock <= 0}
                    >
                      {product.isAvailable && product.stock > 0 ? 'Agregar al carrito' : 'No disponible'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProductDetailModal 
        show={!!selectedProduct}
        onHide={handleCloseModal}
        product={selectedProduct}
        onShare={handleShare}
        campaigns={activeCampaigns}
      />
    </div>
  );
};

export default ItemListContainer; 