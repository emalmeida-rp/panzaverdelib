import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Carousel from 'react-bootstrap/Carousel';
import 'animate.css';
import axios from 'axios';
import styles from './BrandCards.module.scss';
import homeStyles from './Home.module.scss';
const API_URL = import.meta.env.VITE_API_URL;

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
        <div className={homeStyles.animatedTextContainer}>
          <span
            className={`${homeStyles.animatedText} animate__animated ${fade ? 'animate__fadeInRight' : 'animate__fadeOutLeft'}`}
          >
            {frases[fraseIdx]}
          </span>
        </div>
      </header>

      {/* Carrusel de Banners Dinámicos (antes Noticias) */}
      <section className="mb-5">
        {!bannersLoading && banners.length > 0 && (
          <>
        <div className="alert alert-secondary text-center" role="alert">
          Noticias y anuncios
        </div>
            <Carousel
              indicators={banners.length > 1}
              controls={banners.length > 1}
              fade
              interval={6000}
              className={homeStyles.bannerCarousel}
            >
              {banners.map((banner) => (
                <Carousel.Item key={banner._id}>
                  <div className={homeStyles.bannerCard}>
                    {banner.image && (
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className={homeStyles.bannerImage}
                />
                    )}
                    <div className={homeStyles.bannerContent}>
                      <h4>{banner.title}</h4>
                      <div>{banner.message}</div>
                      {banner.link && (
                        <a href={banner.link} target="_blank" rel="noopener noreferrer">
                          Más información
                        </a>
                      )}
                    </div>
                  </div>
              </Carousel.Item>
            ))}
          </Carousel>
          </>
        )}
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
            className={homeStyles.offerCarousel}
          >
            {offers.map((offer) => {
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
                <Carousel.Item key={offer._id}>
                  <div
                    className={
                      `${homeStyles.offerCard} ` +
                      (effect === 'shine' ? 'animate__animated animate__pulse' : '') +
                      (effect === 'bounce' ? 'animate__animated animate__bounce' : '') +
                      (effect === 'pulse' ? 'animate__animated animate__heartBeat' : '')
                    }
                  >
                    {/* Badge de oferta */}
                    <div
                      className={homeStyles.offerBadge}
                      style={{
                        background: color,
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
                      className={homeStyles.offerImage}
                    />
                    {/* Info */}
                    <div className={homeStyles.offerContent}>
                      <h4>{offer.name}</h4>
                      <div className={homeStyles.description}>{offer.description}</div>
                      <div className={homeStyles.price}>
                        ${finalPrice.toFixed(2)}
                        <span>${price.toFixed(2)}</span>
                      </div>
                      <div className={homeStyles.saving}>
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

      {/* Sección de acciones */}
      <section className={homeStyles.actionsContainer}>
        <Link to="/productos" className={`${homeStyles.actionButton} ${homeStyles.primary}`}>
          <i className="bi bi-shop"></i>
          Ver todos los productos
        </Link>
        <button onClick={scrollToTop} className={`${homeStyles.actionButton} ${homeStyles.secondary}`}>
          <i className="bi bi-arrow-up-circle"></i>
          Volver arriba
        </button>
      </section>
    </div>
  );
};

export default Home; 