import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { CartContext } from '../context/CartContext.jsx';
import Slider from 'react-slick';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ToastMessage from '../ToastMessage';
import { useWishlist } from '../context/WishlistContext.jsx';
import Footer from "../pages/Footer";      

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [toastMessage, setToastMessage] = useState(null);
  const { wishlist, toggleWishlist, user } = useWishlist();
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [openSections, setOpenSections] = useState({
    description: false,
    careGuide: false,
    composition: false,
  });
  // New state to track if "Notify Me" modal is open and the size selected for notification
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySize, setNotifySize] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const fetchProduct = async () => {
      console.log('Fetching product with id:', id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error.message);
        setToastMessage({ message: 'Error fetching product: ' + error.message, type: 'error' });
      } else {
        console.log('Raw data from Supabase:', data);
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setToastMessage({ message: 'Please select a size before adding to cart.', type: 'error' });
      return;
    }
    const productWithDetails = { ...product, selectedSize, quantity };
    addToCart(productWithDetails);
    setToastMessage({ message: `${product.name} (${selectedSize} x${quantity}) added to cart!`, type: 'success' });
  };

  const handleBeforeChange = () => {
    videoRefs.current.forEach(video => {
      if (video && !video.paused) {
        video.pause();
      }
    });
  };

  const handleAfterChange = (current) => {
    const activeVideo = videoRefs.current[current];
    if (activeVideo && activeVideo.tagName === 'VIDEO') {
      activeVideo.play().catch(() => {});
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // New function to handle "Notify Me" for unavailable sizes
  const handleNotifyMe = async () => {
    if (!user) {
      setToastMessage({ message: 'Please log in to use the Notify Me feature.', type: 'error' });
      return;
    }

    if (!notifySize) {
      setToastMessage({ message: 'Please select a size to be notified about.', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase
        .from('size_notifications')
        .insert({
          user_id: user.id,
          product_id: product.id,
          size: notifySize,
          created_at: new Date().toISOString(),
          notified: false,
        });

      if (error) {
        console.error('Error saving notification request:', error.message);
        setToastMessage({ message: 'Error saving notification request: ' + error.message, type: 'error' });
      } else {
        setToastMessage({ message: `You will be notified when size ${notifySize} is available!`, type: 'success' });
        setShowNotifyModal(false);
        setNotifySize(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setToastMessage({ message: 'Unexpected error occurred.', type: 'error' });
    }
  };

  const NextArrow = ({ onClick }) => (
    <div style={isMobile ? styles.mobileArrowRight : styles.arrowRight} onClick={onClick}>
      <FaChevronRight />
    </div>
  );

  const PrevArrow = ({ onClick }) => (
    <div style={isMobile ? styles.mobileArrowLeft : styles.arrowLeft} onClick={onClick}>
      <FaChevronLeft />
    </div>
  );

  if (loading) return <p>Loading product...</p>;
  if (!product) {
    console.log('Product is null, possible fetch issue:', product);
    return <p>Product not found.</p>;
  }

  const availableSizes = (product.size || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

  const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  const media = Array.isArray(product.media_urls) ? product.media_urls : [];
  const isWished = wishlist.includes(product?.id);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    arrows: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    beforeChange: handleBeforeChange,
    afterChange: handleAfterChange,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />
  };

  return (
    <div className="bg-black">
      <Navbar showLogo={true} />
      <div style={isMobile ? styles.mobileContainer : styles.container}>
        <div style={isMobile ? styles.mobileContentWrapper : styles.contentWrapper}>
          <div style={styles.imageWrapper}>
            {media.length > 1 ? (
              <Slider {...sliderSettings} ref={sliderRef} style={{ width: '100%' }}>
                {media.map((url, index) => {
                  if (url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
                    return (
                      <div key={index}>
                        <img src={url} alt={`Product ${index}`} style={isMobile ? styles.mobileProductImage : styles.productImage} />
                      </div>
                    );
                  } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    return (
                      <div key={index}>
                        <video
                          ref={(el) => (videoRefs.current[index] = el)}
                          muted
                          playsInline
                          controls
                          preload="metadata"
                          style={isMobile ? styles.mobileProductImage : styles.productImage}
                        >
                          <source src={url} />
                        </video>
                      </div>
                    );
                  }
                  return null;
                })}
              </Slider>
            ) : media.length === 1 ? (
              media[0].match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                <img src={media[0]} alt="Product" style={isMobile ? styles.mobileProductImage : styles.productImage} />
              ) : media[0].match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  style={isMobile ? styles.mobileProductImage : styles.productImage}
                >
                  <source src={media[0]} />
                </video>
              ) : null
            ) : (
              <div
                style={{
                  ...styles.productImage,
                  background: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{color: '#fff'}}>No media available</span>
              </div>
            )}
          </div>

          <div style={styles.detailsWrapper}>
            <h2 style={isMobile ? styles.mobileName : styles.name}>{product.name}</h2>
            <p style={isMobile ? styles.mobileDetail : styles.detail}><strong>Price:</strong> ₹{product.price}</p>

            <div style={{ marginTop: isMobile ? '20px' : '20px', display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '10px' }}>
              <strong style={styles.label}>Select Size:</strong>
              <button onClick={() => setShowSizeGuide(true)} style={styles.sizeGuideButton}>
                Size Guide
              </button>
            </div>
            <div style={isMobile ? styles.mobileSizeOptions : styles.sizeOptions}>
              {allSizes.map((size) => {
                const isAvailable = availableSizes.includes(size);
                const isSelected = selectedSize === size;
                return (
                  <div key={size} style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedSize(size);
                        } else {
                          setNotifySize(size);
                          setShowNotifyModal(true);
                        }
                      }}
                      style={{
                        ...(isMobile ? styles.mobileSizeButton : styles.sizeButton),
                        ...(isSelected ? styles.sizeButtonSelected : {}),
                        ...(!isAvailable ? styles.disabledSizeButton : {})
                      }}
                      disabled={!isAvailable && !user} // Disable for unavailable sizes if user is not logged in
                    >
                      {size}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: isMobile ? '20px' : '20px' }}>
              <strong style={styles.label}>Select Quantity:</strong>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={styles.quantitySelect}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div style={isMobile ? styles.mobileSplitButtonWrapper : styles.splitButtonWrapper}>
              <button onClick={handleAddToCart} style={isMobile ? styles.mobileSplitLeftButton : styles.splitLeftButton}>
                Add to Cart
              </button>
              {user && (
                <button
                  onClick={() => toggleWishlist(product.id)}
                  style={{
                    ...(isMobile ? styles.mobileSplitRightButton : styles.splitRightButton),
                    backgroundColor: isWished ? 'transparent' : 'transparent',
                    color: isWished ? 'white' : 'white',
                  }}
                  title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              )}
            </div>

            <div style={styles.dropdownSection}>
              <hr style={styles.divider} />

              <div style={styles.dropdownItem}>
                <div style={styles.dropdownHeader} onClick={() => toggleSection('description')}>
                  <span>Description</span>
                  <span>{openSections.description ? '−' : '+'}</span>
                </div>
                {openSections.description && (
                  <div style={styles.dropdownContent}>
                    <p>{product.description || "No description available."}</p>
                  </div>
                )}
              </div>

              <div style={styles.dropdownItem}>
                <div style={styles.dropdownHeader} onClick={() => toggleSection('careGuide')}>
                  <span>Care Guide</span>
                  <span>{openSections.careGuide ? '−' : '+'}</span>
                </div>
                {openSections.careGuide && (
                  <div style={styles.dropdownContent}>
                    <p>{product.care_guide || "No care guide available."}</p>
                  </div>
                )}
              </div>

              <div style={styles.dropdownItem}>
                <div style={styles.dropdownHeader} onClick={() => toggleSection('composition')}>
                  <span>Composition/Fabric</span>
                  <span>{openSections.composition ? '−' : '+'}</span>
                </div>
                {openSections.composition && (
                  <div style={styles.dropdownContent}>
                    <p>{product.composition_fabric || "No composition details available."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {showSizeGuide && (
        <div style={styles.modalOverlay}>
          <div style={isMobile ? styles.mobileModalContent : styles.modalContent}>
            <h3>Size Guide</h3>
            <p>Please refer to the measurements below for your perfect fit:</p>
            <ul style={{ textAlign: 'left' }}>
              <li><strong>S:</strong> Chest 34-36 inches, Waist 28-30 inches</li>
              <li><strong>M:</strong> Chest 38-40 inches, Waist 32-34 inches</li>
              <li><strong>L:</strong> Chest 42-44 inches, Waist 36-38 inches</li>
              <li><strong>XL:</strong> Chest 46-48 inches, Waist 40-42 inches</li>
            </ul>
            <button onClick={() => setShowSizeGuide(false)} style={styles.modalCloseButton}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* New Notify Me Modal */}
      {showNotifyModal && (
        <div style={styles.modalOverlay}>
          <div style={isMobile ? styles.mobileModalContent : styles.modalContent}>
            <h3>Notify Me</h3>
            <p>Size {notifySize} is currently unavailable. Would you like to be notified when it’s back in stock?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleNotifyMe}
                style={styles.modalCloseButton}
              >
                Yes, Notify Me
              </button>
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                  setNotifySize(null);
                }}
                style={styles.modalCloseButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  '@keyframes iconHover': {
    '0%': { transform: 'scale(1) rotate(0deg)' },
    '50%': { transform: 'scale(1.2) rotate(10deg)' },
    '100%': { transform: 'scale(1) rotate(0deg)' }
  },
  container: {
    padding: '120px 20px 40px',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#000',
  },
  mobileContainer: {
    padding: '80px 10px 20px', // Increased top padding from 60px to 80px
    maxWidth: '100%',
    margin: '0',
    backgroundColor: '#000',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '40px',
    justifyContent: 'center',
  },
  mobileContentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px', // Increased from 15px to 25px for more spacing
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageWrapper: {
    flex: '1 1 400px',
    maxWidth: '500px',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  detailsWrapper: {
    flex: '1 1 400px',
    maxWidth: '500px',
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '600px',
    maxHeight: 'none',
    objectFit: 'cover',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(255,255,255,0.1)',
  },
  mobileProductImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  name: {
    fontSize: '1.5rem',
    fontFamily: "'Abril Extra Bold', sans-serif",
    fontWeight: '700',
    marginBottom: '5px',
    color: '#fff',
  },
  mobileName: {
    fontSize: '1.2rem',
    fontFamily: "'Abril Extra Bold', sans-serif",
    fontWeight: '700',
    marginBottom: '10px', // Increased from 5px to 10px
    color: '#fff',
  },
  detail: {
    fontSize: '1.2rem',
    margin: '6px 0',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#fff',
    fontWeight: '700',
  },
  mobileDetail: {
    fontSize: '1rem',
    margin: '8px 0', // Increased from 4px to 8px
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#fff',
    fontWeight: '700',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#fff',
    fontSize: '14px',
  },
  sizeOptions: {
    display: 'flex',
    gap: '10px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#fff',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  mobileSizeOptions: {
    display: 'flex',
    gap: '5px',
    fontFamily: "'RobLouvette Semi Boldoto', sans-serif",
    color: '#fff',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButton: {
    padding: '8px 16px',
    borderRadius: '50%',
    fontSize: '14px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    border: '1px solid white',
    backgroundColor: '#000',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  mobileSizeButton: {
    padding: '10px 18px',
    borderRadius: '50%',
    fontSize: '12px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    border: '1px solid white',
    backgroundColor: '#000',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  sizeButtonSelected: {
    border: '2px solid white',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    backgroundColor: '#333',
  },
  sizeGuideButton: {
    padding: '0',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    fontWeight: 'normal',
    backgroundColor: 'transparent',
    color: '#Ffa500',
    textDecoration: 'underline',
  },
  disabledSizeButton: {
    opacity: 0.4,
    cursor: 'not-allowed',
    textDecoration: 'line-through',
  },
  quantitySelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    border: '1px solid white',
    fontSize: '14px',
    marginTop: '6px',
    width: '60px',
    backgroundColor: '#000',
    color: '#fff',
  },
  splitButtonWrapper: {
    display: 'flex',
    marginTop: '20px',
    width: '100%',
    gap: '5px',
  },
  mobileSplitButtonWrapper: {
    display: 'flex',
    marginTop: '20px', // Increased from 15px to 20px
    width: '100%',
    gap: '3px',
  },
  splitLeftButton: {
    flex: 1,
    padding: '12px 15px',
    backgroundColor: '#Ffa500',
    color: 'black',
    border: '1px solid white',
    borderRadius: '4px 0 0 4px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    textTransform: 'uppercase',
    transition: 'border-color 0.3s',
  },
  mobileSplitLeftButton: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#Ffa500',
    color: 'black',
    border: '1px solid white',
    borderRadius: '4px 0 0 4px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase',
    transition: 'border-color 0.3s',
  },
  splitRightButton: {
    flex: 1,
    padding: '12px 15px',
    border: '1px solid white',
    borderRadius: '0 4px 4px 0',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    textTransform: 'uppercase',
    transition: 'border-color 0.3s',
  },
  mobileSplitRightButton: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid white',
    borderRadius: '0 4px 4px 0',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase',
    transition: 'border-color 0.3s',
  },
  arrowLeft: {
    position: 'absolute',
    top: '50%',
    left: '10px',
    transform: 'translateY(-50%)',
    fontSize: '22px',
    color: 'black',
    backgroundColor: 'transparent',
    border: 'none',
    zIndex: 2,
    cursor: 'pointer',
    padding: '2px',
    transition: 'transform 0.2s ease',
    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
  },
  mobileArrowLeft: {
    position: 'absolute',
    top: '50%',
    left: '5px',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    color: 'black',
    backgroundColor: 'transparent',
    border: 'none',
    zIndex: 2,
    cursor: 'pointer',
    padding: '5px',
    transition: 'transform 0.2s ease',
    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
  },
  arrowRight: {
    position: 'absolute',
    top: '50%',
    right: '10px',
    transform: 'translateY(-50%)',
    fontSize: '22px',
    color: 'black',
    backgroundColor: 'transparent',
    border: 'none',
    zIndex: 2,
    cursor: 'pointer',
    padding: '2px',
    transition: 'transform 0.2s ease',
    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
  },
  mobileArrowRight: {
    position: 'absolute',
    top: '50%',
    right: '5px',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    color: 'black',
    backgroundColor: 'transparent',
    border: 'none',
    zIndex: '2',
    cursor: 'pointer',
    padding: '5px',
    transition: 'transform 0.2s ease',
    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
  },
  modalContent: {
    backgroundColor: '#000',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    maxWidth: '400px',
    textAlign: 'center',
    color: '#fff',
  },
  mobileModalContent: {
    backgroundColor: '#000',
    padding: '15px',
    borderRadius: '6px',
    width: '90%',
    maxWidth: '300px',
    textAlign: 'center',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#fff',
    fontSize: '14px',
  },
  modalCloseButton: {
    marginTop: '15px',
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  dropdownSection: {
    marginTop: '20px', // Increased from 15px to 20px
    borderTop: '1px solid #fff',
    paddingTop: '10px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #333',
    margin: '10px 0',
  },
  dropdownItem: {
    borderBottom: '1px solid #333',
    padding: '10px 0',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '16px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#Ffa500',
    cursor: 'pointer',
  },
  dropdownContent: {
    marginTop: '10px',
    fontSize: '14px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#ccc',
  },
};

export default ProductDetail;