import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../utils/api';
import { FaPlus, FaMinus, FaTrash, FaPlusCircle } from 'react-icons/fa';

const OrderEditModal = ({ show, onHide, order, onSave }) => {
  const [editedOrder, setEditedOrder] = useState(null);
  const [productToAdd, setProductToAdd] = useState('');

  // Fetch todos los productos para el selector
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => fetchWithAuth('/products').then(res => res.json()),
    enabled: show, // Solo fetch si el modal está abierto
  });

  useEffect(() => {
    // Deep copy of the order to avoid mutating the original object
    if (order) {
      setEditedOrder(JSON.parse(JSON.stringify(order)));
    }
  }, [order]);

  useEffect(() => {
    // Recalculate total whenever items change
    if (editedOrder && editedOrder.items) {
      const newTotal = editedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      setEditedOrder(currentOrder => ({ ...currentOrder, total: newTotal }));
    }
  }, [editedOrder?.items]);

  const handleItemQuantityChange = (productId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity, 10) || 1); // Minimum quantity is 1

    setEditedOrder(currentOrder => ({
      ...currentOrder,
      items: currentOrder.items.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      ),
    }));
  };

  const incrementQuantity = (productId) => {
    setEditedOrder(currentOrder => ({
      ...currentOrder,
      items: currentOrder.items.map(item =>
        item.product._id === productId ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  };

  const decrementQuantity = (productId) => {
    setEditedOrder(currentOrder => ({
      ...currentOrder,
      items: currentOrder.items.map(item =>
        item.product._id === productId && item.quantity > 1 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ),
    }));
  };
  
  const handleRemoveItem = (productId) => {
    setEditedOrder(currentOrder => ({
      ...currentOrder,
      items: currentOrder.items.filter(item => item.product._id !== productId),
    }));
  };

  const handleAddProduct = () => {
    if (!productToAdd) return;

    const product = products.find(p => p._id === productToAdd);
    if (!product) return;

    // Prevenir duplicados
    if (editedOrder.items.some(item => item.product._id === product._id)) {
      alert('Este producto ya está en el pedido. Puede editar su cantidad.');
      return;
    }
    
    const newItem = {
      product: {
        _id: product._id,
        name: product.name,
      },
      quantity: 1,
      price: product.price,
    };

    setEditedOrder(currentOrder => ({
      ...currentOrder,
      items: [...currentOrder.items, newItem],
    }));

    setProductToAdd(''); // Resetear el selector
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditedOrder(currentOrder => ({ ...currentOrder, [name]: value }));
  };

  const handleSaveChanges = () => {
    // Asegurarse de que el formato de 'items' es el correcto para el backend
    const finalOrder = {
      ...editedOrder,
      items: editedOrder.items.map(item => ({
        product: item.product._id, // Enviar solo el ID del producto
        quantity: item.quantity,
        price: item.price,
      })),
    };
    onSave(finalOrder);
  };

  if (!editedOrder) {
    return null;
  }

  // Filtrar productos que ya están en el pedido para no mostrarlos en el selector
  const availableProducts = products.filter(p => 
    !editedOrder.items.some(item => item.product._id === p._id)
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Pedido #{order.code}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Form>
          <fieldset className="mb-4">
            <legend className="fs-5 text-primary border-bottom pb-2 mb-3">Datos del Cliente</legend>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="userName" 
                    value={editedOrder.userName} 
                    onChange={handleFormChange} 
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    name="userEmail" 
                    value={editedOrder.userEmail} 
                    onChange={handleFormChange} 
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="userPhone" 
                    value={editedOrder.userPhone} 
                    onChange={handleFormChange} 
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="userAddress" 
                    value={editedOrder.userAddress} 
                    onChange={handleFormChange} 
                  />
                </Form.Group>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="fs-5 text-primary border-bottom pb-2 mb-3">Productos del Pedido</legend>
            
            {editedOrder.items.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p>No hay productos en este pedido</p>
              </div>
            ) : (
              <div className="mb-3">
                {editedOrder.items.map(item => (
                  <div key={item.product._id} className="card mb-2">
                    <div className="card-body py-2">
                      <div className="row align-items-center">
                        <div className="col-md-5">
                          <h6 className="mb-1">{item.product.name}</h6>
                          <small className="text-muted">Precio Unit.: ${item.price.toFixed(2)}</small>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex align-items-center justify-content-center">
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => decrementQuantity(item.product._id)}
                              disabled={item.quantity <= 1}
                            >
                              <FaMinus />
                            </Button>
                            <Form.Control
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(item.product._id, e.target.value)}
                              className="text-center mx-2"
                              style={{ width: '70px' }}
                            />
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => incrementQuantity(item.product._id)}
                            >
                              <FaPlus />
                            </Button>
                          </div>
                        </div>
                        <div className="col-md-2 text-center">
                          <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                        </div>
                        <div className="col-md-1 text-center">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleRemoveItem(item.product._id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Sección para agregar nuevo producto */}
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <FaPlusCircle className="me-2 text-success" />
                  Agregar Producto al Pedido
                </h6>
                <div className="row">
                  <div className="col-md-8">
                    <Form.Select 
                      value={productToAdd} 
                      onChange={(e) => setProductToAdd(e.target.value)}
                      disabled={isLoadingProducts}
                    >
                      <option value="">
                        {isLoadingProducts ? 'Cargando productos...' : 'Seleccionar un producto'}
                      </option>
                      {availableProducts.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} - ${p.price.toFixed(2)}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-4">
                    <Button 
                      variant="success" 
                      onClick={handleAddProduct} 
                      disabled={!productToAdd}
                      className="w-100"
                    >
                      <FaPlusCircle className="me-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
          
          <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
            <h5 className="mb-0">Total del Pedido:</h5>
            <h4 className="mb-0 text-success">${editedOrder.total.toFixed(2)}</h4>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Comentarios del Cliente</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              name="comments" 
              value={editedOrder.comments || ''} 
              onChange={handleFormChange}
              placeholder="Comentarios adicionales del cliente..."
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSaveChanges}>
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderEditModal; 