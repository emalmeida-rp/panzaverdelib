import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import History from './pages/History';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ItemListContainer from './components/ItemListContainer';
import AdminDashboard from './pages/admin/AdminDashboard';
import CartWidget from './components/CartWidget';
import { CartProvider } from './context/CartContext';
import { AlertProvider } from './context/AlertContext';
import AlertToast from './components/AlertToast';
import OrderForm from './pages/OrderForm';
import OrderConfirmation from './pages/OrderConfirmation';
import SocialWidget from './components/SocialWidget';
import './App.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/belpvsrvadm-ey') || location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      <AlertToast />
      {!isAdminRoute && <SocialWidget />}
      <main className="main-content">
        {children}
      </main>
      {!isAdminRoute && <CartWidget />}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AlertProvider>
      <CartProvider>
        <Router>
          <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<ItemListContainer />} />
                <Route path="/history" element={<History />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/belpvsrvadm-ey/login" element={<Login />} />
                <Route 
                  path="/belpvsrvadm-ey" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/order-form" element={<OrderForm />} />
                <Route path="/order-confirmation/:code" element={<OrderConfirmation />} />
              </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AlertProvider>
  );
}

export default App;
