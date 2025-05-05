// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import AuthProvider from './context/AuthContext';

// import Home from './pages/Home';
// import About from './pages/About';
// import Cart from './pages/Cart';
// import Contact from './pages/Contact';
// import Login from './pages/Login';
// import Sort from './pages/Sort';
// import ProductDetail from './pages/ProductDetail';
// import Success from './pages/Success';
// import Checkout from './pages/Checkout';
// import MyOrders from './pages/MyOrders';
// import WishlistPage from './pages/WishlistPage';
// import ResetPassword from './pages/ResetPassword';
// import FAQ from './pages/policy/FaqPage';
// import ShippingPolicy from './pages/policy/ShippingPolicy';
// import TermsAndConditions from './pages/policy/TermsAndConditions'; 
// import Exchange from './pages/policy/Exchange';
// import MyAccount from './pages/MyAccount';
// import Rewards from './pages/Rewards';
import ComingSoon from './pages/ComingSoon';

// import AdminLayout from './components/AdminLayout';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import AdminAddProduct from './pages/admin/AdminAddProduct'
// import AdminViewProduct from './pages/admin/AdminViewProduct'
// import AdminOrders from './pages/admin/AdminOrders';
// import AdminExchangeOrders from './pages/admin/AdminExchangeOrders';
// import AdminInsights from './pages/admin/AdminInsights';
// import AdminMessages from './pages/admin/AdminMessages';
// import AdminVideo from './pages/admin/AdminAddVideo';
// import AdminViewVideo from './pages/admin/AdminViewVideo'
// import AdminNotifySize from './pages/admin/AdminNotifySize'
// import AdminNewsletter from './pages/admin/AdminSubscription'
// import AdminCartLeftOver from './pages/admin/AdminCartLeftOver'
// import AdminPromoCode from './pages/admin/AdminPromoCode'
// import AdminViewPromoCode from './pages/admin/AdminViewPromoCode'



const App = () => {
  return (
    <AuthProvider>
    <BrowserRouter>
      <CartProvider>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<ComingSoon />} />
          {/* <Route path="/about" element={<About />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sort" element={<Sort />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/success" element={<Success />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shippingpolicy" element={<ShippingPolicy />} />
          <Route path="/t&c" element={<TermsAndConditions />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/rewards" element={<Rewards />} /> */}

          
          {/* Admin Routes (with custom layout) */}
          {/* <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminAddProduct />} />
            <Route path="viewproducts" element={<AdminViewProduct />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="exchange" element={<AdminExchangeOrders />} />
            <Route path="insights" element={<AdminInsights />} />
            <Route path="video" element={<AdminVideo />} />
            <Route path="viewvideo" element={<AdminViewVideo />} />
            <Route path="notifysize" element={<AdminNotifySize />} />
            <Route path="subscription" element={<AdminNewsletter />} />
            <Route path="cartleftover" element={<AdminCartLeftOver/>} />
            <Route path="promocode" element={<AdminPromoCode/>} />
            <Route path="viewpromocode" element={<AdminViewPromoCode/>} />

          </Route> */}
        </Routes>
      </CartProvider>
      </BrowserRouter>
      </AuthProvider>
  );
};

export default App;
