// === PANZA VERDE PUSH NOTIFICATIONS SERVICE WORKER ===
// Versión: 1.0.0 - Sistema Profesional de Notificaciones

const CACHE_NAME = 'panza-verde-notifications-v1';
const API_BASE_URL = self.location.origin;

// === INSTALACIÓN Y ACTIVACIÓN ===

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/img/Logo.webp',
        '/assets/images/Logo.webp'
      ]);
    })
  );
  
  // Tomar control inmediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Reclamar todos los clientes
  return self.clients.claim();
});

// === MANEJO DE PUSH NOTIFICATIONS ===

self.addEventListener('push', (event) => {
  console.log('📨 Push recibido:', event);
  
  let notificationData = {};
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('❌ Error parseando push data:', error);
    notificationData = { 
      title: '📢 Panza Verde',
      message: 'Nueva notificación disponible',
      priority: 'normal'
    };
  }
  
  // Configuración por prioridad
  const config = getNotificationConfig(notificationData.priority || 'normal');
  
  const notificationOptions = {
    body: notificationData.message,
    icon: '/img/Logo.webp',
    badge: '/img/Logo.webp',
    image: notificationData.image || null,
    
    // Configuración según prioridad
    requireInteraction: config.persistent,
    silent: !config.sound,
    vibrate: config.vibration ? [200, 100, 200] : undefined,
    
    // Datos para el click handler
    data: {
      id: notificationData.id,
      link: notificationData.link || '/admin',
      type: notificationData.type,
      priority: notificationData.priority,
      timestamp: Date.now()
    },
    
    // Acciones rápidas
    actions: getNotificationActions(notificationData.type),
    
    // Configuración visual
    tag: `panza-verde-${notificationData.type || 'general'}`,
    renotify: config.persistent,
    
    // Auto-close (si no es persistente)
    ...(!config.persistent && config.autoClose ? { 
      tag: `auto-close-${Date.now()}` 
    } : {})
  };
  
  // Mostrar notificación
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || '📢 Panza Verde',
      notificationOptions
    ).then(() => {
      // Reportar entrega al servidor
      reportNotificationDelivered(notificationData.id);
      
      // Programar auto-close si corresponde
      if (!config.persistent && config.autoClose) {
        setTimeout(() => {
          closeNotificationByTag(`auto-close-${Date.now()}`);
        }, config.autoClose);
      }
    })
  );
});

// === MANEJO DE CLICKS EN NOTIFICACIONES ===

self.addEventListener('notificationclick', (event) => {
  console.log('👆 Click en notificación:', event);
  
  const { data } = event.notification;
  const { action } = event;
  
  // Cerrar notificación
  event.notification.close();
  
  // Reportar click al servidor
  reportNotificationClicked(data.id, action);
  
  // Manejar acciones
  event.waitUntil(
    handleNotificationAction(action, data)
  );
});

// === MANEJO DE CIERRE DE NOTIFICACIONES ===

self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event);
  
  const { data } = event.notification;
  
  // Reportar descarte al servidor
  reportNotificationDismissed(data.id);
});

// === FUNCIONES AUXILIARES ===

function getNotificationConfig(priority) {
  const configs = {
    low: {
      sound: false,
      vibration: false,
      persistent: false,
      autoClose: 8000
    },
    normal: {
      sound: true,
      vibration: false,
      persistent: false,
      autoClose: 12000
    },
    high: {
      sound: true,
      vibration: true,
      persistent: false,
      autoClose: 20000
    },
    urgent: {
      sound: true,
      vibration: true,
      persistent: true,
      autoClose: null
    }
  };
  
  return configs[priority] || configs.normal;
}

