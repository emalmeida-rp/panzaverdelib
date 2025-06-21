const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
            <img 
              src="/img/Logo.webp" 
              alt="logo-original" 
              className="img-fluid logo-original"
              style={{ maxHeight: '100px' }}
            />
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="mb-0">
              Todos los derechos son reservados para Librería Panza Verde™. Tanto la marca como el proyecto web,
              son diseños personales y propios nacido de ideas propias llevadas a cabo en 2022.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 