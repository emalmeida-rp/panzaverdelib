import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import styles from './OrderDetailModal.module.scss';
import { fetchWithAuth } from '../utils/api'; // Corregir la ruta de importación

const OrderDetailModal = ({ show, onHide, order }) => {
  if (!order) return null;

  // El modal solo muestra el QR para pedidos pendientes
  const isPendingPayment = order.status === 'pendiente' || order.status === 'pago_pendiente';

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pendiente':
        return { text: 'Pendiente de Pago', color: '#f39c12', icon: 'bi-hourglass-split' };
      case 'pago_pendiente':
        return { text: 'Pendiente de Pago', color: '#f39c12', icon: 'bi-hourglass-split' };
      case 'procesando':
        return { text: 'Procesando', color: '#3498db', icon: 'bi-arrow-repeat' };
      case 'enviado':
        return { text: 'Enviado', color: '#2ecc71', icon: 'bi-truck' };
      case 'completado':
        return { text: 'Completado', color: '#1abc9c', icon: 'bi-check-circle-fill' };
      case 'cancelado':
        return { text: 'Cancelado', color: '#e74c3c', icon: 'bi-x-circle-fill' };
      default:
        return { text: status.replace(/_/g, ' '), color: '#95a5a6', icon: 'bi-question-circle-fill' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  const handleClose = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detalle del Pedido #{order.code}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <div className={styles.content}>
          <div className={styles.statusSection}>
            <strong>Estado:</strong>
            <span className={styles.statusTag} style={{ backgroundColor: statusInfo.color }}>
              <i className={`bi ${statusInfo.icon}`}></i> {statusInfo.text}
            </span>
          </div>

          <strong className={styles.productsTitle}>Productos</strong>
          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.item}>
                <span className={styles.itemName}>{item.product?.name || 'Producto no disponible'} (x{item.quantity})</span>
                <span className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className={styles.totalSection}>
            <strong>Total:</strong>
            <span className={styles.totalAmount}>${order.total.toFixed(2)}</span>
          </div>
          
          {isPendingPayment && (
            <div className={styles.qrSection}>
              <h4 className={styles.qrTitle}>Realizá tu pago</h4>
              <p className={styles.qrInstructions}>Escaneá el código QR con tu app de Mercado Pago para abonar el pedido.</p>
              <div className={styles.qrCodeContainer}>
                {order.qrCodeBase64 ? (
                  <img src={`data:image/jpeg;base64,${order.qrCodeBase64}`} alt="Código QR para pago con Mercado Pago" className={styles.qrImage} />
                ) : (
                  <div className={styles.loader}>Estamos procesando el código QR. Estará disponible en breve.</div>
                )}
              </div>
              <p className={styles.qrFooter}>Una vez realizado el pago, el estado de tu pedido se actualizará automáticamente.</p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={handleClose}>
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetailModal; 