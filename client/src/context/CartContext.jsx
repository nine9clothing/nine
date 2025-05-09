import React, { createContext, useState, useEffect, useContext } from 'react';
import { debounce } from 'lodash';
import supabase from '../lib/supabase';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext) || {};
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (e) {
      console.error('Error parsing local cart:', e);
      return [];
    }
  });
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Merge local and server carts to combine unique items
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

  useEffect(() => {
    if (authLoading) return;

    const loadCart = debounce(async () => {
      let localCart = [];
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            localCart = parsedCart;
            console.log('Restored cart from local storage:', localCart);
            setCartItems(localCart);
          } else {
            console.warn('Invalid local cart data, resetting.');
            localStorage.removeItem('cart');
          }
        }
      } catch (e) {
        console.error('Error parsing local cart:', e);
        localStorage.removeItem('cart');
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
            if (error.code === '42P01') {
              setSyncError('Cart database unavailable. Using local cart.');
            }
            // Keep local cart if Supabase fails
          } else if (data && Array.isArray(data.cart_items)) {
            console.log('Cart items fetched from Supabase:', data.cart_items);
            const mergedCart = mergeCarts(localCart, data.cart_items);
            setCartItems(mergedCart);
            try {
              localStorage.setItem('cart', JSON.stringify(mergedCart));
            } catch (e) {
              if (e.name === 'QuotaExceededError') {
                console.error('Local storage quota exceeded. Clearing cart.');
                localStorage.removeItem('cart');
                setCartItems([]);
                setSyncError('Cart cleared due to storage limits.');
              } else {
                console.error('Local storage unavailable:', e);
              }
            }
          } else {
            console.warn('No cart data found in Supabase for user:', user.id);
            if (localCart.length > 0) {
              // Sync local cart to Supabase if Supabase has no data
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
                console.error('Error syncing local cart to Supabase:', err.message);
                setSyncError('Failed to sync cart. Changes saved locally.');
              }
            }
          }
        } catch (err) {
          console.error('Unexpected error fetching cart:', err.message);
          setSyncError('Failed to fetch cart. Using local cart.');
        }
      } else {
        console.log('No user, using local cart');
      }
      setIsCartLoaded(true);
    }, 100);

    loadCart();
    return () => loadCart.cancel();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isCartLoaded || authLoading) return;

    const syncCart = debounce(async () => {
      try {
        if (user && user.id) {
          // Check if cart has changed
          const currentCart = JSON.stringify(cartItems);
          const { data: serverData } = await supabase
            .from('cart_data')
            .select('cart_items')
            .eq('user_id', user.id)
            .single();
          const lastSyncedCart = JSON.stringify(serverData?.cart_items || []);
          if (currentCart === lastSyncedCart) {
            console.log('No cart changes to sync.');
            setSyncError(null);
            return;
          }

          console.log('Syncing cart to Supabase for user ID:', user.id, cartItems);
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
            setSyncError('Failed to sync cart. Changes saved locally.');
          } else {
            try {
              localStorage.setItem('cart', JSON.stringify(cartItems));
              setSyncError(null);
            } catch (e) {
              if (e.name === 'QuotaExceededError') {
                console.error('Local storage quota exceeded. Clearing cart.');
                localStorage.removeItem('cart');
                setCartItems([]);
                setSyncError('Cart cleared due to storage limits.');
              } else {
                console.error('Local storage unavailable:', e);
                setSyncError('Failed to save cart locally.');
              }
            }
          }
        } else {
          console.log('No user, saving cart to local storage:', cartItems);
          try {
            localStorage.setItem('cart', JSON.stringify(cartItems));
            setSyncError(null);
          } catch (e) {
            if (e.name === 'QuotaExceededError') {
              console.error('Local storage quota exceeded. Clearing cart.');
              localStorage.removeItem('cart');
              setCartItems([]);
              setSyncError('Cart cleared due to storage limits.');
            } else {
              console.error('Local storage unavailable:', e);
              setSyncError('Failed to save cart locally.');
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error syncing cart:', err.message);
        setSyncError('Failed to sync cart. Changes saved locally.');
        try {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        } catch (e) {
          if (e.name === 'QuotaExceededError') {
            console.error('Local storage quota exceeded. Clearing cart.');
            localStorage.removeItem('cart');
            setCartItems([]);
            setSyncError('Cart cleared due to storage limits.');
          } else {
            console.error('Local storage unavailable:', e);
            setSyncError('Failed to save cart locally.');
          }
        }
      }
    }, 400);

    syncCart();
    return () => syncCart.cancel();
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

  const removeFromCart = (productId, selectedSize) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.id === productId && item.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => setCartItems([]);

  if (!isCartLoaded || authLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: 'black',
            border: '1px solid #Ffa500',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, syncError }}
    >
      {syncError && (
        <div style={{ color: 'red', textAlign: 'center', padding: '10px' }}>{syncError}</div>
      )}
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
// import React, { createContext, useState, useEffect, useContext } from 'react';
// import supabase from '../lib/supabase';
// import { AuthContext } from './AuthContext';

// export const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const { user, loading: authLoading } = useContext(AuthContext) || {};
//   const [cartItems, setCartItems] = useState(() => {
//     const savedCart = localStorage.getItem('cart');
//     return savedCart ? JSON.parse(savedCart) : [];
//   });
//   const [isCartLoaded, setIsCartLoaded] = useState(false);

//   useEffect(() => {
//     if (authLoading) return;

//     const loadCart = async () => {
//       const localCart = localStorage.getItem('cart');
//       if (localCart) {
//         const parsedCart = JSON.parse(localCart);
//         console.log('Restored cart from local storage:', parsedCart);
//         setCartItems(parsedCart); 
//       }

//       if (user && user.id) {
//         console.log('Fetching cart for user ID:', user.id);
//         try {
//           const { data, error } = await supabase
//             .from('cart_data')
//             .select('cart_items')
//             .eq('user_id', user.id)
//             .single();
//           if (error) {
//             console.error('Error fetching cart from Supabase:', error.message);
//             // Keep local cart if Supabase fails
//           } else if (data && data.cart_items) {
//             console.log('Cart items fetched from Supabase:', data.cart_items);
//             setCartItems(data.cart_items);
//             localStorage.setItem('cart', JSON.stringify(data.cart_items));
//           } else {
//             console.warn('No cart data found in Supabase for user:', user.id);
//             // Do NOT clear local storage; keep local cart
//             if (localCart && JSON.parse(localCart).length > 0) {
//               // Sync local cart to Supabase if Supabase has no data
//               await supabase
//                 .from('cart_data')
//                 .upsert(
//                   {
//                     user_id: user.id,
//                     cart_items: JSON.parse(localCart),
//                     updated_at: new Date().toISOString(),
//                   },
//                   { onConflict: 'user_id' }
//                 );
//             }
//           }
//         } catch (err) {
//           console.error('Unexpected error fetching cart:', err.message);
//         }
//       } else {
//         console.log('No user, using local cart');
//       }
//       setIsCartLoaded(true);
//     };

//     loadCart();
//   }, [user, authLoading]);

//   useEffect(() => {
//     if (!isCartLoaded || authLoading) return;

//     console.log('Cart items before sync:', cartItems);
//     const syncCart = async () => {
//       if (user && user.id) {
//         console.log('Syncing cart to Supabase for user ID:', user.id, cartItems);
//         try {
//           const { error } = await supabase
//             .from('cart_data')
//             .upsert(
//               {
//                 user_id: user.id,
//                 cart_items: cartItems,
//                 updated_at: new Date().toISOString(),
//               },
//               { onConflict: 'user_id' }
//             );
//           if (error) {
//             console.error('Error syncing cart to Supabase:', error.message);
//           } else {
//             localStorage.setItem('cart', JSON.stringify(cartItems));
//           }
//         } catch (err) {
//           console.error('Unexpected error syncing cart:', err.message);
//           localStorage.setItem('cart', JSON.stringify(cartItems));
//         }
//       } else {
//         console.log('No user, saving cart to local storage:', cartItems);
//         try {
//           localStorage.setItem('cart', JSON.stringify(cartItems));
//         } catch (e) {
//           console.error('Error saving to local storage:', e);
//         }
//       }
//     };

//     const timer = setTimeout(syncCart, 400);
//     return () => clearTimeout(timer);
//   }, [cartItems, user, isCartLoaded, authLoading]);

//   const addToCart = (product) => {
//     setCartItems((prev) => {
//       const exists = prev.find(
//         (item) => item.id === product.id && item.selectedSize === product.selectedSize
//       );
//       if (exists) {
//         return prev.map((item) =>
//           item.id === product.id && item.selectedSize === product.selectedSize
//             ? { ...item, quantity: item.quantity + (product.quantity || 1) }
//             : item
//         );
//       }
//       return [...prev, { ...product, quantity: product.quantity || 1 }];
//     });
//   };

//   const updateQuantity = (productId, quantity) => {
//     setCartItems((prev) =>
//       prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
//     );
//   };

//   const removeFromCart = (productId) => {
//     setCartItems((prev) => prev.filter((item) => item.id !== productId));
//   };

//   const clearCart = () => setCartItems([]);

//   if (!isCartLoaded || authLoading) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         Loading ...{' '}
//         <button
//           onClick={() => window.location.reload()}
//           style={{
//             padding: '8px 16px',
//             backgroundColor: '#007bff',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer',
//           }}
//         >
//           Refresh
//         </button>
//       </div>
//     );
//   }

//   return (
//     <CartContext.Provider
//       value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };