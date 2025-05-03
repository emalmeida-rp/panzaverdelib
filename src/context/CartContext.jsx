import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(item => item.name === product.name);
      if (found) {
        // Si ya está, aumenta la cantidad
        return prev.map(item =>
          item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Si no está, lo agrega con cantidad 1
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Quitar producto del carrito
  const removeFromCart = (productName) => {
    setCart(prev => prev.filter(item => item.name !== productName));
  };

  // Cambiar cantidad
  const updateQuantity = (productName, quantity) => {
    setCart(prev =>
      prev.map(item =>
        item.name === productName ? { ...item, quantity } : item
      )
    );
  };

  // Vaciar carrito
  const clearCart = () => setCart([]);

  // Calcular total
  const getTotal = () => {
    return cart.reduce((acc, item) => {
      // Extraer el número del precio (ej: "$1500" -> 1500)
      const price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal }}>
      {children}
    </CartContext.Provider>
  );
}; 