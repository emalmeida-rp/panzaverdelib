import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../../utils/api';
import { useAlert } from '../../../context/AlertContext';
import { ListGroup } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

const SalesModal = ({ show, onHide, sale, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [searchProduct, setSearchProduct] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();
  const isViewing = !!sale;

  const { data: productsData = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsForSale'],
    queryFn: async () => {
      const response = await fetchWithAuth('/products');
      if (!response.ok) throw new Error('Error al cargar productos');
      return response.json();
    },
    enabled: show && !isViewing,
  });

  useEffect(() => {
    if (sale) {
      setItems(sale.items.map(item => ({ 
        product: item.product, 
        quantity: item.quantity, 
        price: item.price || item.product.price 
      })));
      setCustomer({ 
        name: sale.customerName || '', 
        email: sale.customerEmail || '', 
        phone: sale.customerPhone || '' 
      });
    } else {
      setItems([]);
      setCustomer({ name: '', email: '', phone: '' });
      setSearchProduct('');
    }
  }, [sale]);

  const handleAddProduct = (product) => {
    if (items.find(i => i.product._id === product._id)) return;
    setItems([...items, { product, quantity: 1, price: product.price }]);
    setSearchProduct('');
  };

  const handleSave = async () => {
    if (items.length === 0) {
      showAlert('Debe agregar al menos un producto', 'warning');
      return;
    }

    setIsLoading(true);
    
    try {
      const saleData = {
        items: items.map(i => ({ 
          product: i.product._id, 
          quantity: i.quantity, 
          price: i.price 
        })),
        customerName: customer.name || 'Venta Presencial',
        customerEmail: customer.email || 'presencial@panzaverde.com',
        customerPhone: customer.phone || '',
        paymentMethod: 'efectivo'
      };

      console.log('Enviando datos de venta:', saleData);

      const response = await fetchWithAuth('/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Venta registrada:', result);
      
      showAlert('Venta registrada con éxito', 'success');
      onSuccess();
      onHide();
    } catch (err) {
      console.error('Error al registrar venta:', err);
      showAlert(`Error al registrar la venta: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const filteredProducts = productsData.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const handleRemoveItem = (productId) => {
    setItems(prev => prev.filter(i => i.product._id !== productId));
  };

  const handleChangeQuantity = (productId, quantity) => {
    const numQuantity = Number(quantity);
    if (numQuantity < 1) return;
    setItems(prev => prev.map(i => 
      i.product._id === productId ? { ...i, quantity: numQuantity } : i
    ));
  };

  const handleIncrementQuantity = (productId) => {
    setItems(prev => prev.map(i => {
      if (i.product._id === productId) {
        const newQuantity = i.quantity + 1;
        const availableStock = i.product.availableStock || i.product.stock;
        return newQuantity <= availableStock ? { ...i, quantity: newQuantity } : i;
      }
      return i;
    }));
  };

  const handleDecrementQuantity = (productId) => {
    setItems(prev => prev.map(i => {
      if (i.product._id === productId) {
        const newQuantity = i.quantity - 1;
        return newQuantity >= 1 ? { ...i, quantity: newQuantity } : i;
      }
      return i;
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isViewing ? 'Detalle de Venta' : 'Registrar Venta Presencial'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isViewing && (
          <div className="mb-3">
            <label className="form-label">Buscar Producto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o código..."
              value={searchProduct}
              onChange={e => setSearchProduct(e.target.value)}
            />
            {isLoadingProducts && <div className="text-muted mt-2">Cargando productos...</div>}
            {searchProduct && filteredProducts.length > 0 && (
              <ListGroup className="mt-2" style={{maxHeight: '150px', overflowY: 'auto'}}>
                {filteredProducts.slice(0, 5).map(p => (
                  <ListGroup.Item 
                    action 
                    key={p._id} 
                    onClick={() => handleAddProduct(p)} 
                    disabled={items.some(i => i.product._id === p._id)}
                    className={items.some(i => i.product._id === p._id) ? 'text-muted' : ''}
                  >
                    {p.name} - Stock: {p.availableStock || p.stock} - ${p.price}
                    {items.some(i => i.product._id === p._id) && ' (Ya agregado)'}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
        
        <hr />

        <h5>Items en la Venta</h5>
        {items.length === 0 ? (
          <p className="text-muted">No hay productos en la venta.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  {!isViewing && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product._id}>
                    <td>{item.product.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      {isViewing ? item.quantity : (
                        <div>
                          <div className="d-flex align-items-center" style={{width: '120px'}}>
                            <button 
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleDecrementQuantity(item.product._id)}
                              disabled={item.quantity <= 1}
                              style={{width: '30px', height: '30px', padding: '0', fontSize: '14px'}}
                            >
                              −
                            </button>
                            <input 
                              type="number" 
                              className="form-control mx-1 text-center" 
                              style={{width: '50px', height: '30px', fontSize: '14px'}} 
                              value={item.quantity}
                              min="1"
                              max={item.product.availableStock || item.product.stock}
                              onChange={(e) => handleChangeQuantity(item.product._id, e.target.value)}
                            />
                            <button 
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleIncrementQuantity(item.product._id)}
                              disabled={item.quantity >= (item.product.availableStock || item.product.stock)}
                              style={{width: '30px', height: '30px', padding: '0', fontSize: '14px'}}
                            >
                              +
                            </button>
                          </div>
                          <small className="text-muted d-block mt-1">
                            Stock: {item.product.availableStock || item.product.stock}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    {!isViewing && (
                      <td>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleRemoveItem(item.product._id)}
                          title="Eliminar producto"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <hr/>
        
        <h5>Datos del Cliente (Opcional)</h5>
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del cliente"
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
                disabled={isViewing}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="email@ejemplo.com"
                value={customer.email}
                onChange={e => setCustomer({...customer, email: e.target.value})}
                disabled={isViewing}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Teléfono del cliente"
                value={customer.phone}
                onChange={e => setCustomer({...customer, phone: e.target.value})}
                disabled={isViewing}
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <h4 className="mb-0">Total: ${total.toFixed(2)}</h4>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide} disabled={isLoading}>
          Cerrar
        </button>
        {!isViewing && (
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={items.length === 0 || isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Venta'}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SalesModal; 