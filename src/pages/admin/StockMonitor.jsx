import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../utils/api';
import { useAlert } from '../../context/AlertContext';
import styles from './AdminDashboard.module.scss';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { FaSync, FaBroom, FaExclamationTriangle, FaCheckCircle, FaClock, FaBoxOpen, FaCog, FaSave } from 'react-icons/fa';

dayjs.extend(relativeTime);
dayjs.locale('es');

const StockMonitor = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [jobSettings, setJobSettings] = useState({
    cleanupInterval: 5, // minutos
    reservationTime: 30, // minutos
    autoRefreshInterval: 30 // segundos
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { showAlert } = useAlert();

  // Obtener estado del sistema
  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['stockSystemStatus'],
    queryFn: async () => {
      const response = await fetchWithAuth('/admin/stock/status');
      if (!response.ok) throw new Error('Error al obtener estado del sistema');
      return response.json();
    },
    refetchInterval: jobSettings.autoRefreshInterval * 1000,
  });

  // Obtener reservas
  const { data: reservations = [], isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
    queryKey: ['stockReservations'],
    queryFn: async () => {
      const response = await fetchWithAuth('/admin/stock/reservations');
      if (!response.ok) throw new Error('Error al obtener reservas');
      return response.json();
    },
    refetchInterval: (jobSettings.autoRefreshInterval / 2) * 1000,
  });

  const handleManualCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetchWithAuth('/admin/stock/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Error en la limpieza manual');
      
      const result = await response.json();
      showAlert(`Limpieza completada: ${result.reservationsCleanup} reservas procesadas`, 'success');
      
      // Refrescar datos
      refetchStatus();
      refetchReservations();
    } catch (error) {
      showAlert('Error en la limpieza manual', 'error');
      console.error('Error:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetchWithAuth('/admin/stock/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobSettings)
      });
      
      if (!response.ok) throw new Error('Error al guardar configuración');
      
      showAlert('Configuración guardada exitosamente', 'success');
      setShowSettings(false);
    } catch (error) {
      showAlert('Error al guardar configuración', 'error');
      console.error('Error:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRefresh = () => {
    refetchStatus();
    refetchReservations();
    showAlert('Datos actualizados', 'info');
  };

  const getReservationStatus = (reservation) => {
    const now = new Date();
    const expiresAt = new Date(reservation.expiresAt);
    
    if (reservation.status === 'confirmed') {
      return { color: '#28a745', icon: <FaCheckCircle />, text: 'Confirmada' };
    } else if (reservation.status === 'cancelled') {
      return { color: '#dc3545', icon: <FaExclamationTriangle />, text: 'Cancelada' };
    } else if (expiresAt < now) {
      return { color: '#ffc107', icon: <FaExclamationTriangle />, text: 'Expirada' };
    } else {
      return { color: '#17a2b8', icon: <FaClock />, text: 'Activa' };
    }
  };

  if (statusLoading || reservationsLoading) {
    return <div className="container mt-4">Cargando monitoreo de stock...</div>;
  }

  return (
    <div className="container mt-4">
      <div className={styles.pageHeader}>
        <h1>Monitoreo de Stock y Reservas</h1>
        <div className={styles.stockHeaderActions}>
          <button 
            className={`${styles.stockBtn} ${styles.stockBtnRefresh}`}
            onClick={handleRefresh}
            title="Refrescar datos"
          >
            <FaSync />
          </button>
          <button 
            className={`${styles.stockBtn} ${styles.stockBtnConfig}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Configurar job de limpieza"
          >
            <FaCog />
          </button>
          <button 
            className={`${styles.stockBtn} ${styles.stockBtnDanger}`}
            onClick={handleManualCleanup}
            disabled={isCleaningUp}
            title="Limpieza manual de reservas expiradas"
          >
            <FaBroom /> {isCleaningUp ? 'Limpiando...' : 'Limpiar Expiradas'}
          </button>
        </div>
      </div>

      {/* Panel de Configuración */}
      {showSettings && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <FaCog className="me-2" />
              Configuración del Sistema
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Intervalo de Limpieza (minutos)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobSettings.cleanupInterval}
                    onChange={(e) => setJobSettings({
                      ...jobSettings,
                      cleanupInterval: parseInt(e.target.value) || 5
                    })}
                    min="1"
                    max="60"
                  />
                  <small className="form-text text-muted">
                    Cada cuántos minutos se ejecuta la limpieza automática
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Tiempo de Reserva (minutos)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobSettings.reservationTime}
                    onChange={(e) => setJobSettings({
                      ...jobSettings,
                      reservationTime: parseInt(e.target.value) || 30
                    })}
                    min="5"
                    max="120"
                  />
                  <small className="form-text text-muted">
                    Tiempo que dura una reserva antes de expirar
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Auto-refresh (segundos)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobSettings.autoRefreshInterval}
                    onChange={(e) => setJobSettings({
                      ...jobSettings,
                      autoRefreshInterval: parseInt(e.target.value) || 30
                    })}
                    min="10"
                    max="300"
                  />
                  <small className="form-text text-muted">
                    Frecuencia de actualización automática de datos
                  </small>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                className={`${styles.stockBtn} ${styles.stockBtnSecondary}`}
                onClick={() => setShowSettings(false)}
              >
                Cancelar
              </button>
              <button 
                className={`${styles.stockBtn} ${styles.stockBtnSuccess}`}
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                <FaSave />
                {isSavingSettings ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado del Sistema */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaClock className="me-2" />
                Reservas Activas
              </h5>
              <h3 className="card-text text-info">{systemStatus?.activeReservations || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaExclamationTriangle className="me-2" />
                Reservas Expiradas
              </h5>
              <h3 className="card-text text-warning">{systemStatus?.expiredReservations || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaCheckCircle className="me-2" />
                Estado del Sistema
              </h5>
              <h3 className="card-text text-success">
                {systemStatus?.systemStatus === 'running' ? 'Funcionando' : 'Detenido'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className={styles.contentCard}>
        <h4 className="mb-3">Reservas de Stock</h4>
        
        {reservations.length === 0 ? (
          <div className="text-center py-4">
            <FaBoxOpen size={48} className="text-muted mb-3" />
            <p className="text-muted">No hay reservas activas en este momento</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th>Expira</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(reservation => {
                  const status = getReservationStatus(reservation);
                  return (
                    <tr key={reservation._id}>
                      <td>
                        <strong>{reservation.orderId?.code || 'N/A'}</strong>
                      </td>
                      <td>{reservation.orderId?.userName || 'N/A'}</td>
                      <td>
                        <div>
                          {reservation.items.map((item, idx) => (
                            <div key={idx} className="small">
                              {item.product?.name || 'Producto eliminado'} 
                              <span className="text-muted"> (x{item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: status.color }} className="d-flex align-items-center">
                          {status.icon}
                          <span className="ms-1">{status.text}</span>
                        </span>
                      </td>
                      <td>
                        <small>{dayjs(reservation.createdAt).format('DD/MM/YYYY HH:mm')}</small>
                      </td>
                      <td>
                        <small>
                          {dayjs(reservation.expiresAt).format('DD/MM/YYYY HH:mm')}
                          <br />
                          <span className="text-muted">
                            ({dayjs(reservation.expiresAt).fromNow()})
                          </span>
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información del Sistema */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Información del Sistema</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Job de Limpieza:</strong> Ejecutándose cada {jobSettings.cleanupInterval} minutos</p>
                  <p><strong>Tiempo de Reserva:</strong> {jobSettings.reservationTime} minutos por defecto</p>
                  <p><strong>Auto-refresh:</strong> Cada {jobSettings.autoRefreshInterval} segundos</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Última actualización:</strong> {dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
                  <p><strong>Reservas totales:</strong> {reservations.length}</p>
                  <p><strong>Estado:</strong> 
                    <span className="text-success ms-1">Sistema operativo</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMonitor; 