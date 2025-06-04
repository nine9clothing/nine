import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase.js';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import Footer from "../pages/Footer";

const getImageUrl = (mediaUrls, index = 0) => {
  if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
    return 'https://via.placeholder.com/300x500?text=No+Image';
  }
  const validUrls = mediaUrls.filter(url =>
    typeof url === 'string' && url.match(/\.(jpeg|jpg|png|gif|webp)$/i)
  );
  return validUrls[index] || validUrls[0] || 'https://via.placeholder.com/300x500?text=No+Image';
};

const Sort = () => {
  const [sortOption, setSortOption] = useState('Featured');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  const { user, wishlist, toggleWishlist } = useWishlist();
  const filterPopupRef = useRef();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) {
      } else if (data) {
        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
        setAvailableCategories(uniqueCategories.sort());
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersVisible && filterPopupRef.current && !filterPopupRef.current.contains(event.target)) {
        const filterButton = document.getElementById('filter-toggle-button');
        if (!filterButton || !filterButton.contains(event.target)) {
          setFiltersVisible(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersVisible]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 767.9px) {
        .gridContainer {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 12px !important;
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
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin-top: 2px !important;
          margin-bottom: 8px !important;
        }
        .productPrice .strikePrice {
          font-size: 10px !important;
          color: #ccc !important;
          text-decoration: line-through !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .productPrice .currentPrice {
          font-size: 10px !important;
          color: #Ffa500 !important;
          font-weight: bold !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .wishlistButton {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          z-index: 10 !important;
          width: 30px !important;
          height: 30px !important;
        }
        .outOfStockTag {
          position: absolute !important;
          top: 40px !important;
          left: -15px !important;
          background-color: #dc3545 !important;
          color: #fff !important;
          font-size: 10px !important;
          padding: 2px 12px !important;
          border-radius: 3px !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
          z-index: 20 !important;
          transform: rotate(-45deg) !important;
          transform-origin: top left !important;
          width: 80px !important;
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
        .filterPopup {
          position: absolute !important;
          top: 50px !important;
          right: 0 !important;
          width: 280px !important;
          max-height: 70vh !important;
          background-color: #1a1a1a !important;
          flex-direction: column !important;
          padding: 15px !important;
          overflow-y: auto !important;
          box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px !important;
          z-index: 1001 !important;
          transform: translateX(${filtersVisible ? '0' : '100%'}) !important;
          transition: transform 0.3s ease-in-out !important;
        }
        .filterSection {
          width: 100% !important;
          margin-bottom: 15px !important;
          text-align: left !important;
          display: block !important;
        }
        .filterSectionTitle {
          font-size: 1.1rem !important;
          color: #Ffa500 !important;
          margin-bottom: 10px !important;
          font-family: 'Abril Extra Bold', sans-serif !important;
        }
        .select, .checkboxLabel {
          font-size: 13px !important;
          color: white !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .select {
          width: 100% !important;
          padding: 8px !important;
          margin-bottom: 10px !important;
          border-radius: 4px !important;
        }
        .checkboxLabel {
          display: flex !important;
          align-items: center !important;
          margin-bottom: 10px !important;
        }
        .checkboxText {
          margin-left: 8px !important;
          font-family: 'Louvette Semi Bold', sans-serif !important;
        }
        .filterButton {
          margin-right: 10px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [filtersVisible]);

  const fetchProducts = async () => {
    setLoading(true);

    let query = supabase.from('products').select('*');

    if (sortOption === 'Price High to Low') {
      query = query.order('price', { ascending: false });
    } else if (sortOption === 'Price Low to High') {
      query = query.order('price', { ascending: true });
    } else if (sortOption === 'Best Selling') {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('items');

      if (ordersError) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productSales = {};
      ordersData.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item?.name && item?.units !== undefined) {
              productSales[item.name] = (productSales[item.name] || 0) + item.units;
            }
          });
        }
      });

      const { data: productsData, error: productsError } = await query;
      
      if (productsError) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const sortedProducts = productsData.sort((a, b) => {
        const salesA = productSales[a.name] || 0;
        const salesB = productSales[b.name] || 0;
        return salesB - salesA || a.name.localeCompare(b.name);
      });

      setProducts(sortedProducts);
      setLoading(false);
      return;
    } 

    if (selectedCategories.length > 0) {
      query = query.in('category', selectedCategories);
    }
    if (selectedGenders.length > 0) {
      query = query.in('gender', selectedGenders);
    }
    if (selectedSizes.length > 0) {
      const sizeConditions = selectedSizes.map(size => `size.ilike.%${size}%`).join(',');
      query = query.or(sizeConditions);
    }

    const { data, error } = await query;

    if (error) {
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [sortOption, selectedCategories, selectedGenders, selectedSizes]);

  const handleCheckboxChange = (value, state, setState) => {
    setState(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/product/${productId}`;
  };

  return (
    <div style={styles.container}>
      <Navbar showLogo={true} />
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Our Collection</h2>
        <div style={styles.buttonContainer}>
          <button id="filter-toggle-button" onClick={toggleFilters} style={styles.filterButton}>
            {filtersVisible ? 'Hide Filters' : 'Filters & Sort'}
          </button>
          {filtersVisible && (
            <div ref={filterPopupRef} style={styles.filterPopup} className="filterPopup">
              <div style={styles.filterSection}>
                <h3 style={styles.filterSectionTitle}>PRICE</h3>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={styles.select}
                >
                  <option>Price Low to High</option>
                  <option>Price High to Low</option>
                  <option>Best Selling</option>
                  <option>Featured</option>
                </select>
              </div>
              <div style={styles.filterSection}>
                <h3 style={styles.filterSectionTitle}>CATEGORY</h3>
                {availableCategories.length > 0 ? (
                  availableCategories.map((cat) => (
                    <label key={cat} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        value={cat}
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCheckboxChange(cat, selectedCategories, setSelectedCategories)}
                      />
                      <span style={styles.checkboxText}>{cat}</span>
                    </label>
                  ))
                ) : (
                  <p style={styles.loadingText}>Loading categories...</p>
                )}
              </div>
              <div style={styles.filterSection}>
                <h3 style={styles.filterSectionTitle}>GENDER</h3>
                {['Men', 'Women', 'Unisex'].map((gen) => (
                  <label key={gen} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={gen}
                      checked={selectedGenders.includes(gen)}
                      onChange={() => handleCheckboxChange(gen, selectedGenders, setSelectedGenders)}
                    />
                    <span style={styles.checkboxText}>{gen}</span>
                    </label>
                ))}
              </div>
              <div style={styles.filterSection}>
                <h3 style={styles.filterSectionTitle}>SIZE</h3>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((sz) => (
                  <label key={sz} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={sz}
                      checked={selectedSizes.includes(sz)}
                      onChange={() => handleCheckboxChange(sz, selectedSizes, setSelectedSizes)}
                    />
                    <span style={styles.checkboxText}>{sz}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={styles.productGrid}>
          {loading ? (
            <p style={styles.message}>Loading products...</p>
          ) : products.length === 0 ? (
            <p style={styles.message}>
              No products match the current filters.
            </p>
          ) : (
            <div className="gridContainer" style={styles.gridContainer}>
              {products.map((product) => {
                let sizeStock = {};
                try {
                  sizeStock = product.size ? JSON.parse(product.size) : {};
                } catch (error) {
                  sizeStock = {};
                }
                const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                const isOutOfStock = allSizes.every(size => !sizeStock[size] || sizeStock[size] <= 0);

                return (
                  <Link to={`/product/${product.id}`} key={product.id} style={styles.productLink}>
                    <div
                      className="productCard"
                      style={styles.productCard}
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      <div style={styles.imageWrapper} className="productImageWrapper">
                        {user && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                            style={styles.wishlistButton}
                            className="wishlistButton"
                            title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            {wishlist.includes(product.id) ? <FaHeart color="red" size={18} /> : <FaRegHeart color="black" size={18} />}
                          </button>
                        )}
                        {isOutOfStock && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50px',
                              left: '-20px',
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              fontSize: '12px',
                              padding: '3px 15px',
                              borderRadius: '3px',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                              zIndex: '20',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'top left',
                              width: '100px',
                            }}
                            className="outOfStockTag"
                          >
                            Out of Stock
                          </div>
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
                      <h3 className="productName" style={styles.productName}>{product.name}</h3>
                      <div className="productPrice" style={styles.productPrice}>
                        {product.strike_price ? (
                          <>
                            <span style={styles.strikePrice}>₹{product.strike_price}</span>
                            <span style={styles.currentPrice}>₹{product.price}</span>
                          </>
                        ) : (
                          <span style={styles.currentPrice}>₹{product.price}</span>
                        )}
                      </div>
                      {isMobile && (
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
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: "black",
    position: 'relative',
    fontFamily: "'Roboto', sans-serif",
  },
  section: {
    padding: '20px',
    paddingTop: '80px',
    marginLeft: '0',
    transition: 'margin-left 0.3s ease',
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: '700',
    marginTop: '10px',
    textAlign: 'center',
    color: "#Ffa500",
    fontFamily: "'Abril Extra Bold', sans-serif",
    marginBottom: '30px',
  },
  buttonContainer: {
    textAlign: 'right',
    marginBottom: '10px',
    position: 'relative',
  },
  filterButton: {
    backgroundColor: 'white',
    color: 'black',
    padding: '8px 16px',
    border: 'none',
    fontFamily: "'Abril Extra Bold', sans-serif",
    borderRadius: '50px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'background-color 0.2s ease',
    fontSize: '15px',
    ':hover': {
      backgroundColor: '#e69500',
    },
  },
  filterPopup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: '#000',
    padding: '15px 0',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease-in-out',
    position: 'absolute',
    top: '60px',
    left: 0,
    zIndex: 1000,
    flexWrap: 'nowrap',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
  filterSection: {
    flex: '0 0 auto',
    minWidth: '150px',
    padding: '0 15px',
    textAlign: 'left',
    marginRight: '20px',
  },
  filterSectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '10px',
    marginTop: '10px',
    textTransform: 'uppercase',
    fontFamily: "'Abril Extra Bold', sans-serif",
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  checkboxText: {
    marginLeft: '10px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  productGrid: {
    flex: 1,
    paddingLeft: '20px',
    paddingRight: '20px',
    marginTop: '20px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 300px))', 
    gap: '30px',
    justifyContent: 'center',
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
    boxShadow: 'none',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '500px',
    width: '100%',
    maxWidth: '300px',
    margin: '0 auto',
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
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    }
  },
  imageWrapper: {
    width: '100%',
    maxWidth: '300px',
    height: '350px',
    overflow: 'hidden',
    marginBottom: '15px',
    borderRadius: '8px 8px 0 0',
    position: 'relative',
  },
  productImage: {
    display: 'block',
    width: '100%',
    maxWidth: '300px',
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
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  productDescription: {
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '10px',
    maxHeight: '40px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  productPrice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '5px',
  },
  strikePrice: {
    fontSize: '0.9rem',
    color: '#ccc',
    textDecoration: 'line-through',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  currentPrice: {
    fontWeight: 'bold',
    fontSize: '1rem',
    color: 'white',
    fontFamily: "'Louvette Semi Bold', sans-serif",
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
    maxWidth: '300px',
    marginTop: '8px',
    transition: 'background-color 0.2s ease',
    fontFamily: "'Abril Extra Bold', sans-serif",
  },
  message: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#aaa',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  loadingText: {
    fontSize: '14px',
    color: '#666',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
};

export default Sort;