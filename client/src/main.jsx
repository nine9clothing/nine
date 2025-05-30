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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      {appContent}
    </CartProvider>
  </React.StrictMode>
);