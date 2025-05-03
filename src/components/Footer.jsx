const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-4 text-center">
            <img 
              src="/img/Logo.webp" 
              alt="logo-original" 
              className="img-fluid logo-original"
              style={{ maxHeight: '100px' }}
            />
          </div>
          <div className="col-md-4 text-center">
            <p className="mb-0">
              Todos los derechos son reservados para Librería Panza Verde™. Tanto la marca como el proyecto web,
              son diseños personales y propios nacido de ideas propias llevadas a cabo en 2022.
            </p>
          </div>
          <div className="col-md-4 text-center">
            <div className="social-links">
              <a 
                href="https://wa.me/message/OICVOUY5BK7OL1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="me-3"
              >
                <img 
                  src="/img/WhatsApp_icon.png" 
                  alt="whatsapp" 
                  width="50" 
                  height="50"
                />
              </a>
              <a 
                href="https://www.facebook.com/share/1APNL6PYST/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="me-3"
              >
                <img 
                  src="/img/ico-fb.png" 
                  alt="facebook-ico" 
                  width="50" 
                  height="50"
                />
              </a>
              <a 
                href="https://www.instagram.com/libreriapanzaverde/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img 
                  src="/img/insta-ico.png" 
                  alt="instagram-ico" 
                  width="50" 
                  height="50"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 