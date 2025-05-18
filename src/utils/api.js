const API_URL = 'panzaverdelib-be-production.up.railway.app';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  console.log('Token almacenado:', token);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  console.log('Headers de la petición:', headers);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log('Respuesta del servidor:', response.status);

  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    throw new Error('Sesión expirada');
  }

  return response;
}; 