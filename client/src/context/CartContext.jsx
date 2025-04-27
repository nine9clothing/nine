// src/context/CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // ✅ Get Supabase user on mount & auth changes
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    };
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription?.subscription?.unsubscribe();
  }, []);

  // ✅ Load cart from Supabase or localStorage
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from('cart_data')
          .select('cart_items')
          .eq('user_id', currentUser.id)
          .single();

        if (!error && data?.cart_items) {
          setCartItems(data.cart_items);
        } else {
          console.warn('No cart data found or error:', error?.message);
        }
      } else {
        const local = localStorage.getItem('cart');
        if (local) {
          setCartItems(JSON.parse(local));
        }
      }
      setIsCartLoaded(true);
    };

    loadCart();
  }, [currentUser]);

  // ✅ Auto-sync cart to Supabase or localStorage
  useEffect(() => {
    if (!isCartLoaded) return;

    const timer = setTimeout(async () => {
      if (currentUser) {
        const { error } = await supabase
          .from('cart_data')
          .upsert({
            user_id: currentUser.id,
            cart_items: cartItems,
            updated_at: new Date().toISOString(),
          });

        if (error) console.error('Error updating cart in Supabase:', error.message);
      } else {
        try {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        } catch (e) {
          console.error('Error saving cart locally:', e);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cartItems, currentUser, isCartLoaded]);

  // ✅ Add item or increase quantity
  const addToCart = (product) => {
    setCartItems(prev => {
      const exists = prev.find(
        item => item.id === product.id && item.selectedSize === product.selectedSize
      );

      if (exists) {
        return prev.map(item =>
          item.id === product.id && item.selectedSize === product.selectedSize
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }

      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  // ✅ Update quantity
  const updateQuantity = (productId, quantity) => {
    setCartItems(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  // ✅ Remove one product
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // ✅ Clear all items
  const clearCart = () => setCartItems([]);

  if (!isCartLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading cart...</div>;
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
