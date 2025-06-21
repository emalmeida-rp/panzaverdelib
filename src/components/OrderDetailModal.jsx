import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import styles from './OrderDetailModal.module.scss';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const OrderDetailModal = ({ show, onHide, order }) => {
  const [qrCode, setQrCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Solo generar QR si el modal está visible, el pedido existe y está pendiente
    if (show && order && order.status === 'pendiente') {
      const generateQrCode = async () => {
        setIsLoading(true);
        setError('');
        setQrCode('');
        try {
          const response = await axios.post(`${API_URL}/mercadopago/create-preference`, {
            orderId: order._id,
          });

          if (response.data && response.data.qr_code_base64) {
            setQrCode(`data:image/jpeg;base64,${response.data.qr_code_base64}`);
          } else {
            setError('No se pudo generar el código QR. Inténtalo de nuevo.');
          }
        } catch (err) {
          console.error('Error al generar QR de Mercado Pago:', err);
          setError('Hubo un problema al generar el QR. Por favor, contacta al soporte.');
        } finally {
          setIsLoading(false);
        }
      };

      generateQrCode();
    }
  }, [show, order]);

  if (!order) return null;

  const isPendingPayment = order.status === 'pendiente';

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalTitle}>
          Detalle del Pedido: <span className={styles.orderCode}>#{order.code}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <div className={styles.statusSection}>
          Estado del pedido:
          <span className={`${styles.statusBadge} ${styles[order.status]}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        <h5 className={styles.sectionTitle}>Productos</h5>
        <div className={styles.itemsList}>
          {order.items.map((item, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{item.product?.name || 'Producto no disponible'}</span>
                <span className={styles.itemQuantity}>Cantidad: {item.quantity}</span>
              </div>
              <div className={styles.itemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.totalSection}>
          <strong>Total del Pedido:</strong>
          <span className={styles.totalAmount}>${order.total.toFixed(2)}</span>
        </div>

        {isPendingPayment && (
          <div className={styles.qrSection}>
            <h5 className={styles.sectionTitle}>Realizá tu pago</h5>
            <p>Escaneá el código QR con tu app de Mercado Pago para abonar el pedido.</p>
            <div className={styles.qrCodeContainer}>
              {isLoading && <div className={styles.loader}>Generando QR...</div>}
              {error && <div className={styles.error}>{error}</div>}
              {qrCode && !isLoading && !error && (
                <img src={qrCode} alt="Código QR para pago con Mercado Pago" className={styles.qrImage} />
              )}
            </div>
            <div className={styles.qrInstructions}>
              Una vez realizado el pago, el estado de tu pedido se actualizará automáticamente.
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetailModal; 