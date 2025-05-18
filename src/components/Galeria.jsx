import React, { useState, useEffect } from "react";

const Galeria = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('http://localhost:6003/api/gallery');
        const data = await res.json();
        setTrabajos(data);
      } catch (err) {
        setTrabajos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <section className="container my-5">
      <h2 className="text-center mb-4">Galería de Trabajos</h2>
      <p className="text-center mb-5">
        Aquí podrás ver algunos de los trabajos realizados con nuestros materiales. ¡Pronto subiremos más proyectos!
      </p>
      {loading ? (
        <div className="text-center">Cargando galería...</div>
      ) : (
        <div className="row">
          {trabajos.length > 0 ? (
            trabajos.map((trabajo) => (
              <div className="col-md-4 mb-4" key={trabajo._id || trabajo.id}>
                <div className="card h-100 shadow-sm border-0">
                  <div style={{ background: '#f8f9fa', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                    <img src={trabajo.url || trabajo.imagen} className="card-img-top" alt={trabajo.title || trabajo.titulo} style={{ objectFit: 'cover', height: '80%', width: '100%', maxHeight: 240, maxWidth: '100%' }} />
                  </div>
                  <div className="card-body d-flex flex-column justify-content-between">
                    <h5 className="card-title text-center mb-2">{trabajo.title || trabajo.titulo}</h5>
                    {trabajo.descripcion && <p className="card-text text-center">{trabajo.descripcion}</p>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-info text-center">
                Próximamente subiremos nuestros trabajos realizados. ¡Vuelve pronto!
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Galeria; 