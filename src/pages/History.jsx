import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'animate.css';

const historicalFigures = [
  {
    name: 'Manuel Belgrano',
    image: '/img/historia-belgrano.webp',
    description: 'Abogado, economista, periodista, político, diplomático y militar argentino. Fue uno de los principales patriotas que impulsó la Revolución de Mayo y la independencia de las Provincias Unidas del Río de la Plata. Creador de la bandera argentina y gran impulsor de la educación.',
    link: 'https://es.wikipedia.org/wiki/Manuel_Belgrano'
  },
  {
    name: 'José de San Martín',
    image: '/img/historia-sanmartin.webp',
    description: 'Militar y político argentino, libertador de Argentina, Chile y Perú. Es considerado uno de los libertadores más importantes de Sudamérica y un símbolo de la independencia.',
    link: 'https://es.wikipedia.org/wiki/Jos%C3%A9_de_San_Mart%C3%ADn'
  },
  {
    name: 'Mariano Moreno',
    image: '/img/historia-mmoreno.webp',
    description: 'Abogado, periodista y político de las Provincias Unidas del Río de la Plata. Fue uno de los ideólogos de la Revolución de Mayo y defensor de la libertad de prensa y la educación.',
    link: 'https://es.wikipedia.org/wiki/Mariano_Moreno'
  },
  {
    name: 'Juan Bautista Alberdi',
    image: '/img/historia-alberdi.webp',
    description: 'Jurista, economista, político, escritor y músico argentino. Autor intelectual de la Constitución Argentina de 1853 y gran defensor de la organización nacional.',
    link: 'https://es.wikipedia.org/wiki/Juan_Bautista_Alberdi'
  },
  {
    name: 'Domingo Faustino Sarmiento',
    image: '/img/historia-sarmiento.webp',
    description: 'Político, escritor, docente, periodista y militar argentino. Presidente de la Nación Argentina entre 1868 y 1874. Impulsor de la educación pública y la modernización del país.',
    link: 'https://es.wikipedia.org/wiki/Domingo_Faustino_Sarmiento'
  },
  {
    name: 'Julio Argentino Roca',
    image: '/img/historia-roca.webp',
    description: 'Militar y político argentino, presidente de la Nación Argentina en dos oportunidades. Protagonista de la consolidación territorial y la modernización del Estado.',
    link: 'https://es.wikipedia.org/wiki/Julio_Argentino_Roca'
  },
  {
    name: 'Facundo Quiroga',
    image: '/img/historia-quiroga.webp',
    description: 'Caudillo y militar argentino, uno de los principales líderes federales durante las guerras civiles argentinas. Defensor de la autonomía provincial y la justicia social.',
    link: 'https://es.wikipedia.org/wiki/Facundo_Quiroga'
  },
  {
    name: 'Martín Miguel de Güemes',
    image: '/img/historia-mguemes.webp',
    description: 'Militar y político argentino que cumplió una destacada actuación en la Guerra de la Independencia Argentina. Líder de la resistencia en el norte y símbolo de la lucha popular.',
    link: 'https://es.wikipedia.org/wiki/Mart%C3%ADn_Miguel_de_G%C3%BCemes'
  },
  {
    name: 'Nuestra Historia',
    image: '/img/historia-panzaverde.webp',
    description: `En Librería Panza Verde, sabemos que el regreso a clases y el trabajo diario pueden ser un desafío económico. Por eso, hemos creado un espacio donde encontrarás todo lo que necesitas para equipar tu escuela u oficina, con la mejor atención personalizada y precios accesibles.

Somos más que una tienda de insumos. Somos un equipo de personas comprometidas con brindarte un servicio ágil y de calidad. Entendemos tus necesidades y te ofrecemos soluciones prácticas y eficientes.

En esta tienda encontrarás una amplia variedad de artículos escolares y de oficina, desde lápices y cuadernos hasta resmas de papel y equipos de impresión. Trabajamos con las mejores marcas y te ofrecemos productos de calidad que te ayudarán a alcanzar tus metas.

Pero lo más importante es que aquí te sentirás como en casa. Te recibiremos con una sonrisa y te brindaremos la atención que te mereces. Queremos ser tu aliado en este camino y ayudarte a ahorrar tiempo y dinero.

¡Visítanos y descubre la diferencia de comprar en Librería Panza Verde!`,
    link: '#'
  }
];

const History = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="history timeline-container">
      <header className="text-center py-5" data-aos="fade-down">
        <h1>Nuestra Historia</h1>
        <p className="lead">
          Dedicado a los próceres que forjaron nuestra patria y nuestra identidad
        </p>
      </header>

      <div className="container timeline-list">
        {historicalFigures.map((figure, idx) => {
          if (idx === historicalFigures.length - 1) {
            return (
              <div key={idx} className="row justify-content-center timeline-item mb-5" data-aos="fade-up">
                <div className="col-md-8">
                  <div className="card h-100 shadow-lg border-0 timeline-card text-center p-4">
                    <div style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={figure.image}
                        alt={figure.name}
                        className="img-fluid rounded shadow timeline-img mb-4"
                        style={{ maxHeight: 220, objectFit: 'contain', width: '100%', maxWidth: 320 }}
                      />
                    </div>
                    <div className="card-body">
                      <h3 className="card-title fw-bold mb-3" style={{ color: '#218838' }}>{figure.name}</h3>
                      {figure.description.split('\n').map((parr, i) => (
                        <p className="card-text mb-2" key={i}>{parr}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div
              key={idx}
              className={`row align-items-center timeline-item flex-md-row${idx % 2 === 1 ? '-reverse' : ''} mb-5`}
              data-aos={idx % 2 === 0 ? 'fade-right' : 'fade-left'}
            >
              <div className="col-md-5 text-center mb-3 mb-md-0">
                <div style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={figure.image}
                    alt={figure.name}
                    className="img-fluid rounded shadow timeline-img"
                    style={{ maxHeight: 220, objectFit: 'contain', width: '100%', maxWidth: 320 }}
                  />
                </div>
              </div>
              <div className="col-md-7">
                <div className="card h-100 shadow-sm border-0 timeline-card">
                  <div className="card-body">
                    <h3 className="card-title fw-bold" style={{ color: '#218838' }}>{figure.name}</h3>
                    <p className="card-text mb-3">{figure.description}</p>
                    <a href={figure.link} className="btn btn-outline-success" target="_blank" rel="noopener noreferrer">
                      Leer más
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History; 