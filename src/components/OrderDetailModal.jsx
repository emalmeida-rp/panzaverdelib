import React from 'react';
import Modal from 'react-bootstrap/Modal';
import styles from './OrderDetailModal.module.scss';

// Debes colocar tu imagen QR en la carpeta `public/img/qr-pago.png`
const QR_CODE_IMAGE_URL = '/img/qr-pago.png';

const OrderDetailModal = ({ show, onHide, order }) => {
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
            {order.status.replace('_', ' ')}
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
            <p>Escaneá el siguiente código QR con tu aplicación de pago para abonar el pedido.</p>
            <div className={styles.qrCodeContainer}>
              <img src={QR_CODE_IMAGE_URL} alt="Código QR para pago" className={styles.qrImage} />
            </div>
            <div className={styles.qrInstructions}>
              Una vez realizado el pago, notificanos por WhatsApp para que podamos confirmarlo y preparar tu pedido.
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