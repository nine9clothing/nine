import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchWishlist(currentUser.id);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchWishlist(currentUser.id);
        } else {
          setWishlist([]);
        }
      }
    );

    loadSession();

    return () => listener?.subscription.unsubscribe();
  }, []);

  const fetchWishlist = async (userId) => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId);

    if (!error && data) {
      const ids = data.map((item) => item.product_id);
      setWishlist(ids);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) return;

    const exists = wishlist.includes(productId);

    if (exists) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (!error) {
        setWishlist((prev) => prev.filter((id) => id !== productId));
      }
    } else {
      const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: user.id, product_id: productId }]); // array of objects

      if (!error) {
        setWishlist((prev) => [...prev, productId]);
      }
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, user }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
