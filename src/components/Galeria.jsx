import React, { useState, useEffect } from "react";
import trabajosData from "../data/trabajos.json";

const Galeria = () => {
  const [trabajos, setTrabajos] = useState([]);

  useEffect(() => {
    setTrabajos(trabajosData);
  }, []);

  return (
    <section className="container my-5">
      <h2 className="text-center mb-4">Galería de Trabajos</h2>
      <p className="text-center mb-5">
        Aquí podrás ver algunos de los trabajos realizados con nuestros materiales. ¡Pronto subiremos más proyectos!
      </p>
      <div className="row">
        {trabajos.length > 0 ? (
          trabajos.map((trabajo) => (
            <div className="col-md-4 mb-4" key={trabajo.id}>
              <div className="card h-100">
                <img src={trabajo.imagen} className="card-img-top" alt={trabajo.titulo} />
                <div className="card-body">
                  <h5 className="card-title">{trabajo.titulo}</h5>
                  <p className="card-text">{trabajo.descripcion}</p>
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
    </section>
  );
};

export default Galeria; 