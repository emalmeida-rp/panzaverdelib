import React, { useState, useEffect } from 'react';
import { useAlert } from '../../context/AlertContext';
import { fetchWithAuth } from '../../utils/api';
import axios from 'axios';
import styles from './AdminDashboard.module.scss';
import { FaPlus, FaEdit, FaTrash, FaUpload, FaCamera } from 'react-icons/fa';

const CLOUDINARY_UPLOAD_PRESET = 'upload_lpv';
const CLOUDINARY_CLOUD_NAME = 'libpanzaverdearcloudinary'; 
const API_URL = import.meta.env.VITE_API_URL;

const GalleryAdmin = () => {
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState({ url: '', title: '', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { showAlert } = useAlert();
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({ title: '', description: '', url: '' });
  const [editFile, setEditFile] = useState(null);

  // Cargar imágenes al montar
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetchWithAuth('/gallery');
        const data = await res.json();
        setImages(data);
      } catch (err) {
        showAlert('Error al cargar la galería', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [showAlert]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewImage(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if ((!newImage.url && !file) || !newImage.title) {
      showAlert('Debes completar todos los campos', 'warning');
      return;
    }
    let imageUrl = newImage.url;
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        imageUrl = res.data.secure_url;
      } catch (err) {
        showAlert('Error al subir la imagen a Cloudinary', 'danger');
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    try {
      const res = await fetchWithAuth('/gallery', {
        method: 'POST',
        body: JSON.stringify({ url: imageUrl, title: newImage.title, description: newImage.description })
      });
      if (!res.ok) throw new Error('Error al agregar la imagen');
      const img = await res.json();
      setImages(prev => [img, ...prev]);
      setNewImage({ url: '', title: '', description: '' });
      setFile(null);
      showAlert('Imagen agregada a la galería', 'success');
    } catch (err) {
      showAlert('Error al agregar la imagen', 'danger');
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      const res = await fetchWithAuth(`/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la imagen');
      setImages(prev => prev.filter(img => img._id !== id));
      showAlert('Imagen eliminada de la galería', 'danger');
    } catch (err) {
      showAlert('Error al eliminar la imagen', 'danger');
    }
  };

  const startEdit = (img) => {
    setEditingId(img._id || img.id);
    setEditFields({ title: img.title || img.titulo, description: img.description || '', url: img.url || img.imagen || '' });
    setEditFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({ title: '', description: '', url: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFields(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFileChange = (e) => {
    setEditFile(e.target.files[0]);
  };

  const saveEdit = async (id) => {
    let imageUrl = editFields.url;
    if (editFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', editFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        imageUrl = res.data.secure_url;
      } catch (err) {
        showAlert('Error al subir la imagen a Cloudinary', 'danger');
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    try {
      const res = await fetchWithAuth(`/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editFields.title, description: editFields.description, url: imageUrl })
      });
      if (!res.ok) throw new Error('Error al actualizar la imagen');
      const updated = await res.json();
      setImages(prev => prev.map(img => (img._id === id || img.id === id ? updated : img)));
      showAlert('Imagen actualizada', 'success');
      cancelEdit();
    } catch (err) {
      showAlert('Error al actualizar la imagen', 'danger');
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          <FaCamera className="me-2" />
          Administrar Galería
        </h2>
      </div>

      <div className={styles.contentCard + ' mb-4'}>
        <form onSubmit={handleAddImage} className="row g-3 align-items-center">
          <div className="col-md-4">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              name="url"
              placeholder="URL de la imagen (opcional si subes archivo)"
              value={newImage.url}
              onChange={handleInputChange}
              disabled={!!file}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              name="title"
              placeholder="Título de la imagen"
              value={newImage.title}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              name="description"
              placeholder="Descripción de la imagen (opcional)"
              value={newImage.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-auto">
            <button type="submit" className={styles.btn + ' ' + styles.btnPrimary} disabled={loading || uploading}>
              {uploading ? 'Subiendo...' : <><FaPlus /> Agregar Imagen</>}
            </button>
          </div>
        </form>
      </div>

      <div className="row g-4">
        {loading ? (
          [...Array(6)].map((_, idx) => (
            <div className="col-lg-4 col-md-6" key={idx}>
              <div className={styles.contentCard}>
                <div className={styles.placeholder} style={{ height: 220, background: '#e0e0e0', borderRadius: 8 }}></div>
                <div className={styles.cardBody}>
                  <h5 className={styles.cardTitle + ' ' + styles.placeholder} style={{ height: 24, background: '#d0d0d0', borderRadius: 6, margin: '0 auto' }}></h5>
                  <p className={styles.cardText + ' ' + styles.placeholder} style={{ height: 16, background: '#f0f0f0', borderRadius: 6, margin: '0 auto' }}></p>
                </div>
              </div>
            </div>
          ))
        ) : (
          images.map(img => (
            <div className="col-lg-4 col-md-6" key={img._id}>
              <div className={styles.contentCard} style={{padding: 0}}>
                <div style={{ background: '#f8f9fa', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <img src={img.url || img.imagen} className={styles.cardImgTop} alt={img.title || img.titulo} style={{ objectFit: 'cover', height: '100%', width: '100%', maxHeight: 220, maxWidth: '100%' }} />
                </div>
                <div style={{padding: '1rem'}}>
                  {editingId === img._id ? (
                    <>
                      <input
                        type="text"
                        className={styles.formControl + ' mb-2'}
                        name="title"
                        value={editFields.title}
                        onChange={handleEditChange}
                        placeholder="Título de la imagen"
                      />
                      <input
                        type="text"
                        className={styles.formControl + ' mb-2'}
                        name="description"
                        value={editFields.description}
                        onChange={handleEditChange}
                        placeholder="Descripción de la imagen"
                      />
                      <input
                        type="text"
                        className={styles.formControl + ' mb-2'}
                        name="url"
                        value={editFields.url}
                        onChange={handleEditChange}
                        placeholder="URL de la imagen (opcional si subes archivo)"
                        disabled={!!editFile}
                      />
                      <input
                        type="file"
                        className={styles.formControl + ' mb-2'}
                        accept="image/*"
                        onChange={handleEditFileChange}
                      />
                      <div className={styles.actionButtons}>
                        <button className="primary" onClick={() => saveEdit(img._id)}><FaEdit /> Guardar</button>
                        <button onClick={cancelEdit}><FaTrash /> Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h5>{img.title}</h5>
                      <p>{img.description}</p>
                      <div className={styles.actionButtons}>
                        <button onClick={() => startEdit(img)}><FaEdit /> Editar</button>
                        <button className="danger" onClick={() => handleDeleteImage(img._id)}><FaTrash /> Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default GalleryAdmin; 