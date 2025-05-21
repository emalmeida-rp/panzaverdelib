import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const location = useLocation();

  if (!token) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/belpvsrvadm-ey/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 