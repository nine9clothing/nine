import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { WishlistProvider } from './context/WishlistContext';

const currentPath = window.location.pathname;

const appContent =
  currentPath === '/resetpassword' ? (
    <App />
  ) : (
    <WishlistProvider>
      <App />
    </WishlistProvider>
  );
// pages/_app.js
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Suppress specific Supabase errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('406') && message.includes('supabase.co')) {
        return; // Don't log this error
      }
      originalError.apply(console, args);
    };
    
    // Cleanup on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return <Component {...pageProps} />;
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      {appContent}
    </CartProvider>
  </React.StrictMode>
);