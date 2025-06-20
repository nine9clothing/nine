import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const persistedUser = localStorage.getItem('user');
    if (persistedUser) {
      try {
        setUser(JSON.parse(persistedUser));
      } catch (e) {
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
        }

        if (session?.user) {
          setUser(session.user);
          try {
            localStorage.setItem('user', JSON.stringify(session.user));
          } catch (e) {
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          localStorage.setItem('user', JSON.stringify(session.user));
        } catch (e) {
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('cart'); 
    } catch (err) {
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;