function getNotificationActions(type) {
  const actionSets = {
    pedido: [
      {
        action: 'view_order',
        title: '👁️ Ver Pedido',
        icon: '/img/Logo.webp'
      },
      {
        action: 'mark_processed',
        title: '✅ Marcar Procesado',
        icon: '/img/Logo.webp'
      }
    ],
    stock_low: [
      {
        action: 'view_product',
        title: '📦 Ver Producto',
        icon: '/img/Logo.webp'
      },
      {
        action: 'restock',
        title: '➕ Reabastecer',
        icon: '/img/Logo.webp'
      }
    ],
    venta_completada: [
      {
        action: 'view_sale',
        title: '💰 Ver Venta',
        icon: '/img/Logo.webp'
      }
    ],
    campana_activa: [
      {
        action: 'view_campaign',
        title: '🎉 Ver Campaña',
        icon: '/img/Logo.webp'
      }
    ]
  };
  
  return actionSets[type] || [
    {
      action: 'view',
      title: '👁️ Ver',
      icon: '/img/Logo.webp'
    }
  ];
}

async function handleNotificationAction(action, data) {
  const { link, type, id } = data;
  
  try {
    // Buscar o abrir ventana del admin
    const clientsList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    let adminClient = clientsList.find(client => 
      client.url.includes('/admin') || client.url.includes('/belpsrvadm-ey')
    );
    
    let targetUrl = '/admin';
    
    // Determinar URL según acción
    switch (action) {
      case 'view_order':
        targetUrl = `/admin/orders/${id}`;
        break;
      case 'view_product':
        targetUrl = `/admin/products/${id}`;
        break;
      case 'view_sale':
        targetUrl = `/admin/sales/${id}`;
        break;
      case 'view_campaign':
        targetUrl = `/admin/campaigns/${id}`;
        break;
      case 'mark_processed':
        // Llamar API para marcar como procesado
        await markOrderAsProcessed(id);
        return; // No navegar
      case 'restock':
        targetUrl = `/admin/products/${id}?action=restock`;
        break;
      default:
        targetUrl = link || '/admin';
    }
    
    if (adminClient) {
      // Enfocar ventana existente y navegar
      await adminClient.focus();
      adminClient.postMessage({
        type: 'NAVIGATE',
        url: targetUrl
      });
    } else {
      // Abrir nueva ventana
      await self.clients.openWindow(targetUrl);
    }
    
  } catch (error) {
    console.error('❌ Error manejando acción:', error);
    // Fallback: abrir admin general
    await self.clients.openWindow('/admin');
  }
}

// === COMUNICACIÓN CON EL SERVIDOR ===

async function reportNotificationDelivered(notificationId) {
  if (!notificationId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/delivered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error reportando entrega:', error);
  }
}

async function reportNotificationClicked(notificationId, action) {
  if (!notificationId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/clicked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
  } catch (error) {
    console.error('❌ Error reportando click:', error);
  }
}

async function reportNotificationDismissed(notificationId) {
  if (!notificationId) return;
  
  try {
    await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/dismissed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error reportando descarte:', error);
  }
}

async function markOrderAsProcessed(orderId) {
  try {
    await fetch(`${API_BASE_URL}/api/orders/${orderId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Mostrar confirmación
    self.registration.showNotification('✅ Pedido Procesado', {
      body: 'El pedido ha sido marcado como procesado',
      icon: '/img/Logo.webp',
      tag: 'confirmation',
      requireInteraction: false,
      data: { autoClose: true }
    });
    
  } catch (error) {
    console.error('❌ Error procesando pedido:', error);
    
    self.registration.showNotification('❌ Error', {
      body: 'No se pudo procesar el pedido',
      icon: '/img/Logo.webp',
      tag: 'error',
      requireInteraction: false
    });
  }
}

function closeNotificationByTag(tag) {
  self.registration.getNotifications({ tag }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
}

// === MANEJO DE MENSAJES DEL CLIENTE ===

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CLOSE_NOTIFICATIONS':
      // Cerrar todas las notificaciones
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
      break;
      
    case 'GET_SUBSCRIPTION':
      // Enviar información de suscripción
      event.ports[0].postMessage({
        subscription: self.registration.pushManager.getSubscription()
      });
      break;
  }
});

console.log('🚀 Service Worker Panza Verde cargado correctamente'); 