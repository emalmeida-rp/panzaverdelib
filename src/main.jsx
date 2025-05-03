import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/global.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import 'aos/dist/aos.css';
import { CartProvider } from './context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
