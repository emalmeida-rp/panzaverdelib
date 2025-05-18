import React from 'react';
import { useAlert } from '../context/AlertContext';

const AlertToast = () => {
  const { alert } = useAlert();

  if (!alert) return null;

  return (
    <div
      className={`alert alert-${alert.type} position-fixed start-50 translate-middle-x bottom-0 mb-4 shadow`}
      style={{ zIndex: 9999, minWidth: 250, left: '50%' }}
      role="alert"
    >
      {alert.message}
    </div>
  );
};

export default AlertToast; 