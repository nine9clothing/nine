import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';

const WishlistProductGrid = ({ products, onRemove }) => {
  const { wishlist, toggleWishlist, user } = useWishlist();
  const [hoveredProductId, setHoveredProductId] = useState(null);

  // Function to get image URL with fallback
  const getImageUrl = (mediaUrls, index = 0) => {
    if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return 'https://via.placeholder.com/300x500?text=No+Image';
    }
    const validUrls = mediaUrls.filter(url =>
      typeof url === 'string' && url.match(/\.(jpeg|jpg|png|gif|webp)$/i)
    );
    return validUrls[index] || validUrls[0] || 'https://via.placeholder.com/300x500?text=No+Image';
  };

  // Inject mobile and desktop-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 768px) {
        .gridContainer {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 12px !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 5px !important;
          box-sizing: border-box !important;
        }
        .productCard {
          height: 300px !important;
          width: 100% !important;
          max-width: 130px !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 0 !important;
          margin-bottom: 20px !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
        }
        .productImageWrapper {
          height: 180px !important;
          width: 120% !important;
          max-width: 120px !important;
          border-radius: 8px !important;
          position: relative;
        }
        .productImage {
          width: 100% !important;
          max-width: 120px !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 8px !important;
        }
        .productName {
          font-size: 11px !important;
          font-weight: 500 !important;
          margin-top: 8px !important;
          margin-bottom: 2px !important;
          color: white !important;
          text-align: left !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .productPrice {
          font-size: 14px !important;
          color: #Ffa500 !important;
          font-weight: bold !important;
          text-align: left !important;
          margin-top: 2px !important;
          margin-bottom: 8px !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .wishlistButton {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          z-index: 10 !important;
          width: 30px !important;
          height: 30px !important;
          background-color: white !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .addToCartButton {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 6px 12px !important;
          background-color: #Ffa500 !important;
          color: black !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          width: 100% !important;
          max-width: 180px !important;
          margin-top: 6px !important;
          transition: background-color 0.2s ease !important;
          font-family: 'Abril Extra Bold', sans-serif !important;
        }
        .addToCartButton:hover {
          background-color: #e69500 !important;
        }
        .cartIcon {
          margin-right: 6px !important;
        }
      }
      @media (min-width: 769px) {
        .wishlistButton:hover {
          background-color: rgba(255, 255, 255, 1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/product/${productId}`;
  };

  return (
    <div style={styles.container}>
      <div className="gridContainer" style={styles.gridContainer}>
        {products.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} style={styles.productLink}>
            <div
              className="productCard"
              style={styles.productCard}
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
            >
              {/* Image Wrapper with Wishlist Button Inside */}
              <div style={styles.imageWrapper} className="productImageWrapper">
                {user && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                      if (onRemove) onRemove(product.id, product.name);
                    }}
                    style={styles.wishlistButton}
                    className="wishlistButton"
                    title="Remove from wishlist"
                  >
                    <FaHeart color="red" size={18} />
                  </button>
                )}
                <img
                  className="productImage"
                  src={getImageUrl(product.media_urls, hoveredProductId === product.id ? 1 : 0)}
                  alt={product.name || 'Product Image'}
                  style={{
                    ...styles.productImage,
                    transform: hoveredProductId === product.id ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              </div>
              {/* Product Details */}
              <h3 className="productName" style={styles.productName}>{product.name}</h3>
              <p className="productPrice" style={styles.productPrice}>₹{product.price}</p>
              {window.innerWidth <= 768 && (
                <button
                  onClick={(e) => handleAddToCart(e, product.id)}
                  className="addToCartButton"
                  style={styles.addToCartButton}
                >
                  <FaShoppingCart className="cartIcon" size={14} />
                  Add to Cart
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 20px',
    backgroundColor: '#000000',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Roboto', sans-serif",
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '30px',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1400px',
  },
  productLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    position: 'relative',
  },
  productCard: {
    backgroundColor: 'transparent',
    border: '1px solid #Ffa500',
    borderRadius: '10px',
    padding: '15px',
    textAlign: 'center',
    display: 'flex',
    width: '320px',
    flexDirection: 'column',
    alignItems: 'center',
    height: '500px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    position: 'relative',
  },
  wishlistButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'background-color 0.2s ease',
  },
  imageWrapper: {
    width: '100%',
    height: '350px',
    overflow: 'hidden',
    marginBottom: '15px',
    borderRadius: '8px 8px 0 0',
    position: 'relative',
  },
  productImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease-out',
    borderRadius: '8px 8px 0 0',
  },
  productName: {
    fontSize: '1rem',
    color: '#Ffa500',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '10px',
    marginBottom: '5px',
    fontFamily: '"Louvette Semi Bold", sans-serif'
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#ffffff',
    marginTop: 'auto',
    paddingTop: '5px',
    fontFamily: '"Louvette Semi Bold", sans-serif'
  },
  addToCartButton: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    backgroundColor: '#Ffa500',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginTop: '8px',
    transition: 'background-color 0.2s ease',
    fontFamily: '"Abril Extra Bold", sans-serif'
  },
};

export default WishlistProductGrid;