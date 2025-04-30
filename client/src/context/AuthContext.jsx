import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkSession = async () => {
      try {
        let { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session fetch error:', error.message);
        }
  
        if (session && new Date(session.expires_at * 1000) < new Date()) {
          console.log('Session expired, refreshing...');
          const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Session refresh error:', refreshError.message);
          }
          session = refreshedSession?.session ?? null;
        }
  
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected session error:', err.message);
        setLoading(false);
      }
    };
    checkSession();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session ? 'User logged in' : 'User logged out', session?.user);
      if (session?.user) console.log('Session refreshed, user:', session.user.id);
      setUser(session?.user ?? null);
      setLoading(false);
    });
  
    return () => subscription.unsubscribe();
  }, []);

    const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;