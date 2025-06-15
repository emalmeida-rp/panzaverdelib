import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Carousel from 'react-bootstrap/Carousel';
import 'animate.css';
import axios from 'axios';
import styles from './BrandCards.module.scss';
const API_URL = import.meta.env.VITE_API_URL;

const carouselImages = [
  { src: '/img/carousel1.webp', alt: 'daily1', caption: 'Primera diapositiva', desc: 'Estamos trabajando en el contenido!.' },
  { src: '/img/carousel2.webp', alt: 'daily2', caption: 'Segunda diapositiva', desc: 'Estamos trabajando en el contenido!.' },
  { src: '/img/carousel3.webp', alt: 'daily3', caption: 'Tercera diapositiva', desc: 'Estamos trabajando en el contenido.' },
  { src: '/img/carousel4.webp', alt: 'daily4', caption: 'Cuarta diapositiva', desc: 'Estamos trabajando en el contenido.' },
];

const frases = [
  '¡Ofrecemos variedad de insumos escolares al mejor precio!',
  'Fotocopias, impresiones a color/blanco y negro.',
  'Planchas de stickers personalizados, anillados.',
  'Impresiones fotográficas desde la mejor calidad hasta las más económicas.',
  '¡Realiza tu pedido por Whatsapp!',
  'Trabajamos con atención personalizada. ¡Te estamos esperando!'
];

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Animación de frases
  const [fraseIdx, setFraseIdx] = useState(0);
  const [fade, setFade] = useState(true);

  // Estado para marcas
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState(null);

  // Ofertas
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // Banners/Noticias
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/brands`);
        setBrands(data.filter(b => b.active));
      } catch (err) {
        console.error('Error al cargar marcas:', err);
        setBrandsError('Error al cargar marcas');
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/campaigns/offers`);
        setOffers(data);
      } catch (err) {
        setOffers([]);
        console.error('Error al cargar marcas:', err);
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      setBannersLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/banners?active=true`);
        setBanners(data);
      } catch (err) {
        setBanners([]);
      } finally {
        setBannersLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setFade(false), 2000);
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFraseIdx((prev) => (prev + 1) % frases.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="home">
      {/* Mensaje de bienvenida animado */}
      <header className="text-center py-5 animate__animated animate__fadeInDown" data-aos="fade-down">
        <h1 className="display-4 fw-bold mb-3" style={{ color: '#28a745' }}>
          ¡Bienvenido a nuestra tienda online!
        </h1>
        <h2 className="lead animate__animated animate__fadeInLeft animate__delay-1s" style={{ color: '#333' }}>
          Todo lo que necesitás en insumos escolares y de oficina, con atención personalizada.
        </h2>
        {/* Frases animadas en bucle */}
        <div
          style={{
            height: 72,
            maxWidth: 600,
            margin: '0 auto',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'height 0.2s',
          }}
        >
          <span
            className={`d-block mt-3 fs-5 animate__animated ${fade ? 'animate__fadeInRight' : 'animate__fadeOutLeft'}`}
            style={{ color: '#218838', fontWeight: 500, textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal', width: '100%' }}
          >
            {frases[fraseIdx]}
          </span>
        </div>
      </header>

      {/* Noticias y anuncios */}
      <section className="main d-f-column mb-4">
        <div className="alert alert-secondary text-center" role="alert">
          Noticias y anuncios
        </div>

        {/* Carrusel funcional con react-bootstrap */}
        <div className="mb-5 d-flex justify-content-center">
          <Carousel fade interval={3500} style={{ maxWidth: 800, width: '100%' }}>
            {carouselImages.map((img, idx) => (
              <Carousel.Item key={idx}>
                <img
                  className="d-block w-100 img-thumbnail img-carrusel"
                  src={img.src}
                  alt={img.alt}
                  style={{ objectFit: 'contain', height: 600 }}
                />
                <Carousel.Caption>
                  <p>{img.caption}</p>
                  <p>{img.desc}</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Carrusel de productos en oferta */}
      <section className="mb-5">
        <div className="alert alert-warning text-center mb-3" role="alert" style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: 0.5 }}>
          ¡Productos en Oferta!
        </div>
        {offersLoading ? (
          <div className="text-center my-4">Cargando ofertas...</div>
        ) : offers.length === 0 ? (
          <div className="alert alert-info text-center">No hay productos en oferta actualmente.</div>
        ) : (
          <Carousel
            indicators={offers.length > 1}
            controls={offers.length > 1}
            fade
            interval={4200}
            className={styles.offerCarousel}
            style={{ maxWidth: 900, margin: '0 auto', borderRadius: 18, boxShadow: '0 4px 24px rgba(41,128,185,0.10)' }}
          >
            {offers.map((offer, idx) => {
              // Calcular precio final y ahorro
              const price = offer.price;
              let finalPrice = price;
              let ahorro = 0;
              if (offer.campaign.discountType === 'percent') {
                finalPrice = price * (1 - offer.campaign.discountValue / 100);
                ahorro = price - finalPrice;
              } else if (offer.campaign.discountType === 'fixed') {
                finalPrice = Math.max(0, price - offer.campaign.discountValue);
                ahorro = price - finalPrice;
              }
              // Efectos visuales
              const effect = offer.campaign.visualEffect;
              const color = offer.campaign.color || '#e67e22';
              return (
                <Carousel.Item key={offer._id} className={styles.offerCarouselItem}>
                  <div
                    className={
                      styles.offerCard +
                      (effect === 'shine' ? ' animate__animated animate__pulse animate__faster' : '') +
                      (effect === 'bounce' ? ' animate__animated animate__bounce animate__faster' : '') +
                      (effect === 'pulse' ? ' animate__animated animate__heartBeat animate__faster' : '')
                    }
                    style={{
                      background: '#fff',
                      borderRadius: 18,
                      boxShadow: '0 2px 16px rgba(41,128,185,0.10)',
                      padding: 32,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 32,
                      minHeight: 320,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Badge de oferta */}
                    <div
                      className={styles.offerBadge}
                      style={{
                        background: color,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        position: 'absolute',
                        top: 24,
                        left: 24,
                        zIndex: 2,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        borderRadius: 8,
                        padding: '0.5em 1.1em',
                        color: '#fff',
                        letterSpacing: 0.5,
                        animation: effect === 'badge' ? 'pulseBadge 1.2s infinite alternate' : 'none',
                      }}
                    >
                      {offer.campaign.discountType === 'percent'
                        ? `-${offer.campaign.discountValue}% OFF`
                        : `-$${offer.campaign.discountValue} OFF`}
                    </div>
                    {/* Imagen */}
                    <img
                      src={offer.image}
                      alt={offer.name}
                      style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 12, boxShadow: '0 1px 8px rgba(41,128,185,0.08)' }}
                    />
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 700, color: '#2980b9', marginBottom: 8 }}>{offer.name}</h4>
                      <div style={{ fontSize: '1.1rem', color: '#555', marginBottom: 8 }}>{offer.description}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#218838', marginBottom: 6 }}>
                        ${finalPrice.toFixed(2)}
                        <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1rem', marginLeft: 10 }}>
                          ${price.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ color: '#e67e22', fontWeight: 500, fontSize: '1.05rem' }}>
                        ¡Ahorra ${ahorro.toFixed(2)}!
                      </div>
                      {effect === 'firework' && (
                        <span className={styles.fireworkEffect}></span>
                      )}
                    </div>
                  </div>
                </Carousel.Item>
              );
            })}
          </Carousel>
        )}
      </section>

      {/* Carrusel de banners/noticias */}
      <section className="mb-5">
        {bannersLoading ? (
          <div className="text-center my-4">Cargando noticias...</div>
        ) : banners.length === 0 ? (
          <div className="alert alert-info text-center">No hay noticias destacadas actualmente.</div>
        ) : (
          <Carousel
            indicators={banners.length > 1}
            controls={banners.length > 1}
            fade
            interval={6000}
            style={{ maxWidth: 900, margin: '0 auto', borderRadius: 18, boxShadow: '0 4px 24px rgba(41,128,185,0.10)' }}
          >
            {banners.map((banner, idx) => (
              <Carousel.Item key={banner._id}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 32,
                  minHeight: 220,
                  background: '#f8fafc',
                  borderRadius: 18,
                  padding: 32,
                  boxShadow: '0 2px 16px rgba(41,128,185,0.10)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {banner.image && (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 12, boxShadow: '0 1px 8px rgba(41,128,185,0.08)' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 700, color: '#2980b9', marginBottom: 8 }}>{banner.title}</h4>
                    <div style={{ fontSize: '1.1rem', color: '#555', marginBottom: 8 }}>{banner.message}</div>
                    {banner.link && (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" style={{ color: '#e67e22', fontWeight: 600, textDecoration: 'underline' }}>
                        Más información
                      </a>
                    )}
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </section>

      {/* Tarjetas de marcas */}

<aside>
  <div className="alert alert-secondary text-center" role="alert">
    <p className="card-title mb-0">Trabajamos con las siguientes marcas:</p>
  </div>
  {brandsLoading ? (
    <div className="text-center my-4">Cargando marcas...</div>
  ) : brandsError ? (
    <div className="alert alert-danger text-center">{brandsError}</div>
  ) : brands.length === 0 ? (
    <div className="alert alert-info text-center">No hay marcas registradas.</div>
  ) : (
    <div className={styles.brandGrid}>
      {brands.map((brand, idx) => (
        <div className={styles.brandBadge} key={brand._id || idx} title={brand.name}>
          <img src={brand.logo} className={styles.brandLogo} alt={`Logo ${brand.name}`} />
          <div className={styles.brandName}>{brand.name}</div>
        </div>
      ))}
    </div>
  )}
</aside>
    </div>
  );
};

export default Home; 