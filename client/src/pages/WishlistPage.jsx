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
  const [isLoading, setIsLoading] = useState(true); // Start as true for immediate feedback
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      // --- Guard Clause: Exit if user is not logged in ---
      if (!user) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // --- Guard Clause: Exit if wishlist is empty ---
      if (wishlist.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // --- Fetch products ---
      setIsLoading(true); // Already true, but ensures consistency
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
  }, [wishlist, user]); // Re-run effect if wishlist array or user object changes

  const handleRemove = (productId, productName) => {
    if (!user) return;
    toggleWishlist(productId);
    setToast({ message: `${productName} removed from wishlist.`, type: 'success' });
    // Immediately update products state to reflect removal
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
  };

  // Handler to navigate to login page
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
          duration={3000} // Example duration
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
    fontFamily: "'Abril Extra Bold', sans-serif", // Applied to headings
    fontSize: window.innerWidth <= 768 ? '2rem' : '2.2rem',
    marginBottom: '30px',
    color: '#Ffa500',
    marginTop: '55px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions
    marginBottom: '300px',
    marginTop: '30px',
  },
  emptyWishlistText: {
    fontSize: '1rem',
    color: '#ffffff',
    marginBottom: '300px',
    fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions
    textAlign: 'center',
    marginTop: '30px',
  },
  loginPromptContainer: {
    textAlign: 'center',
    padding: '40px 30px',
    marginTop: '120px',
    fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions
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
    fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions
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
    fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions
    textDecoration: 'none',
    transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease',
    outline: 'none',
    marginTop: '30px',
    marginBottom: '50px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)', // soft shadow to match
  },
  loginButtonHover: {
    backgroundColor: '#Ffa500',
    boxShadow: '#Ffa500',
  },
};

export default WishlistPage;