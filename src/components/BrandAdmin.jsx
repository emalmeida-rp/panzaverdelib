import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const BrandAdmin = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '', website: '', active: true });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/brands`);
      setBrands(data);
    } catch {
      alert('Error al cargar marcas');
    }
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleEdit = (brand) => {
    setEditing(brand._id);
    setForm({ ...brand });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta marca?')) {
      await axios.delete(`${API_URL}/brands/${id}`);
      fetchBrands();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`${API_URL}/brands/${editing}`, form);
    } else {
      await axios.post(`${API_URL}/brands`, form);
    }
    setEditing(null);
    setForm({ name: '', description: '', logo: '', website: '', active: true });
    fetchBrands();
  };

  return (
    <div className="container mt-4">
      <h2>Administrar Marcas</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-3">
            <input className="form-control" placeholder="Nombre" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Logo (URL)" name="logo" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} required />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Sitio web" name="website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Descripción" name="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-md-1 d-flex align-items-center">
            <input type="checkbox" className="form-check-input" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            <label className="form-check-label ms-1">Activa</label>
          </div>
          <div className="col-md-2 d-flex align-items-center">
            <button className="btn btn-success me-2" type="submit">{editing ? 'Actualizar' : 'Agregar'}</button>
            {editing && <button className="btn btn-secondary" type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', logo: '', website: '', active: true }); }}>Cancelar</button>}
          </div>
        </div>
      </form>
      {loading ? (
        <div>Cargando marcas...</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Sitio web</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => (
              <tr key={brand._id}>
                <td><img src={brand.logo} alt={brand.name} style={{ width: 48, height: 48, objectFit: 'contain' }} /></td>
                <td>{brand.name}</td>
                <td>{brand.description}</td>
                <td>{brand.website && <a href={brand.website} target="_blank" rel="noopener noreferrer">{brand.website}</a>}</td>
                <td>{brand.active ? 'Sí' : 'No'}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(brand)}>Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(brand._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BrandAdmin;