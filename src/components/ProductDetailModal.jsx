import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Modal from 'react-bootstrap/Modal';

// Utilidad para buscar campaña y calcular precio final
function getActiveCampaign(product, campaigns = []) {
  if (!product || !Array.isArray(campaigns)) return null;
  return campaigns.find(c => (c.products || []).includes(product._id) || c._id === product.campaignId || c._id === product.campaign?._id) || null;
}

function getFinalPrice(product, campaign) {
  if (!product) return 0;
  if (!campaign || !campaign.discountType) return product.price;
  let finalPrice = product.price;
  if (campaign.discountType === 'percent') {
    finalPrice = product.price * (1 - campaign.discountValue / 100);
  } else if (campaign.discountType === 'fixed') {
    finalPrice = Math.max(0, product.price - campaign.discountValue);
  }
  return Number(finalPrice.toFixed(2));
}

const ProductDetailModal = ({ show, onHide, product, onShare, campaigns }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (show && product) {
      setQuantity(1);
    }
  }, [show, product]);

  // Limpiar estado cuando se cierre
  useEffect(() => {
    if (!show) {
      setQuantity(1);
    }
  }, [show]);

  if (!product) return null;

  // Centralizar lógica de campaña y precio
  const campaign = getActiveCampaign(product, campaigns);
  const finalPrice = getFinalPrice(product, campaign);

  const handleAddToCart = () => {
    if (product && quantity > 0) {
      const productWithQuantity = {
        ...product,
        price: finalPrice,
        quantity: quantity
      };
      addToCart(productWithQuantity);
      onHide();
    }
  };

  const handleClose = () => {
    setQuantity(1);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-6 d-flex align-items-center justify-content-center">
            <img src={product.image} alt={product.name} className="img-fluid rounded product-modal-image" />
          </div>
          <div className="col-md-6">
            {campaign && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  background: campaign.color || '#e67e22',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '0.4em 1em',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginRight: 8,
                  display: 'inline-block',
                }}>
                  {campaign.discountType === 'percent'
                    ? `-${campaign.discountValue}% OFF`
                    : `-$${campaign.discountValue} OFF`}
                </span>
                <span style={{ color: campaign.color || '#e67e22', fontWeight: 500 }}>
                  {campaign.name || 'Campaña activa'}
                </span>
              </div>
            )}
            <h4 className="price mb-3" style={{ color: '#218838', fontWeight: 700 }}>
              ${finalPrice.toFixed(2)}
              {campaign && (
                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1rem', marginLeft: 10 }}>
                  ${product.price.toFixed(2)}
                </span>
              )}
            </h4>
            <p className="description">{product.description}</p>
            <p className="stock">
              <strong>Stock disponible:</strong> {product.stock} unidades
            </p>
            <div className="d-flex align-items-center mb-3">
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span className="mx-3">{quantity}</span>
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>
            <button className="btn btn-primary w-100" onClick={handleAddToCart}>
              Agregar al carrito
            </button>
            <div className="share-section mt-4">
              <h5>Compartir producto:</h5>
              <div className="share-buttons d-flex gap-4 mt-2 justify-content-center flex-wrap">
                <div className="share-btn-bs-vertical text-center">
                  <button
                    className="btn btn-outline-primary share-btn-bs-circle d-flex align-items-center justify-content-center mx-auto"
                    onClick={() => onShare(product, 'facebook')}
                    title="Compartir en Facebook"
                  >
                    <i className="bi bi-facebook share-icon"></i>
                  </button>
                  <div className="share-label mt-2">Facebook</div>
                </div>
                <div className="share-btn-bs-vertical text-center">
                  <button
                    className="btn btn-outline-info share-btn-bs-circle d-flex align-items-center justify-content-center mx-auto"
                    onClick={() => onShare(product, 'twitter')}
                    title="Compartir en Twitter"
                  >
                    <i className="bi bi-twitter share-icon"></i>
                  </button>
                  <div className="share-label mt-2">Twitter</div>
                </div>
                <div className="share-btn-bs-vertical text-center">
                  <button
                    className="btn btn-outline-success share-btn-bs-circle d-flex align-items-center justify-content-center mx-auto"
                    onClick={() => onShare(product, 'whatsapp')}
                    title="Compartir en WhatsApp"
                  >
                    <i className="bi bi-whatsapp share-icon"></i>
                  </button>
                  <div className="share-label mt-2">WhatsApp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductDetailModal; 