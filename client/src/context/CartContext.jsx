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
//     return <div style={{ padding: '20px', textAlign: 'center' }}>Loading ... Please Refresh </div>;
//   }

//   return (
//     <CartContext.Provider
//       value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// // };




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
//   const [showLoading, setShowLoading] = useState(true);
//   const [loadingError, setLoadingError] = useState(null);
//   const [retryCount, setRetryCount] = useState(0);

//   const MAX_RETRIES = 1;
//   const QUERY_TIMEOUT = 3000;

//   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   useEffect(() => {
//     if (authLoading) return;

//     const loadCart = async () => {
//       console.log(`Attempt ${retryCount + 1}: Trying to load cart...`);

//       // Load from local storage
//       const localCart = localStorage.getItem('cart');
//       let parsedLocalCart = [];
//       if (localCart) {
//         parsedLocalCart = JSON.parse(localCart);
//         console.log('Loaded cart from localStorage:', parsedLocalCart);
//         setCartItems(parsedLocalCart);
//       }

//       if (user?.id) {
//         try {
//           if (!supabase) {
//             throw new Error('Supabase client not initialized');
//           }
//           console.log('Supabase client initialized:', !!supabase);

//           const query = {
//             table: 'cart_data',
//             select: 'cart_items',
//             filters: { user_id: user.id },
//             type: 'maybeSingle'
//           };
//           console.log('Executing Supabase query:', JSON.stringify(query, null, 2));

//           const timeoutPromise = new Promise((_, reject) =>
//             setTimeout(() => reject(new Error('Query timed out')), QUERY_TIMEOUT)
//           );

//           const supabasePromise = supabase
//             .from('cart_data')
//             .select('cart_items')
//             .eq('user_id', user.id)
//             .maybeSingle();

//           const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);

//           if (error) {
//             console.error(`Attempt ${retryCount + 1}: Cart load failed`, {
//               error: error.message,
//               code: error.code || 'N/A',
//               details: error.details || 'N/A',
//               hint: error.hint || 'N/A',
//               query: JSON.stringify(query, null, 2),
//               userId: user.id
//             });
//             throw new Error(`Supabase error: ${error.message}`);
//           }

//           if (data?.cart_items) {
//             setCartItems(data.cart_items);
//             localStorage.setItem('cart', JSON.stringify(data.cart_items));
//             console.log('Updated localStorage with server cart:', data.cart_items);
//           } else {
//             // No cart record exists, initialize with local cart
//             const initialCart = parsedLocalCart;
//             console.log('No server cart found, syncing local cart to server');
//             const { error: upsertError } = await supabase
//               .from('cart_data')
//               .upsert(
//                 {
//                   user_id: user.id,
//                   cart_items: initialCart,
//                   updated_at: new Date().toISOString()
//                 },
//                 { onConflict: 'user_id' }
//               );
//             if (upsertError) {
//               console.error('Upsert failed:', {
//                 error: upsertError.message,
//                 code: upsertError.code || 'N/A',
//                 details: upsertError.details || 'N/A'
//               });
//             } else {
//               console.log('Successfully synced local cart to server');
//               setCartItems(initialCart);
//               localStorage.setItem('cart', JSON.stringify(initialCart));
//             }
//           }

//           setIsCartLoaded(true);
//           setShowLoading(false);
//           setRetryCount(0); // Reset retry count on success
//         } catch (err) {
//           console.error(`Attempt ${retryCount + 1}: Unexpected error`, {
//             message: err.message,
//             stack: err.stack || 'N/A'
//           });
//           if (retryCount < MAX_RETRIES) {
//             await delay(1000); // Wait 1 second before retrying
//             setRetryCount(prev => prev + 1);
//           } else {
//             console.log('Max retries reached, falling back to local cart');
//             setLoadingError(err.message);
//             setIsCartLoaded(true);
//             setShowLoading(false);
//           }
//         }
//       } else {
//         console.log('No user, using local cart');
//         setIsCartLoaded(true);
//         setShowLoading(false);
//       }
//     };

//     if (!isCartLoaded && retryCount <= MAX_RETRIES) {
//       loadCart();
//     }

