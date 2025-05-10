import React, { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import WishlistProductGrid from '../components/WishlistProductGrid';
import ToastMessage from '../ToastMessage';
import { useNavigate } from 'react-router-dom';
import Footer from '../pages/Footer';

const WishlistPage = () => {
  const { wishlist = [], user, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (!user) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      if (wishlist.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true); 
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', wishlist);

        if (error) {
          throw error;
        }

        if (data) {
          const orderedProducts = wishlist
            .map(id => data.find(item => item.id === id))
            .filter(Boolean);
          setProducts(orderedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error.message);
        setToast({ message: 'Error loading wishlist items.', type: 'error' });
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, user]); 

  const handleRemove = (productId, productName) => {
    if (!user) return;
    toggleWishlist(productId);
    setToast({ message: `${productName} removed from wishlist.`, type: 'success' });
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <Navbar showLogo={true} />
      <div style={styles.pageContainer}>
        {!user ? (
          <div style={styles.loginPromptContainer}>
            <h2 style={styles.pageTitle}>Your Wishlist</h2>
            <p style={styles.loginPromptText}>
              Log in to see the items you’ve saved or to add new ones to your wishlist.
            </p>
            <button
              onClick={handleLoginRedirect}
              style={styles.loginButton}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.loginButtonHover.backgroundColor)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.loginButton.backgroundColor)}
            >
              Go to Login
            </button>
          </div>
        ) : (
          // --- User Logged In View ---
          <>
            <h2 style={styles.pageTitle}>Your Wishlist</h2>
            {isLoading ? (
              <p style={styles.loadingText}>Loading wishlist...</p>
            ) : products.length === 0 ? (
              <p style={styles.emptyWishlistText}>Your wishlist is currently empty.</p>
            ) : (
              <WishlistProductGrid products={products} onRemove={handleRemove} />
            )}
          </>
        )}
      </div>
      <Footer />
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000} 
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#000000', 
  },
  pageContainer: {
    padding: '100px 20px 40px',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#000000', 
  },
  pageTitle: {
    fontWeight: '700',
    fontFamily: "'Abril Extra Bold', sans-serif", 
    fontSize: window.innerWidth <= 768 ? '2rem' : '2rem',
    marginBottom: '10px',
    color: '#Ffa500',
    marginTop: '0px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    marginBottom: '300px',
    marginTop: '30px',
  },
  emptyWishlistText: {
    fontSize: '1rem',
    color: '#ffffff',
    marginBottom: '300px',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    textAlign: 'center',
    marginTop: '30px',
  },
  loginPromptContainer: {
    textAlign: 'center',
    padding: '40px 30px',
    marginTop: '120px',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    marginBottom: '90px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    maxWidth: '550px',
    margin: '30px auto 0 auto',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
  },
  loginPromptText: {
    fontSize: '1.1rem',
    color: '#495057',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  loginButton: {
    display: 'inline-block',
    padding: '12px 25px',
    fontSize: '15px',
    fontWeight: 'bold',
    color: 'black',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    textDecoration: 'none',
    transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease',
    outline: 'none',
    marginTop: '30px',
    marginBottom: '50px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)' 
  },
  loginButtonHover: {
    backgroundColor: '#Ffa500',
    boxShadow: '#Ffa500',
  },
};

export default WishlistPage;