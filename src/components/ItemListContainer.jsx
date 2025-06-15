import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchWithAuth } from '../utils/api';
import ProductDetailModal from './ProductDetailModal';
import { useQuery } from '@tanstack/react-query';
import styles from './ItemListContainer.module.scss';
import 'animate.css';
import { motion } from 'framer-motion';

const shineVariants = {
  initial: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  hover: {
    boxShadow: '0 8px 32px rgba(41,128,185,0.18)',
    transition: { duration: 0.3 },
  },
};

const bounceVariants = {
  initial: { y: 0 },
  hover: {
    y: -10,
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },
};

const pulseVariants = {
  initial: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  animate: {
    boxShadow: [
      '0 4px 12px rgba(0,0,0,0.08)',
      '0 0 32px 4px #ffe066',
      '0 4px 12px rgba(0,0,0,0.08)'
    ],
    transition: { duration: 1.5, repeat: Infinity, repeatType: 'loop' },
  },
};

const badgePulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.15, 1],
    transition: { duration: 1, repeat: Infinity, repeatType: 'loop' },
  },
};

// Glow: borde resplandeciente
const glowVariants = {
  initial: { boxShadow: '0 0 0 0px #ffe066' },
  animate: {
    boxShadow: [
      '0 0 0 0px #ffe066',
      '0 0 16px 4px #ffe066',
      '0 0 0 0px #ffe066'
    ],
    transition: { duration: 1.5, repeat: Infinity, repeatType: 'loop' },
  },
};

// Floating: movimiento suave
const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [0, -8, 0, 8, 0],
    transition: { duration: 2.5, repeat: Infinity, repeatType: 'loop' },
  },
};

// Fade: aparición/desaparición
const fadeVariants = {
  initial: { opacity: 0.7 },
  animate: { opacity: [0.7, 1, 0.7], transition: { duration: 2, repeat: Infinity, repeatType: 'loop' } },
};

// Sombra dinámica
const shadowVariants = {
  initial: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  animate: {
    boxShadow: [
      '0 4px 12px rgba(0,0,0,0.08)',
      '0 8px 32px rgba(41,128,185,0.18)',
      '0 4px 12px rgba(0,0,0,0.08)'
    ],
    transition: { duration: 1.5, repeat: Infinity, repeatType: 'loop' },
  },
};

// Badge wave
const badgeWaveVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 8, -8, 0],
    transition: { duration: 1.2, repeat: Infinity, repeatType: 'loop' },
  },
};

const ItemListContainer = () => {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const location = useLocation();

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
        // Cargar productos y ofertas en paralelo
        const [productsRes, offersRes] = await Promise.all([
          fetchWithAuth('/products'),
          fetchWithAuth('/campaigns/offers')
        ]);
        
        const productsData = await productsRes.json();
        const offersData = await offersRes.json();
        
        setProducts(productsData);
        setOffers(offersData);
        
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

  // Función para obtener la campaña de un producto
  const getProductCampaign = (productId) => {
    return offers.find(offer => offer._id === productId)?.campaign;
  };

  // Función para calcular el precio final y ahorro
  const calculatePrice = (product) => {
    const campaign = getProductCampaign(product._id);
    if (!campaign) return { finalPrice: product.price, ahorro: 0 };

    let finalPrice = product.price;
    let ahorro = 0;

    if (campaign.discountType === 'percent') {
      finalPrice = product.price * (1 - campaign.discountValue / 100);
      ahorro = product.price - finalPrice;
    } else if (campaign.discountType === 'fixed') {
      finalPrice = Math.max(0, product.price - campaign.discountValue);
      ahorro = product.price - finalPrice;
    }

    return { finalPrice, ahorro };
  };

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
    const campaign = getProductCampaign(product._id);
    const { finalPrice } = calculatePrice(product);
    
    // Agregar al carrito con el precio final (con descuento si aplica)
    const productWithPrice = {
      ...product,
      price: finalPrice
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

  // Crear array de campañas activas a partir de offers
  const activeCampaigns = offers
    .map(offer => offer.campaign)
    .filter((c, idx, arr) => c && arr.findIndex(x => x._id === c._id) === idx);

  const handleOpenModal = (product) => {
    // Buscar si el producto está en offers (tiene campaña)
    const offerProduct = offers.find(o => o._id === product._id);
    setSelectedProduct(offerProduct || product);
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
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
          {filteredProducts.map((product, idx) => {
            const campaign = getProductCampaign(product._id);
            const { finalPrice, ahorro } = calculatePrice(product);
            const effect = campaign?.visualEffect;
            const color = campaign?.color || '#e67e22';

            // Elegir variantes de animación según el efecto
            let cardVariants = {};
            let cardInitial = 'initial';
            let cardAnimate = undefined;
            let cardWhileHover = undefined;

            if (effect === 'shine') {
              cardVariants = shineVariants;
              cardWhileHover = 'hover';
            } else if (effect === 'bounce') {
              cardVariants = bounceVariants;
              cardWhileHover = 'hover';
            } else if (effect === 'pulse') {
              cardVariants = pulseVariants;
              cardAnimate = 'animate';
            } else if (effect === 'glow') {
              cardVariants = glowVariants;
              cardAnimate = 'animate';
            } else if (effect === 'floating') {
              cardVariants = floatingVariants;
              cardAnimate = 'animate';
            } else if (effect === 'fade') {
              cardVariants = fadeVariants;
              cardAnimate = 'animate';
            } else if (effect === 'shadow') {
              cardVariants = shadowVariants;
              cardAnimate = 'animate';
            }

            return (
              <div className="col" key={product._id} data-aos="fade-up" data-aos-delay={idx * 50}>
                <motion.div
                  className={`card h-100 bg-light card-products product-card`}
                  variants={cardVariants}
                  initial={cardInitial}
                  animate={cardAnimate}
                  whileHover={cardWhileHover}
                  style={{
                    position: 'relative',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {campaign && (
                    <motion.div
                      className={styles.offerBadge}
                      style={{
                        background: color,
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 2,
                      }}
                      variants={
                        effect === 'badge' ? badgePulseVariants :
                        effect === 'wave' ? badgeWaveVariants : undefined
                      }
                      initial="initial"
                      animate={
                        effect === 'badge' || effect === 'wave' ? 'animate' : undefined
                      }
                    >
                      {campaign.discountType === 'percent'
                        ? `-${campaign.discountValue}% OFF`
                        : `-$${campaign.discountValue} OFF`}
                    </motion.div>
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
                        ${finalPrice.toFixed(2)}
                        {campaign && (
                          <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9rem', marginLeft: 8 }}>
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </h4>
                      {campaign && ahorro > 0 && (
                        <small className="text-warning" style={{ fontWeight: 500 }}>
                          ¡Ahorra ${ahorro.toFixed(2)}!
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
                  {effect === 'firework' && (
                    <span className={styles.fireworkEffect}></span>
                  )}
                </motion.div>
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