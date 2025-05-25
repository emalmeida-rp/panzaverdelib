import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ProductDetailModal = ({ show, onHide, product }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <img 
            src={product.image} 
            alt={product.name} 
            className="img-fluid rounded" 
            style={{ maxHeight: '200px', objectFit: 'contain' }}
          />
        </div>
        <div className="mb-3">
          <h5 className="text-success mb-3">${product.price}</h5>
          <p className="text-muted">{product.description}</p>
          {product.stock > 0 ? (
            <p className="text-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              Stock disponible: {product.stock} unidades
            </p>
          ) : (
            <p className="text-danger">
              <i className="bi bi-x-circle-fill me-2"></i>
              Sin stock disponible
            </p>
          )}
        </div>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleAddToCart}
          disabled={!product.isAvailable || product.stock <= 0}
        >
          Agregar al carrito
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductDetailModal; 