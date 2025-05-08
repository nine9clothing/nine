import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import logo from '../assets/nine9_logo.png';
import { FaShoppingCart, FaHeart, FaSearch, FaUser, FaTimes } from 'react-icons/fa';
import { CartContext } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useNavigate } from 'react-router-dom';
import ToastMessage from '../ToastMessage';

const Navbar = ({ showLogo }) => {
  const initialState = (() => {
    const persistedUser = localStorage.getItem('user');
    const persistedFullName = localStorage.getItem('fullName');
    let user = null;
    let fullName = '';

    if (persistedUser) {
      try {
        user = JSON.parse(persistedUser);
      } catch (e) {
        console.error('Error parsing persisted user:', e);
        localStorage.removeItem('user');
      }
    }

    if (persistedFullName) {
      try {
        fullName = persistedFullName;
      } catch (e) {
        console.error('Error parsing persisted fullName:', e);
        localStorage.removeItem('fullName');
      }
    }

    return { user, fullName };
  })();

  const [user, setUser] = useState(initialState.user);
  const [fullName, setFullName] = useState(initialState.fullName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef();
  const searchInputRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [toastMessage, setToastMessage] = useState(null);
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;

  const keywordMappings = {
    tshirt: ['tshirt', 'tshirts'],
    tshirts: ['tshirt', 'tshirts'],
    't-shirt': ['t-shirt', 't-shirts', 'tshirt', 'tshirts'],
    't-shirts': ['t-shirt', 't-shirts', 'tshirt', 'tshirts'],
    shirt: ['shirt', 'shirts'],
    shirts: ['shirt', 'shirts'],
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session fetch error:', error.message);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          try {
            localStorage.setItem('user', JSON.stringify(session.user));
            const { data, error } = await supabase
              .from('registered_details')
              .select('full_name')
              .eq('email', session.user.email)
              .single();
            if (error) {
              console.error('Error fetching full name:', error.message);
              setFullName('');
              localStorage.removeItem('fullName');
            } else {
              const fetchedFullName = data?.full_name || '';
              setFullName(fetchedFullName);
              localStorage.setItem('fullName', fetchedFullName);
            }
          } catch (e) {
            console.error('Local storage unavailable or fetch error:', e);
            setFullName('');
            localStorage.removeItem('fullName');
          }
        } else {
          setUser(null);
          setFullName('');
          localStorage.removeItem('user');
          localStorage.removeItem('fullName');
        }
      } catch (err) {
        console.error('Unexpected session error:', err.message);
      }
    };

    checkSession();

    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session refresh error:', error.message);
          return;
        }
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('user', JSON.stringify(session.user));
          const { data, error } = await supabase
            .from('registered_details')
            .select('full_name')
            .eq('email', session.user.email)
            .single();
          if (error) {
            console.error('Error refreshing full name:', error.message);
            setFullName('');
            localStorage.removeItem('fullName');
          } else {
            const fetchedFullName = data?.full_name || '';
            setFullName(fetchedFullName);
            localStorage.setItem('fullName', fetchedFullName);
          }
        } else {
          setUser(null);
          setFullName('');
          localStorage.removeItem('user');
          localStorage.removeItem('fullName');
        }
      } catch (err) {
        console.error('Unexpected refresh error:', err.message);
      }
    }, 5 * 60 * 1000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          localStorage.setItem('user', JSON.stringify(session.user));
          const fetchFullName = async () => {
            const { data, error } = await supabase
              .from('registered_details')
              .select('full_name')
              .eq('email', session.user.email)
              .single();
            if (error) {
              console.error('Error fetching full name on auth change:', error.message);
              setFullName('');
              localStorage.removeItem('fullName');
            } else {
              const fetchedFullName = data?.full_name || '';
              setFullName(fetchedFullName);
              localStorage.setItem('fullName', fetchedFullName);
            }
          };
          fetchFullName();
        } catch (e) {
          console.error('Local storage unavailable:', e);
          setFullName('');
          localStorage.removeItem('fullName');
        }
      } else {
        setUser(null);
        setFullName('');
        localStorage.removeItem('user');
        localStorage.removeItem('fullName');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        return;
      }
      setUser(null);
      setFullName('');
      setDropdownOpen(false);
      setMenuOpen(false);
      localStorage.removeItem('user');
      localStorage.removeItem('fullName');
      setToastMessage({ message: "Logged out successfully!", type: "success" });
      navigate('/');
    } catch (err) {
      console.error('Unexpected logout error:', err.message);
    }
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    setShowSearch(!showSearch);
    setSearchQuery('');
    setProducts([]);
    setError('');
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setProducts([]);

    try {
      const query = searchQuery.trim().toLowerCase();
      const matchedKeywords = keywordMappings[query] || [query];

      let supabaseQuery = supabase
        .from('products')
        .select('*');

      supabaseQuery = supabaseQuery.or(
        matchedKeywords
          .map(keyword =>
            `name.ilike.%${keyword}%,` +
            `description.ilike.%${keyword}%,` +
            `gender.ilike.%${keyword}%`
          )
          .join(',')
      );

      if (query === 'shirt' || query === 'shirts') {
        supabaseQuery = supabaseQuery
          .not('name', 'ilike', '%tshirt%')
          .not('name', 'ilike', '%tshirts%')
          .not('description', 'ilike', '%tshirt%')
          .not('description', 'ilike', '%tshirts%')
          .not('gender', 'ilike', '%tshirt%')
          .not('gender', 'ilike', '%tshirts%');
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        setError(`Failed to search products: ${error.message}`);
        setProducts([]);
        return;
      }

      if (data.length === 0) {
        setError('No products found matching your search.');
        setProducts([]);
      } else {
        setProducts(data);
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    navbar: {
      backgroundColor: 'black',
      color: '#fff',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      zIndex: 1000,
      position: 'absolute',
      top: 0,
      height: '70px',
      left: 0,
      right: 0,
    },
    navSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    logoSection: {
      position: 'absolute',
      left: isMobile ? '100px' : '50%',
      transform: 'translateX(-50%)',
      zIndex: 1050,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      height: '65px',
      opacity: showLogo ? 1 : 0,
      transition: 'opacity 0.5s ease',
    },
    hamburger: {
      fontSize: '24px',
      color: 'white',
      background: 'none',
      marginTop:'10%',
      border: 'none',
      cursor: 'pointer',
      display: isMobile ? 'block' : 'none',
      zIndex: 1050,
    },
    navItem: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
    mobileMenu: {
      display: isMobile && menuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      position: 'absolute',
      top: '70px',
      left: 0,
      width: '100%',
      backgroundColor: 'rgba(10, 10, 10, 0.8)',
      padding: '20px',
      zIndex: 999,
      gap: '15px',
      boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
    },
    mobileMenuItem: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '16px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      width: '100%',
      textTransform: 'uppercase',
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
    iconWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      zIndex: 1050,
      cursor: 'pointer',
    },
    iconBadge: {
      background: 'red',
      color: 'white',
      fontSize: '10px',
      fontWeight: 'bold',
      borderRadius: '50%',
      padding: '2px 6px',
      position: 'absolute',
      top: '-8px',
      right: '-10px',
      lineHeight: 1,
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
    userBtn: {
      background: 'transparent',
      color: 'white',
      border: 'none',
      padding: '0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },
    dropdown: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: 'black',
      borderRadius: '6px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      zIndex: 1051,
      minWidth: '140px',
      position: 'absolute',
      right: '0px',
      top: '40px',
    },
    dropdownItem: {
      padding: '10px 20px',
      textDecoration: 'none',
      display: 'block',
      color: 'black',
      fontWeight: 'bold',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
    floatingCart: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      borderRadius: '50%',
      padding: '14px',
      fontSize: '18px',
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    searchBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1060,
      display: showSearch ? 'flex' : 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: '15px 20px',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      animation: 'slideDown 0.3s ease',
    },
    searchForm: {
      display: 'flex',
      width: '100%',
      maxWidth: '700px',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      padding: '12px 40px 12px 15px',
      fontSize: '16px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      fontFamily: '"Louvette Semi Bold", sans-serif',
    },
    searchCloseBtn: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      color: '#333',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchResults: {
      position: 'absolute',
      top: '70px',
      left: '0',
      right: '0',
      zIndex: 1059,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: '15px 20px',
      maxHeight: '400px',
      overflowY: 'auto',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      borderRadius: '0 0 8px 8px',
      display: (products.length > 0 || error || loading) && showSearch ? 'block' : 'none',
      animation: 'fadeIn 0.3s ease',
    },
    searchResultsContainer: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '700px',
      margin: '0 auto',
    },
    searchResultItem: {
      padding: '12px 15px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s ease',
      cursor: 'pointer',
    },
    searchResultText: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
    noResults: {
      color: '#ccc',
      fontSize: '14px',
      textAlign: 'center',
      padding: '20px 0',
      width: '100%',
      fontFamily: '"Louvette Semi Bold", sans-serif',
    },
    errorMessage: {
      color: '#ff6666',
      fontSize: '14px',
      textAlign: 'center',
      padding: '20px 0',
      width: '100%',
      fontFamily: '"Louvette Semi Bold", sans-serif',
    },
    loadingMessage: {
      color: '#ccc',
      fontSize: '14px',
      textAlign: 'center',
      padding: '20px 0',
      width: '100%',
      fontFamily: '"Louvette Semi Bold", sans-serif',
    },
    searchHighlight: {
      color: '#f8d52a',
      fontWeight: 'bold',
      fontFamily: '"Abril Extra Bold", sans-serif',
    },
  };

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.navSection}>
          <button
            style={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
          {!isMobile && (
            <>
              <Link to="/" style={styles.navItem}>Home</Link>
              <Link to="/sort" style={styles.navItem}>Collection</Link>
            </>
          )}
        </div>

        <div style={styles.logoSection}>
          <Link to="/">
            <img src={logo} alt="nine9 logo" style={styles.logo} />
          </Link>
        </div>

        <div style={styles.navSection}>
          <div style={styles.iconWrapper} onClick={handleSearchClick}>
            <FaSearch style={styles.navItem} className="nav-icon" />
          </div>

          {user ? (
            <div style={{ position: 'relative', zIndex: 1050 }} ref={dropdownRef}>
              <button style={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <FaUser className="nav-icon" />
              </button>
              {dropdownOpen && (
                <div style={styles.dropdown}>
                  <div style={{ padding: '8px 15px', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', fontFamily: '"Abril Extra Bold", sans-serif' }}>
                    Hi, {fullName || 'User'}
                  </div>
                  <Link
                    to="/my-account"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/my-orders"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Orders
                  </Link>
                  <Link
                    to="/rewards"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Rewards
                  </Link>
                  <Link
                    to="/about"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/contact"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Contact Us
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      ...styles.dropdownItem,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.iconWrapper}>
              <Link to="/login" style={styles.navItem}>
                <FaUser className="nav-icon" />
              </Link>
            </div>
          )}

          <div style={styles.iconWrapper}>
            <Link to="/wishlist" style={styles.navItem}>
              <FaHeart className="nav-icon" />
            </Link>
            {wishlistCount > 0 && (
              <span style={styles.iconBadge}>{wishlistCount}</span>
            )}
          </div>

          <div style={styles.iconWrapper}>
            <Link to="/cart" style={styles.navItem}>
              <FaShoppingCart className="nav-icon" />
            </Link>
            {cartCount > 0 && (
              <span style={styles.iconBadge}>{cartCount}</span>
            )}
          </div>
        </div>
      </nav>

      <div style={styles.searchBar}>
        <form style={styles.searchForm} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search for products. . ."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            ref={searchInputRef}
          />
          <button
            type="button"
            onClick={handleSearchClick}
            style={styles.searchCloseBtn}
            aria-label="Close search"
          >
            <FaTimes className="close-icon" />
          </button>
        </form>
      </div>

      <div style={styles.searchResults}>
        {loading && <div style={styles.loadingMessage}>Searching. . .</div>}
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        {products.length > 0 ? (
          <div style={styles.searchResultsContainer}>
            {products.map((product) => {
              const productName = product.name;
              const searchTermLower = searchQuery.toLowerCase();
              const nameLower = productName.toLowerCase();
              
              let highlightedName;
              if (nameLower.includes(searchTermLower)) {
                const startIndex = nameLower.indexOf(searchTermLower);
                const endIndex = startIndex + searchTermLower.length;
                
                highlightedName = (
                  <>
                    {productName.substring(0, startIndex)}
                    <span style={styles.searchHighlight}>
                      {productName.substring(startIndex, endIndex)}
                    </span>
                    {productName.substring(endIndex)}
                  </>
                );
              } else {
                highlightedName = productName;
              }
              
              return (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  style={{ textDecoration: 'none', display: 'block' }}
                  onClick={() => {
                    setShowSearch(false);
                    setMenuOpen(false);
                  }}
                >
                  <div
                    style={styles.searchResultItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={styles.searchResultText}>
                      {highlightedName}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          !loading && !error && searchQuery &&
          <div style={styles.noResults}>No products found</div>
        )}
      </div>

      {isMobile && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/sort" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Collection</Link>
          {user && (
            <>
              <Link to="/my-account" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/my-orders" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link to="/rewards" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Rewards</Link>
              <Link to="/about" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>About Us</Link>
              <Link to="/contact" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Contact Us</Link>
            </>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              style={{
                ...styles.mobileMenuItem,
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" style={styles.mobileMenuItem} onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .nav-icon {
            transition: transform 0.3s ease, color 0.3s ease;
          }
          
          .nav-icon:hover {
            transform: scale(1.2);
            color: #f8d52a;
          }
          
          .floating-cart-icon {
            transition: transform 0.3s ease;
          }
          
          .floating-cart-icon:hover {
            animation: pulse 1s infinite alternate;
          }
          
          .close-icon {
            transition: transform 0.3s ease;
          }
          
          .close-icon:hover {
            transform: rotate(90deg) scale(1.2);
            color: #ff6666;
          }
          
          @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.2); }
          }
        `}
      </style>
    </>
  );
};

export default Navbar;


