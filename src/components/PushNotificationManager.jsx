import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAlert } from '../context/AlertContext';

const PushNotificationManager = ({ userRole = 'admin', showSettings = true }) => {
  const [pushStatus, setPushStatus] = useState('checking');
  const [subscription, setSubscription] = useState(null);
  const [settings, setSettings] = useState({
    enabled: true,
    types: {
      pedido: true,
      stock_low: true,
      venta_completada: false,
      campana_activa: false
    },
    priority: {
      urgent: true,
      high: true,
      normal: false,
      low: false
    },
    schedule: {
      enabled: false,
      startHour: 9,
      endHour: 18
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  // Verificar soporte y estado inicial
  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    try {
      // Verificar soporte del navegador
      if (!('serviceWorker' in navigator)) {
        setPushStatus('unsupported');
        return;
      }

      if (!('PushManager' in window)) {
        setPushStatus('unsupported');
        return;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration);

      // Verificar permisos
      const permission = await Notification.requestPermission();
      
      if (permission === 'denied') {
        setPushStatus('denied');
        return;
      }

      if (permission === 'granted') {
        // Verificar suscripción existente
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setPushStatus('subscribed');
          await loadUserSettings();
        } else {
          setPushStatus('not_subscribed');
        }
      } else {
        setPushStatus('permission_needed');
      }

    } catch (error) {
      console.error('❌ Error verificando push support:', error);
      setPushStatus('error');
    }
  };

  const loadUserSettings = async () => {
    try {
      const response = await fetchWithAuth('/notifications/settings');
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(prev => ({ ...prev, ...userSettings }));
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }
  };

  const requestPermissionAndSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // Pedir permisos
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        showAlert('Se necesitan permisos para enviar notificaciones', 'warning');
        setPushStatus('denied');
        return;
      }

      // Obtener registration del service worker
      const registration = await navigator.serviceWorker.ready;

      // Generar suscripción
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await getVAPIDKey()
      });

      // Enviar suscripción al servidor
      await saveSubscriptionToServer(newSubscription);

      setSubscription(newSubscription);
      setPushStatus('subscribed');
      showAlert('✅ Notificaciones activadas correctamente', 'success');

    } catch (error) {
      console.error('❌ Error suscribiendo:', error);
      showAlert('Error activando notificaciones: ' + error.message, 'error');
      setPushStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscriptionFromServer();
        setSubscription(null);
        setPushStatus('not_subscribed');
        showAlert('Notificaciones desactivadas', 'info');
      }
    } catch (error) {
      console.error('❌ Error desuscribiendo:', error);
      showAlert('Error desactivando notificaciones', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetchWithAuth('/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userRole,
          settings
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando suscripción');
      }

    } catch (error) {
      console.error('❌ Error guardando suscripción:', error);
      throw error;
    }
  };

  const removeSubscriptionFromServer = async () => {
    try {
      const response = await fetchWithAuth('/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error('Error removiendo suscripción');
      }

    } catch (error) {
      console.error('❌ Error removiendo suscripción:', error);
      throw error;
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetchWithAuth('/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showAlert('✅ Configuración guardada', 'success');
      } else {
        throw new Error('Error guardando configuración');
      }

    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      showAlert('Error guardando configuración', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getVAPIDKey = async () => {
    try {
      const response = await fetchWithAuth('/notifications/vapid-key');
      const { publicKey } = await response.json();
      
      // Convertir key a Uint8Array
      return urlBase64ToUint8Array(publicKey);
    } catch (error) {
      console.error('❌ Error obteniendo VAPID key:', error);
      // Key temporal para desarrollo
      return urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa40HI80xchPojt2L0xJkB5IPBhwPowGQn7sO0_Hf5A9JbA7HCLQlAO9f4QXj0');
    }
  };

  const testNotification = async () => {
    try {
      const response = await fetchWithAuth('/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showAlert('🧪 Notificación de prueba enviada', 'info');
      }
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
      showAlert('Error enviando notificación de prueba', 'error');
    }
  };

  const renderStatus = () => {
    switch (pushStatus) {
      case 'checking':
        return (
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Verificando soporte...</span>
          </div>
        );

      case 'unsupported':
        return (
          <div className="alert alert-warning">
            <strong>⚠️ No Compatible</strong><br/>
            Tu navegador no soporta notificaciones push. 
            Actualiza tu navegador o usa Chrome/Firefox/Edge.
          </div>
        );

      case 'denied':
        return (
          <div className="alert alert-danger">
            <strong>🚫 Permisos Denegados</strong><br/>
            Has bloqueado las notificaciones. Para activarlas:
            <ol className="mt-2 mb-0">
              <li>Haz clic en el icono de candado en la barra de direcciones</li>
              <li>Cambia "Notificaciones" a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        );

      case 'permission_needed':
        return (
          <div className="alert alert-info">
            <strong>🔔 Activar Notificaciones</strong><br/>
            Recibe alertas importantes en tiempo real sobre pedidos, stock bajo y más.
            <button 
              className="btn btn-primary mt-2"
              onClick={requestPermissionAndSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Activando...
                </>
              ) : (
                '🔔 Activar Notificaciones'
              )}
            </button>
          </div>
        );

      case 'not_subscribed':
        return (
          <div className="alert alert-info">
            <strong>🔔 Notificaciones Disponibles</strong><br/>
            Activa las notificaciones para recibir alertas importantes.
            <button 
              className="btn btn-success mt-2"
              onClick={requestPermissionAndSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Suscribiendo...
                </>
              ) : (
                '✅ Suscribirse'
              )}
            </button>
          </div>
        );

      case 'subscribed':
        return (
          <div className="alert alert-success">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>✅ Notificaciones Activas</strong><br/>
                Recibirás alertas según tu configuración.
              </div>
              <div>
                <button 
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={testNotification}
                  disabled={isLoading}
                >
                  🧪 Probar
                </button>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={unsubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    '🔕 Desactivar'
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="alert alert-danger">
            <strong>❌ Error</strong><br/>
            Hubo un problema configurando las notificaciones.
            <button 
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={checkPushSupport}
            >
              🔄 Reintentar
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="push-notification-manager">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            🔔 Notificaciones Push
          </h5>
        </div>
        <div className="card-body">
          {renderStatus()}

          {showSettings && pushStatus === 'subscribed' && (
            <div className="mt-4">
              <h6>⚙️ Configuración</h6>
              
              {/* Tipos de notificaciones */}
              <div className="mb-3">
                <label className="form-label">Tipos de Notificaciones:</label>
                {Object.entries(settings.types).map(([type, enabled]) => (
                  <div key={type} className="form-check">
                    <input 
                      className="form-check-input"
                      type="checkbox"
                      id={`type-${type}`}
                      checked={enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        types: { ...prev.types, [type]: e.target.checked }
                      }))}
                    />
                    <label className="form-check-label" htmlFor={`type-${type}`}>
                      {getTypeLabel(type)}
                    </label>
                  </div>
                ))}
              </div>

              {/* Prioridades */}
              <div className="mb-3">
                <label className="form-label">Niveles de Prioridad:</label>
                {Object.entries(settings.priority).map(([priority, enabled]) => (
                  <div key={priority} className="form-check">
                    <input 
                      className="form-check-input"
                      type="checkbox"
                      id={`priority-${priority}`}
                      checked={enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        priority: { ...prev.priority, [priority]: e.target.checked }
                      }))}
                    />
                    <label className="form-check-label" htmlFor={`priority-${priority}`}>
                      {getPriorityLabel(priority)}
                    </label>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-primary"
                onClick={saveSettings}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  </>
                ) : (
                  '💾 Guardar Configuración'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getTypeLabel(type) {
  const labels = {
    pedido: '🛒 Nuevos Pedidos',
    stock_low: '⚠️ Stock Bajo',
    venta_completada: '✅ Ventas Completadas',
    campana_activa: '🎉 Nuevas Campañas'
  };
  return labels[type] || type;
}

function getPriorityLabel(priority) {
  const labels = {
    urgent: '🔴 Urgente (Sonido + Vibración)',
    high: '🟠 Alto (Sonido)',
    normal: '🟡 Normal',
    low: '🟢 Bajo (Silencioso)'
  };
  return labels[priority] || priority;
}

export default PushNotificationManager; 