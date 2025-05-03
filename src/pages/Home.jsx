import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Carousel from 'react-bootstrap/Carousel';
import 'animate.css';

const carouselImages = [
  { src: '/img/carousel1.webp', alt: 'daily1', caption: 'Primera diapositiva', desc: 'Estamos trabajando en el contenido!.' },
  { src: '/img/carousel2.webp', alt: 'daily2', caption: 'Segunda diapositiva', desc: 'Estamos trabajando en el contenido!.' },
  { src: '/img/carousel3.webp', alt: 'daily3', caption: 'Tercera diapositiva', desc: 'Estamos trabajando en el contenido.' },
  { src: '/img/carousel4.webp', alt: 'daily4', caption: 'Cuarta diapositiva', desc: 'Estamos trabajando en el contenido.' },
];

const brands = [
  { name: 'Maped', img: '/img/card-logo-maped.png', desc: 'Marca líder en útiles escolares.' },
  { name: 'Faber Castell', img: 'https://www.faber-castell.com.ar/-/media/Faber-Castell-new/Logo-FC-SVG.ashx?sc_lang=es-AR&mh=61&la=es-AR&h=61&w=185&mw=194&hash=1FF8BEBD73CB354682069B60ADA946CE', desc: 'La excelencia en escritura desde 1761.' },
  { name: 'Bic', img: '/img/card-logo-bic.jpg', desc: 'Las lapiceras más reconocidas.' },
  { name: 'A. Estrada', img: '/img/card-logo-angel.jpg', desc: 'Fabricante de productos de papelería.' },
  { name: 'America', img: '/img/card-logo-america.jpg', desc: 'Cuadernos confiables y duraderos' },
  { name: 'Congreso', img: '/img/card-logo-congreso.jpg', desc: 'Mejor opción económica' },
  { name: 'Rivadavia', img: '/img/card-logo-rivadavia.jpg', desc: 'Excelencia en papelería' },
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

      {/* Tarjetas de marcas */}
      <aside>
        <div className="alert alert-secondary text-center" role="alert">
          <p className="card-title mb-0">Trabajamos con las siguientes marcas:</p>
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 branches justify-content-center">
          {brands.map((brand, idx) => (
            <div className="col" key={idx} data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="card card-branches h-100">
                <img src={brand.img} className="card-img-top img-fluid img-branches" alt={`Logo ${brand.name}`} />
                <div className="card-body text-center">
                  <p className="card-title fw-bold mb-1">{brand.name}</p>
                  <p className="card-text mb-2">{brand.desc}</p>
                  <a href="#" className="btn btn-primary">Ver más</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default Home; 