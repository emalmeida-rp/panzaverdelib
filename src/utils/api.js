const API_URL = import.meta.env.VITE_API_URL;

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
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    let errorMsg = 'Error en el servidor';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Si no es JSON, deja el mensaje por defecto
    }
    throw new Error(errorMsg);
  }

  return response;
}; 