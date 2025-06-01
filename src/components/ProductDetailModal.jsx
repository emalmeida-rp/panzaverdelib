import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ProductDetailModal = ({ show, onHide, product, onShare }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  // Resetear la cantidad cuando cambia el producto o se abre el modal
  useEffect(() => {
    if (show && product) {
      setQuantity(1);
    }
  }, [show, product]);

  const handleAddToCart = () => {
    if (product && quantity > 0) {
      // Crear una copia del producto con la cantidad seleccionada
      const productWithQuantity = {
        ...product,
        quantity: quantity
      };
      addToCart(productWithQuantity);
      onHide();
    }
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-6 d-flex align-items-center justify-content-center">
            <img src={product.image} alt={product.name} className="img-fluid rounded product-modal-image" />
          </div>
          <div className="col-md-6">
            <h4 className="price mb-3">${product.price}</h4>
            <p className="description">{product.description}</p>
            <p className="stock">
              <strong>Stock disponible:</strong> {product.stock} unidades
            </p>
            {/* Contador de cantidad */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <label htmlFor="quantity" className="form-label mb-0">Cantidad:</label>
              <div className="input-group" style={{ width: '150px' }}>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <i className="bi bi-dash"></i>
                </button>
                <input
                  type="number"
                  className="form-control text-center"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0 && value <= product.stock) {
                      setQuantity(value);
                    }
                  }}
                  min="1"
                  max={product.stock}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>
            <div className="d-grid gap-2">
              <Button
                variant={product.isAvailable && product.stock > 0 ? "success" : "danger"}
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.isAvailable || product.stock <= 0}
              >
                {product.isAvailable && product.stock > 0 ? 'Agregar al carrito' : 'No disponible'}
              </Button>
            </div>
            {/* Botones de compartir visuales */}
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