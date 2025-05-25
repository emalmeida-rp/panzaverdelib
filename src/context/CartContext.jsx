import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(item => item._id === product._id);
      if (found) {
        // Si ya está y hay stock disponible, actualiza la cantidad
        if (found.quantity + product.quantity <= product.stock) {
          return prev.map(item =>
            item._id === product._id ? { ...item, quantity: item.quantity + product.quantity } : item
          );
        }
        return prev; // Si no hay stock suficiente, no hace nada
      } else {
        // Si no está, lo agrega con la cantidad especificada
        return [...prev, product];
      }
    });
  };

  // Quitar producto del carrito
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  // Cambiar cantidad
  const updateQuantity = (productId, quantity, maxStock) => {
    if (quantity < 1 || quantity > maxStock) return;
    
    setCart(prev =>
      prev.map(item =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Vaciar carrito
  const clearCart = () => setCart([]);

  // Calcular total
  const getTotal = () => {
    return cart.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
}; 