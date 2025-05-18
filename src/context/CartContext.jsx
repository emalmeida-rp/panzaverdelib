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
        // Si ya está y hay stock disponible, aumenta la cantidad
        if (found.quantity < product.stock) {
          return prev.map(item =>
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prev; // Si no hay stock, no hace nada
      } else {
        // Si no está, lo agrega con cantidad 1
        return [...prev, { ...product, quantity: 1 }];
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