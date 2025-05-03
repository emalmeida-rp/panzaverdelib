import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useCart } from '../context/CartContext';

const products = [
  {
    name: 'Cartulinas de color',
    image: '/img/cartulinas.jpeg',
    price: '$1500',
    description: 'Pack Colores 50x80cm x5 ',
    button: 'Adquirir'
  },
  {
    name: 'Crayones de cera Filgo',
    image: '/img/crayones-cera-filgo.jpeg',
    price: '$1200',
    description: 'Pack x12 unidades',
    button: 'Adquirir'
  },
  {
    name: 'Marcadores Pastel Trabi',
    image: '/img/imagentrabi.jpg',
    price: '$800',
    description: 'Pack colores combinables x5 u',
    button: 'Adquirir'
  },
  {
    name: 'Pack Faber Castell 24+3',
    image: '/img/lapiz-faber-comun.jpeg',
    price: '$2400',
    description: 'Lápices de color variado x24 u.',
    button: 'Adquirir'
  },
  {
    name: 'Resaltadores Stabilo',
    image: '/img/marcadores-tabilo.jpg',
    price: '$3600',
    description: 'Pack de variedad x30 u.',
    button: 'Adquirir'
  },
  {
    name: 'Lapiceras Bic rollon',
    image: '/img/lapiceras-color-bic.jpeg',
    price: '$1500',
    description: 'Pack combinables x4 u.',
    button: 'Adquirir'
  },
  {
    name: 'Pack Faber Castell pastel',
    image: '/img/lapiz-faber-pastel.jpg',
    price: '$2000',
    description: 'Lápices color pastel x10 u.',
    button: 'Adquirir'
  },
  {
    name: 'Tijeras escolares Maped',
    image: '/img/maped-tijeras-escolares.png',
    price: '$600',
    description: 'Colores a elección por u.',
    button: 'Adquirir'
  },
  {
    name: 'Fotocopias blanco & negro',
    image: '/img/fotocopias-bn.webp',
    price: '$150',
    description: 'Por hoja, escala de grises',
    button: 'Consultar'
  },
  {
    name: 'Fotocopias a color',
    image: '/img/fotocopias-color.jpg',
    price: '$300',
    description: 'Por hoja',
    button: 'Consultar'
  },
  {
    name: 'Espirales para anillado PVC',
    image: '/img/anillado-pvc.webp',
    price: '$400',
    description: 'Varias medidas, hasta 300 hojas',
    button: 'Consultar'
  },
  {
    name: 'Espirales para anillado reforzado',
    image: '/img/anillado.webp',
    price: '$800',
    description: 'Varias medidas, hasta 300 hojas',
    button: 'Consultar'
  },
  {
    name: 'Anillado punteado reforzado',
    image: '/img/anillado-punteado.jpg',
    price: '$1000',
    description: 'Varias medidas hasta 250 hojas',
    button: 'Consultar'
  },
  {
    name: 'Impresiones fotográficas',
    image: '/img/fotos.jpg',
    price: '$1500',
    description: 'Varias medidas por unidad',
    button: 'Consultar'
  },
  {
    name: 'Diseño Curriculum Vitae',
    image: '/img/perfil-cv.png',
    price: '$2500',
    description: 'Distintos estilos a elección',
    button: 'Consultar'
  },
  {
    name: 'Diseño de documentos',
    image: '/img/digitalizar-documentos.jpg',
    price: 'Requiere cotización',
    description: 'Digitalizar y combinar documentos',
    button: 'Consultar'
  },
  {
    name: 'Diseño de stickers personalizados',
    image: '/img/plancha-stickers.webp',
    price: 'Requiere cotización',
    description: 'Planchuela de stickers personalizados',
    button: 'Consultar'
  }
];

const Cart = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const { addToCart } = useCart();

  return (
    <div className="cart">
      <header className="text-center py-5" data-aos="fade-down">
        <h1>Carrito</h1>
        <p className="lead">Desde aquí podrás autogestionar tus compras de artículos de librería o insumos escolares. ¡Ofrecemos distintos medios de pago, facilidad y precios imbatibles!</p>
      </header>
      <div className="container">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 tienda-body">
          {products.map((product, idx) => (
            <div className="col" key={idx} data-aos="fade-up" data-aos-delay={idx * 50}>
              <div className="card h-100 bg-light card-products">
                <img src={product.image} className="card-img-top img-fluid img-thumbnail img-market" alt={product.name} />
                <div className="card-header text-center">
                  <h3 className="h5 mb-0">{product.name}</h3>
                </div>
                <div className="card-body text-center">
                  <h4 className="card-text">{product.price}</h4>
                  <p className="card-text">{product.description}</p>
                  <button className="btn btn-secondary w-100" onClick={() => addToCart(product)}>{product.button}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cart; 