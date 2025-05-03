import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Contact = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const [formData, setFormData] = useState({
    subject: '',
    firstName: '',
    lastName: '',
    email: '',
    details: '',
    file: null,
    terms: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log('Formulario enviado:', formData);
  };

  const faqItems = [
    {
      question: '¿Como me puedo comunicar con Librería Panza Verde?',
      answer: 'De momento, el único medio habilitado es Whatsapp, Facebook o Instagram OFICIALES que están en esta página. Ni bien nos desocupemos te respondemos, mientras tanto asegurate de dejarnos escrito la mayor información posible para responder adecuadamente.'
    },
    {
      question: '¿Cómo hago para realizar un pedido?',
      answer: 'En un futuro, podrá realizarse por el carrito, o bien consultando por nuestros canales disponibles, ya sea por Whatsapp o redes sociales.'
    },
    {
      question: '¿Hay algún límite para comprar por la web?',
      answer: 'De momento no hay un límite específico, pero te informaremos si es el caso. Recordá que este emprendimiento está orientado para ventas minoristas.'
    },
    {
      question: '¿Que hago si mi producto no funciona según lo esperado?',
      answer: 'Tenés hasta 72 horas de prueba a partir de que recibiste el producto e informar alguna falla de fábrica. Todos nuestros productos son NUEVOS, pero no están excentos de alguna falla de origen. Contactate con nosotros para que te informemos los pasos a seguir y gestionar el caso según corresponda.'
    },
    {
      question: '¿Cuales medios de pago son aceptados para realizar la compra?',
      answer: 'Aceptamos la mayoría de medios de pago habilitados, y garantizamos transparencia en las operaciones que desees realizar con nosotros. Usamos Mercado Pago con el alias correspondiente. ¡Solicitalo por nuestros canales para realizar la compra! ¡No aceptes ningún otro medio de pago que no sea facilitado directamente por nosotros!'
    }
  ];

  return (
    <div className="contact">
      <header className="text-center py-5" data-aos="fade-down">
        <h1>¡Contacto y Solicitudes!</h1>
      </header>

      <div className="letrero" data-aos="fade-up">
        <p className="texto-letrero">
          **-¿Querés trabajar con nosotros? ¿O tal vez tengas alguna sugerencia o encargos que realizar?
          ¡¡Ayudanos completando el formulario según tu necesidad para analizar tu caso y comunicarnos con
          vos lo antes posible!!-**
        </p>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-4" data-aos="fade-right">
            <div className="accordion mb-4" id="faqAccordion">
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button 
                    className="accordion-button" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#faqCollapse"
                  >
                    FAQ (Preguntas Frecuentes)
                  </button>
                </h2>
                <div 
                  id="faqCollapse" 
                  className="accordion-collapse collapse show" 
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body">
                    <div className="list-group">
                      {faqItems.map((item, index) => (
                        <div key={index} className="list-group-item">
                          <details>
                            <summary>{item.question}</summary>
                            <p>{item.answer}</p>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-8" data-aos="fade-left">
            <form className="needs-validation shadow p-4 bg-light rounded" onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <select 
                  className="form-select" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Asunto/motivo del contacto</option>
                  <option value="pedido">Quiero realizar un pedido de un editorial</option>
                  <option value="trabajo">Consulta sobre puesto de trabajo</option>
                  <option value="impresion">Quiero enviar un archivo para imprimir</option>
                  <option value="consulta">Consulta o reclamo general</option>
                </select>
                <div className="invalid-feedback">Por favor, elegí el motivo</div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nombre" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required 
                  />
                  <div className="invalid-feedback">Por favor, ingresá tu nombre</div>
                </div>
                <div className="col">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Apellido" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required 
                  />
                  <div className="invalid-feedback">Por favor, ingresá tu apellido</div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Correo electrónico</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="pepe@gmail.com" 
                  required 
                />
                <div className="invalid-feedback">Por favor, ingresá un email válido</div>
              </div>

              <div className="mb-3">
                <label htmlFor="details" className="form-label">Detalle</label>
                <textarea 
                  className="form-control" 
                  id="details" 
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Detallá el motivo de tu contacto..." 
                  required
                />
                <div className="invalid-feedback">Campo requerido</div>
              </div>

              <div className="mb-3">
                <input 
                  type="file" 
                  className="form-control" 
                  name="file"
                  onChange={handleInputChange}
                />
                <div className="invalid-feedback">Límite de peso del archivo: 25mb</div>
              </div>

              <div className="mb-3 form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="terms" 
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  required 
                />
                <label className="form-check-label" htmlFor="terms">
                  Estoy de acuerdo con los términos y condiciones
                </label>
                <div className="invalid-feedback">Debes aceptar los términos y condiciones</div>
              </div>

              <button type="submit" className="btn btn-primary">
                Confirmar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 