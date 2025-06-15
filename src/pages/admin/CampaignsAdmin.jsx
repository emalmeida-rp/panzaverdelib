import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import styles from './AdminDashboard.module.scss';
import Modal from 'react-bootstrap/Modal';

const effectOptions = [
  { value: 'badge', label: 'Badge destacado' },
  { value: 'shine', label: 'Brillo animado' },
  { value: 'bounce', label: 'Rebote' },
  { value: 'pulse', label: 'Pulso' },
  { value: 'firework', label: 'Fuegos artificiales' },
  { value: 'glow', label: 'Glow (borde resplandeciente)' },
  { value: 'floating', label: 'Flotación suave' },
  { value: 'fade', label: 'Aparición/desaparición' },
  { value: 'shadow', label: 'Sombra dinámica' },
  { value: 'wave', label: 'Badge onda animada' },
  { value: 'none', label: 'Sin efecto' }
];

const CampaignsAdmin = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    products: [],
    discountType: 'percent',
    discountValue: '',
    visualEffect: 'badge',
    color: '#e67e22',
    active: true
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      setError('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetchWithAuth('/products');
      const data = await res.json();
      setProducts(data);
    } catch {}
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductCheck = id => {
    setForm(f => ({
      ...f,
      products: f.products.includes(id)
        ? f.products.filter(pid => pid !== id)
        : [...f.products, id]
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/campaigns/${editingId}` : '/campaigns';
      const formToSend = {
        ...form,
        products: form.products.map(p => typeof p === 'string' ? p : p._id)
      };
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToSend)
      });
      if (!res.ok) throw new Error('Error al guardar campaña');
      setForm({
        name: '', description: '', startDate: '', endDate: '', products: [], discountType: 'percent', discountValue: '', visualEffect: 'badge', color: '#e67e22', active: true
      });
      setEditingId(null);
      setShowModal(false);
      fetchCampaigns();
    } catch {
      setError('Error al guardar campaña');
    }
  };

  const handleEdit = camp => {
    setForm({
      name: camp.name,
      description: camp.description,
      startDate: camp.startDate?.slice(0, 10),
      endDate: camp.endDate?.slice(0, 10),
      products: camp.products.map(p => p._id),
      discountType: camp.discountType,
      discountValue: camp.discountValue,
      visualEffect: camp.visualEffect,
      color: camp.color,
      active: camp.active
    });
    setEditingId(camp._id);
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar campaña?')) return;
    await fetchWithAuth(`/campaigns/${id}`, { method: 'DELETE' });
    fetchCampaigns();
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleOpenModal = () => {
    setForm({
      name: '', description: '', startDate: '', endDate: '', products: [], discountType: 'percent', discountValue: '', visualEffect: 'badge', color: '#e67e22', active: true
    });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className={styles.dashboardSection}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Campañas de Productos y Ofertas</h2>
        <button className={styles.dashboardBtnPrimary} style={{minWidth: 170}} onClick={handleOpenModal}>
          + Nueva campaña
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dashboardTable}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fechas</th>
              <th>Descuento</th>
              <th>Productos</th>
              <th>Efecto</th>
              <th>Color</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(camp => (
              <tr key={camp._id}>
                <td>{camp.name}</td>
                <td>{camp.startDate?.slice(0,10)}<br/>-<br/>{camp.endDate?.slice(0,10)}</td>
                <td>{camp.discountType === 'percent' ? `${camp.discountValue}%` : `$${camp.discountValue}`}</td>
                <td>{camp.products.map(p => p.name).join(', ')}</td>
                <td>{effectOptions.find(e => e.value === camp.visualEffect)?.label}</td>
                <td><span style={{ background: camp.color, display: 'inline-block', width: 24, height: 24, borderRadius: 6 }}></span></td>
                <td>{camp.active ? 'Activa' : 'Inactiva'}</td>
                <td>
                  <button className={styles.dashboardBtn + ' btn btn-sm btn-outline-primary'} onClick={() => handleEdit(camp)}>Editar</button>
                  <button className={styles.dashboardBtn + ' btn btn-sm btn-outline-danger ms-2'} onClick={() => handleDelete(camp._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered dialogClassName={styles.campaignModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar campaña' : 'Nueva campaña'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.campaignModalBody}>
          <form onSubmit={handleSubmit}>
            {/* Bloque 1: Datos de la campaña */}
            <div style={{ marginBottom: 18 }}>
              <div className="row g-3 align-items-end">
                <div className="col-md-6 mb-2">
                  <label className={styles.formLabel}>Nombre</label>
                  <input name="name" value={form.name} onChange={handleChange} className={styles.dashboardInput} required />
                </div>
                <div className="col-md-6 mb-2">
                  <label className={styles.formLabel}>Descripción</label>
                  <input name="description" value={form.description} onChange={handleChange} className={styles.dashboardInput} />
                </div>
              </div>
            </div>
            {/* Bloque 2: Fechas y estado */}
            <div style={{ marginBottom: 18 }}>
              <div className="row g-3 align-items-end">
                <div className="col-md-4 mb-2">
                  <label className={styles.formLabel}>Fecha inicio</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={styles.dashboardInput} required />
                </div>
                <div className="col-md-4 mb-2">
                  <label className={styles.formLabel}>Fecha fin</label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={styles.dashboardInput} required />
                </div>
                <div className="col-md-2 mb-2 d-flex flex-column align-items-center justify-content-end">
                  <label className={styles.formLabel}>Activa</label>
                  <input type="checkbox" name="active" checked={form.active} onChange={handleChange} style={{ width: 22, height: 22 }} />
                </div>
              </div>
            </div>
            {/* Bloque 3: Descuento y efecto */}
            <div style={{ marginBottom: 18 }}>
              <div className="row g-3 align-items-end">
                <div className="col-md-4 mb-2">
                  <label className={styles.formLabel}>Tipo de descuento</label>
                  <select name="discountType" value={form.discountType} onChange={handleChange} className={styles.dashboardInput}>
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
                <div className="col-md-3 mb-2">
                  <label className={styles.formLabel}>Valor</label>
                  <input name="discountValue" type="number" min="1" value={form.discountValue} onChange={handleChange} className={styles.dashboardInput} required />
                </div>
                <div className="col-md-4 mb-2">
                  <label className={styles.formLabel}>Efecto visual</label>
                  <select name="visualEffect" value={form.visualEffect} onChange={handleChange} className={styles.dashboardInput}>
                    {effectOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1 mb-2 d-flex flex-column align-items-center">
                  <label className={styles.formLabel}>Color</label>
                  <div className={styles.campaignColorInput}>
                    <input name="color" type="color" value={form.color} onChange={handleChange} className={styles.dashboardInput} style={{ width: 38, height: 38, padding: 0, border: 'none', background: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Bloque 4: Productos */}
            <div style={{ marginBottom: 18 }}>
              <label className={styles.formLabel}>Productos en oferta</label>
              <div className="d-flex gap-3 align-items-start">
                <input
                  type="text"
                  className={styles.dashboardInput}
                  placeholder="Buscar por nombre..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #e3e3e3', borderRadius: 8, background: '#fafbfc', flex: 1, minWidth: 0 }}>
                  {filteredProducts.map(p => (
                    <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.products.includes(p._id)}
                        onChange={() => handleProductCheck(p._id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ padding: 8, color: '#888' }}>No hay productos</div>
                  )}
                </div>
              </div>
              {form.products.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.95em', color: '#2980b9' }}>
                  Seleccionados: {products.filter(p => form.products.includes(p._id)).map(p => p.name).join(', ')}
                </div>
              )}
            </div>
            <div className={styles.campaignModalFooter}>
              <button className={styles.dashboardBtnPrimary} type="submit" style={{ minWidth: 160 }}>
                {editingId ? 'Actualizar' : 'Crear'} campaña
              </button>
              {editingId && (
                <button type="button" className={styles.dashboardBtn + ' ms-2'} onClick={() => { setForm({ name: '', description: '', startDate: '', endDate: '', products: [], discountType: 'percent', discountValue: '', visualEffect: 'badge', color: '#e67e22', active: true }); setEditingId(null); setShowModal(false); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CampaignsAdmin; 