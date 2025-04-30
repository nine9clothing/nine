import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../lib/supabase';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext) || {};
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const loadCart = async () => {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const parsedCart = JSON.parse(localCart);
        console.log('Restored cart from local storage:', parsedCart);
        setCartItems(parsedCart); 
      }

      if (user && user.id) {
        console.log('Fetching cart for user ID:', user.id);
        try {
          const { data, error } = await supabase
            .from('cart_data')
            .select('cart_items')
            .eq('user_id', user.id)
            .single();
          if (error) {
            console.error('Error fetching cart from Supabase:', error.message);
            // Keep local cart if Supabase fails
          } else if (data && data.cart_items) {
            console.log('Cart items fetched from Supabase:', data.cart_items);
            setCartItems(data.cart_items);
            localStorage.setItem('cart', JSON.stringify(data.cart_items));
          } else {
            console.warn('No cart data found in Supabase for user:', user.id);
            // Do NOT clear local storage; keep local cart
            if (localCart && JSON.parse(localCart).length > 0) {
              // Sync local cart to Supabase if Supabase has no data
              await supabase
                .from('cart_data')
                .upsert(
                  {
                    user_id: user.id,
                    cart_items: JSON.parse(localCart),
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' }
                );
            }
          }
        } catch (err) {
          console.error('Unexpected error fetching cart:', err.message);
        }
      } else {
        console.log('No user, using local cart');
      }
      setIsCartLoaded(true);
    };

    loadCart();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isCartLoaded || authLoading) return;

    console.log('Cart items before sync:', cartItems);
    const syncCart = async () => {
      if (user && user.id) {
        console.log('Syncing cart to Supabase for user ID:', user.id, cartItems);
        try {
          const { error } = await supabase
            .from('cart_data')
            .upsert(
              {
                user_id: user.id,
                cart_items: cartItems,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
          if (error) {
            console.error('Error syncing cart to Supabase:', error.message);
          } else {
            localStorage.setItem('cart', JSON.stringify(cartItems));
          }
        } catch (err) {
          console.error('Unexpected error syncing cart:', err.message);
          localStorage.setItem('cart', JSON.stringify(cartItems));
        }
      } else {
        console.log('No user, saving cart to local storage:', cartItems);
        try {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        } catch (e) {
          console.error('Error saving to local storage:', e);
        }
      }
    };

    const timer = setTimeout(syncCart, 400);
    return () => clearTimeout(timer);
  }, [cartItems, user, isCartLoaded, authLoading]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find(
        (item) => item.id === product.id && item.selectedSize === product.selectedSize
      );
      if (exists) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === product.selectedSize
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  if (!isCartLoaded || authLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading cart... Please Refresh </div>;
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};