//     return () => {};
//   }, [user?.id, authLoading, retryCount, isCartLoaded]);

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
//             console.error('Error syncing cart to Supabase:', {
//               error: error.message,
//               code: error.code || 'N/A',
//               details: error.details || 'N/A'
//             });
//           } else {
//             localStorage.setItem('cart', JSON.stringify(cartItems));
//             console.log('Successfully synced cart to localStorage:', cartItems);
//           }
//         } catch (err) {
//           console.error('Unexpected error syncing cart:', {
//             message: err.message,
//             stack: err.stack || 'N/A'
//           });
//           localStorage.setItem('cart', JSON.stringify(cartItems));
//           console.log('Saved cart to localStorage due to sync error:', cartItems);
//         }
//       } else {
//         console.log('No user, saving cart to local storage:', cartItems);
//         try {
//           localStorage.setItem('cart', JSON.stringify(cartItems));
//           console.log('Successfully saved cart to localStorage:', cartItems);
//         } catch (e) {
//           console.error('Error saving to local storage:', {
//             message: e.message,
//             stack: e.stack || 'N/A'
//           });
//         }
//       }
//     };

//     const timer = setTimeout(syncCart, 400);
//     return () => clearTimeout(timer);
//   }, [cartItems, user, isCartLoaded, authLoading]);

//   const addToCart = (product) => {
//     console.log('Adding product to cart:', product);
//     setCartItems((prev) => {
//       const exists = prev.find(
//         (item) => item.id === product.id && item.selectedSize === product.selectedSize
//       );
//       if (exists) {
//         const updatedCart = prev.map((item) =>
//           item.id === product.id && item.selectedSize === product.selectedSize
//             ? { ...item, quantity: item.quantity + (product.quantity || 1) }
//             : item
//         );
//         console.log('Updated existing product quantity:', updatedCart);
//         return updatedCart;
//       }
//       const newCart = [...prev, { ...product, quantity: product.quantity || 1 }];
//       console.log('Added new product to cart:', newCart);
//       return newCart;
//     });
//   };

//   const updateQuantity = (productId, quantity) => {
//     console.log(`Updating quantity for product ID: ${productId} to ${quantity}`);
//     setCartItems((prev) => {
//       const updatedCart = prev.map((item) =>
//         item.id === productId ? { ...item, quantity } : item
//       );
//       console.log('Updated cart after quantity change:', updatedCart);
//       return updatedCart;
//     });
//   };

//   const removeFromCart = (productId) => {
//     console.log(`Removing product ID: ${productId} from cart`);
//     setCartItems((prev) => {
//       const updatedCart = prev.filter((item) => item.id !== productId);
//       console.log('Updated cart after removal:', updatedCart);
//       return updatedCart;
//     });
//   };

//   const clearCart = () => {
//     console.log('Clearing cart');
//     setCartItems([]);
//     console.log('Cart cleared');
//   };

//   const retryLoading = () => {
//     console.log('Manual retry initiated');
//     setShowLoading(true);
//     setLoadingError(null);
//     setRetryCount(0);
//     setIsCartLoaded(false);
//   };

//   if (showLoading) {
//     return (
//       <div style={{
//         height: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         flexDirection: 'column',
//         fontSize: '1.2rem',
//         backgroundColor: '#f3f4f6',
//       }}>
//         <div style={{
//           width: '50px',
//           height: '50px',
//           border: '2px solidrgb(0, 0, 0)',
//           borderTop: '5px solid #Ffa500',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite',
//         }} />
//         <p style={{ marginTop: '20px', color: '#374151' }}>Loading...</p>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   if (loadingError) {
//     return (
//       <div style={{
//         height: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         flexDirection: 'column',
//         fontSize: '1.2rem',
//         backgroundColor: '#f3f4f6',
//         color: '#dc2626',
//         textAlign: 'center',
//       }}>
       
//         <p style={{ marginBottom: '20px', color: '#374151' }}>
//         Please try refreshing the page or retry in some time.
//         </p>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button
//             onClick={() => window.location.reload()}
//             style={{
//               padding: '10px 20px',
//               backgroundColor: 'black',
//               color: '#ffffff',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer',
//               fontSize: '1rem',
//             }}
//           >
//             Refresh Page
//           </button>
         
//         </div>
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
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading ...{' '}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
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
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};