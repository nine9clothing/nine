import React, { createContext, useState, useEffect, useContext } from 'react';
import { debounce } from 'lodash';
import supabase from '../lib/supabase';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext) || {};
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status

  const mergeCarts = (localCart, serverCart) => {
    const merged = [...serverCart];
    localCart.forEach((localItem) => {
      const exists = serverCart.some(
        (serverItem) =>
          serverItem.id === localItem.id && serverItem.selectedSize === localItem.selectedSize
      );
      if (!exists) {
        merged.push(localItem);
      }
    });
    return merged;
  };

  // Check if user is admin
  useEffect(() => {
    if (authLoading || !user) {
      setIsAdmin(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { data: isAdmin } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .single();
        setIsAdmin(!!isAdmin);
      } catch (err) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || isAdmin) {
      setCartItems([]);
      localStorage.removeItem('cart');
      setIsCartLoaded(true);
      return;
    }

    const loadCart = debounce(async () => {
      if (!user) {
        setCartItems([]);
        localStorage.removeItem('cart');
        setIsCartLoaded(true);
        return;
      }

      let localCart = [];
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            localCart = parsedCart;
            setCartItems(localCart);
          } else {
            localStorage.removeItem('cart');
          }
        }
      } catch (e) {
        localStorage.removeItem('cart');
      }

      if (user && user.id) {
        try {
          const { data, error } = await supabase
            .from('cart_data')
            .select('cart_items')
            .eq('user_id', user.id)
            .single();
          if (error) {
            if (error.code === '42P01') {
              setSyncError('Cart database unavailable. Using local cart.');
            }
            setCartItems(localCart);
          } else if (data && Array.isArray(data.cart_items)) {
            const mergedCart = mergeCarts(localCart, data.cart_items);
            setCartItems(mergedCart);
            try {
              localStorage.setItem('cart', JSON.stringify(mergedCart));
            } catch (e) {
              if (e.name === 'QuotaExceededError') {
                localStorage.removeItem('cart');
                setCartItems([]);
                setSyncError('Cart cleared due to storage limits.');
              } else {
              }
            }
          } else {
            if (localCart.length > 0) {
              try {
                await supabase
                  .from('cart_data')
                  .upsert(
                    {
                      user_id: user.id,
                      cart_items: localCart,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                  );
              } catch (err) {
                setSyncError('Failed to sync cart. Changes saved locally.');
              }
            }
            setCartItems(localCart);
          }
        } catch (err) {
          setSyncError('Failed to fetch cart. Using local cart.');
          setCartItems(localCart);
        }
      }
      setIsCartLoaded(true);
    }, 100);

    loadCart();
    return () => loadCart.cancel();
  }, [user, authLoading, isAdmin]);

  useEffect(() => {
    if (!isCartLoaded || authLoading || isAdmin) return;

    const syncCart = debounce(async () => {
      if (!user) {
        return;
      }

      try {
        if (user && user.id) {
          const currentCart = JSON.stringify(cartItems);
          const { data: serverData } = await supabase
            .from('cart_data')
            .select('cart_items')
            .eq('user_id', user.id)
            .single();
          const lastSyncedCart = JSON.stringify(serverData?.cart_items || []);
          if (currentCart === lastSyncedCart) {
            setSyncError(null);
            return;
          }

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
            setSyncError('Failed to sync cart. Changes saved locally.');
          } else {
            try {
              localStorage.setItem('cart', JSON.stringify(cartItems));
              setSyncError(null);
            } catch (e) {
              if (e.name === 'QuotaExceededError') {
                localStorage.removeItem('cart');
                setCartItems([]);
                setSyncError('Cart cleared due to storage limits.');
              } else {
                setSyncError('Failed to save cart locally.');
              }
            }
          }
        }
      } catch (err) {
        setSyncError('Failed to sync cart. Changes saved locally.');
        try {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        } catch (e) {
          if (e.name === 'QuotaExceededError') {
            localStorage.removeItem('cart');
            setCartItems([]);
            setSyncError('Cart cleared due to storage limits.');
          } else {
            setSyncError('Failed to save cart locally.');
          }
        }
      }
    }, 400);

    syncCart();
    return () => syncCart.cancel();
  }, [cartItems, user, isCartLoaded, authLoading, isAdmin]);

  const addToCart = (product) => {
    if (!user || isAdmin) {
      return;
    }
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

  const updateQuantity = (productId, selectedSize, quantity) => {
    if (isAdmin) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId, selectedSize) => {
    if (isAdmin) return;
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.id === productId && item.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => {
    if (isAdmin) return;
    setCartItems([]);
  };

  const updateCartItemPrice = (productId, selectedSize, newPrice) => {
    if (isAdmin) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, price: newPrice }
          : item
      )
    );
  };

  if (!isCartLoaded || authLoading) {
    return (
      <div
        style={{
          backgroundColor: 'black',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'white',
          paddingTop: '20px',
        }}
      >
        <p>Loading...</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 10px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        syncError,
        updateCartItemPrice,
        user,
        authLoading,
      }}
    >
      {syncError && !isAdmin && (
        <div style={{ color: 'red', textAlign: 'center', padding: '10px' }}>
          {syncError}
        </div>
      )}
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;