import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import Modal from 'react-bootstrap/Modal';

const initialForm = {
  title: '',
  message: '',
  image: '',
  link: '',
  active: true,
  order: 0,
  startDate: '',
  endDate: ''
};

const BannerAdmin = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/banners');
      const data = await res.json();
      setBanners(data);
    } catch {
      setError('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/banners/${editingId}` : '/banners';
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Error al guardar banner');
      setForm(initialForm);
      setEditingId(null);
      setShowModal(false);
      fetchBanners();
    } catch {
      setError('Error al guardar banner');
    }
  };

  const handleEdit = banner => {
    setForm({
      ...banner,
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : ''
    });
    setEditingId(banner._id);
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar banner?')) return;
    await fetchWithAuth(`/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Banners / Noticias del Carrusel</h2>
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}>
          + Nuevo banner
        </button>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Título</th>
              <th>Mensaje</th>
              <th>Imagen</th>
              <th>Link</th>
              <th>Fechas</th>
              <th>Activo</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(b => (
              <tr key={b._id}>
                <td>{b.title}</td>
                <td>{b.message}</td>
                <td>{b.image ? <img src={b.image} alt="banner" style={{ width: 60, height: 40, objectFit: 'cover' }} /> : '-'}</td>
                <td>{b.link ? <a href={b.link} target="_blank" rel="noopener noreferrer">Ver</a> : '-'}</td>
                <td>{b.startDate?.slice(0,10)}<br/>-<br/>{b.endDate?.slice(0,10)}</td>
                <td>{b.active ? 'Sí' : 'No'}</td>
                <td>{b.order}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(b)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar banner' : 'Nuevo banner'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Título</label>
              <input name="title" value={form.title} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Mensaje</label>
              <textarea name="message" value={form.message} onChange={handleChange} className="form-control" rows={2} />
            </div>
            <div className="mb-3">
              <label className="form-label">Imagen (URL)</label>
              <input name="image" value={form.image} onChange={handleChange} className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Link (opcional)</label>
              <input name="link" value={form.link} onChange={handleChange} className="form-control" />
            </div>
            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Fecha inicio</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="form-control" />
              </div>
              <div className="col">
                <label className="form-label">Fecha fin</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="form-control" />
              </div>
              <div className="col">
                <label className="form-label">Orden</label>
                <input type="number" name="order" value={form.order} onChange={handleChange} className="form-control" />
              </div>
              <div className="col d-flex align-items-center">
                <div className="form-check mt-4">
                  <input type="checkbox" className="form-check-input" name="active" checked={form.active} onChange={handleChange} id="activeCheck" />
                  <label className="form-check-label" htmlFor="activeCheck">Activo</label>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Actualizar' : 'Crear'} banner
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BannerAdmin; 