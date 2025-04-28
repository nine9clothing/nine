import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import ToastMessage from '../ToastMessage';
import Footer from "../pages/Footer";

const CartCheckout = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const [user, setUser] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [points, setPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  const navigate = useNavigate();
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalAfterDiscount = subtotal - (discount + pointsDiscount);

  useEffect(() => {
    const getUserAndPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      if (currentUser) {
        setUser(currentUser);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('display_order_id, total_amount, shipping_charges')
          .eq('user_id', currentUser.id);

        if (ordersError) throw ordersError;

        const ordersWithPoints = ordersData.map(order => {
          const totalAmount = order.total_amount != null ? order.total_amount : 0;
          const shippingCharges = order.shipping_charges != null ? order.shipping_charges : 0;
          const netAmount = totalAmount - shippingCharges;
          return { net_amount: netAmount };
        });

        const totalEarnedPoints = ordersWithPoints.reduce((sum, order) => sum + Math.max(0, Math.floor(order.net_amount / 100) * 10), 0);

        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from('point_redemptions')
          .select('points_redeemed')
          .eq('user_id', currentUser.id);

        if (redemptionsError) throw redemptionsError;

        const totalRedeemedPoints = redemptionsData.reduce((sum, redemption) => sum + redemption.points_redeemed, 0);
        setPoints(totalEarnedPoints - totalRedeemedPoints);
      }
    };

    getUserAndPoints();
  }, []);

  useEffect(() => {
    if (redeemPoints) {
      const maxPointsFor99 = 495; // 99 * 5 points per rupee
      const pointsToRedeem = Math.min(points, maxPointsFor99);
      setPointsDiscount(pointsToRedeem / 5);
      setToastMessage({ message: `₹${(pointsToRedeem / 5).toFixed(2)} Redeemed.`, type: 'success' });    } else {
      setPointsDiscount(0);
    }
  }, [redeemPoints, points]);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    setToastMessage({ message: 'Item removed.', type: 'success' });
  };

  const handleClearCart = () => {
    if (!confirmClear) {
      setToastMessage({
        message: 'Are you sure you want to clear your cart? Click again to confirm.',
        type: 'error'
      });
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    clearCart();
    setToastMessage({ message: 'Cart cleared!', type: 'success' });
    setConfirmClear(false);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode) {
      setToastMessage({ message: 'Please enter a promo code.', type: 'error' });
      return;
    }

    if (!user) {
      setToastMessage({ message: 'Please log in to apply a promo code.', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const { data: promo, error } = await supabase
        .from('promocodes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .single();

      if (error || !promo) {
        setToastMessage({ message: 'Invalid promo code.', type: 'error' });
        setDiscount(0);
        setAppliedPromo(null);
        return;
      }

      const { data: usageData, error: usageError } = await supabase
        .from('promo_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('promo_code_id', promo.id)
        .single();

      let usageCount = 0;
      if (usageData) {
        usageCount = usageData.usage_count;
      }

      if (usageCount >= promo.max_uses_per_user) {
        setToastMessage({ message: 'You have exceeded the maximum uses for this promo code.', type: 'error' });
        setDiscount(0);
        setAppliedPromo(null);
        return;
      }

      const discountAmount = (subtotal * promo.discount) / 100;
      setDiscount(discountAmount);
      setAppliedPromo(promo);
      setToastMessage({ message: `Promo code applied! ${promo.discount}% off.`, type: 'success' });
    } catch (error) {
      setToastMessage({ message: 'Error applying promo code.', type: 'error' });
      setDiscount(0);
      setAppliedPromo(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setToastMessage({ message: 'Your cart is empty.', type: 'error' });
      return;
    }
    if (!user) {
      setToastMessage({ message: 'Please log in. Redirecting to login...', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    navigate('/checkout', { 
      state: { 
        subtotal,
        discount,
        pointsToRedeem: redeemPoints ? Math.min(points, 495) : 0,
        pointsDiscount,
        total: totalAfterDiscount,
        appliedPromo,
      } 
    });
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar showLogo={true} />

      <div style={styles.container}>
        <div style={styles.leftColumn}>
          <h2 style={styles.columnHeading}>Your Cart</h2>
          {cartItems.length === 0 ? (
            <p style={styles.emptyText}>Your cart is empty.</p>
          ) : (
            cartItems.map(item => (
              <div key={`${item.id}-${item.selectedSize || 'NA'}`} style={styles.itemCard}>
                <img
                  src={
                    item.media_urls && item.media_urls.length > 0
                      ? item.media_urls[0]
                      : 'https://via.placeholder.com/100?text=No+Image'
                  }
                  alt={item.name}
                  style={styles.itemImage}
                />
                <div style={styles.itemInfo}>
                  <h3 style={styles.itemName}>{item.name}</h3>
                  {item.selectedSize && (
                    <p style={styles.itemSize}>
                      Size: <span style={{ fontWeight: '600' }}>{item.selectedSize}</span>
                    </p>
                  )}
                  <div style={styles.qtyRow}>
                    <label>Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10);
                        if (qty >= 1 && qty <= 10) updateQuantity(item.id, qty);
                      }}
                      style={styles.qtyInput}
                    />
                  </div>
                  <p style={styles.itemPrice}>₹{item.price * item.quantity}</p>
                </div>
                <button onClick={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                  Remove
                </button>
              </div>
            ))
          )}
          {cartItems.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={handleClearCart} style={styles.clearCartBtn}>
                Clear Cart
              </button>
            </div>
          )}
        </div>

        <div style={styles.rightColumn}>
          <h2 style={styles.columnHeading}>Checkout Summary</h2>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Order Details</h3>
            {cartItems.map((item, idx) => (
              <div key={`${item.id}-${item.selectedSize}-${idx}`} style={styles.orderRow}>
                <span style={styles.orderItemName}>{item.name}</span>
                <span style={styles.orderItemMeta}>
                  Size: {item.selectedSize} | Qty: {item.quantity} | Price: ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
            <hr style={{ margin: '12px 0', borderColor: '#eee' }} />

            <div style={styles.promoCodeSection}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                style={styles.promoInput}
              />
              <button onClick={handleApplyPromoCode} style={styles.applyPromoBtn}>
                Apply
              </button>
            </div>

            <div style={styles.promoCodeSection}>
              <label style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.checked)}
                  style={styles.checkboxInput}
                />
                <span style={{
                  ...styles.checkboxCustom,
                  backgroundColor: redeemPoints ? '#Ffa500' : '#1f1f1f',
                }}>
                  {redeemPoints && <span style={styles.checkboxCheckmark}>✓</span>}
                </span>
                <span style={styles.checkboxLabel}>Redeem Points (Max ₹99)</span>
              </label>
            </div>
            {redeemPoints && (
              <p style={{ ...styles.orderItemMeta, color: '#Ffa500' }}>
                {/* {Math.min(points, 495)} points = ₹{pointsDiscount.toFixed(2)} discount */}
              </p>
            )}
            <p style={{ ...styles.orderItemMeta, color: '#9ca3af' }}>
              Available Balance: ₹{(points / 5).toFixed(2)}
            </p>

            <hr style={{ margin: '12px 0', borderColor: '#eee' }} />

            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={styles.totalRow}>
                <span>Discount ({appliedPromo?.code})</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={styles.totalRow}>
                <span>Points Discount </span>
                <span>-₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600' }}>Total</span>
              <span style={{ fontWeight: '600' }}>₹{totalAfterDiscount.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handlePlaceOrder} disabled={loadingOrder} style={styles.placeOrderBtn}>
            {loadingOrder ? 'Proceeding...' : 'Proceed to Checkout'}
          </button>
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
    </div>
  );
};

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
    gap: window.innerWidth <= 768 ? '24px' : '32px',
    padding: window.innerWidth <= 768 ? '16px' : '32px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  columnHeading: {
    marginTop: '55px',
    marginBottom: '24px',
    fontWeight: '700',
    color: 'white',
    textAlign: window.innerWidth <= 768 ? 'center' : 'left',
    fontFamily: "'Abril Extra Bold', sans-serif",
    fontSize: window.innerWidth <= 768 ? '2rem' : '2.3rem',
  },
  leftColumn: {
    flex: '1',
    width: window.innerWidth <= 768 ? '100%' : 'auto',
  },
  rightColumn: {
    flex: '1',
    width: window.innerWidth <= 768 ? '100%' : 'auto',
  },
  itemCard: {
    display: 'flex',
    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
    alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start',
    gap: window.innerWidth <= 768 ? '16px' : '20px',
    marginBottom: '24px',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: window.innerWidth <= 768 ? '16px' : '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease-in-out',
  },
  itemImage: {
    width: window.innerWidth <= 768 ? '160px' : '120px',
    height: window.innerWidth <= 768 ? '160px' : '120px',
    borderRadius: '10px',
    objectFit: 'cover',
    border: '1px solid #3f3f3f',
  },
  itemInfo: {
    flex: 1,
    textAlign: window.innerWidth <= 768 ? 'center' : 'left',
    width: window.innerWidth <= 768 ? '100%' : 'auto',
  },
  itemName: {
    fontSize: window.innerWidth <= 768 ? '1.25rem' : '1.1rem',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#ffffff',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  itemSize: {
    fontSize: window.innerWidth <= 768 ? '0.95rem' : '0.85rem',
    color: '#9ca3af',
    marginBottom: '10px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white',
    marginBottom: '10px',
    justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  qtyInput: {
    width: window.innerWidth <= 768 ? '80px' : '64px',
    padding: window.innerWidth <= 768 ? '10px' : '8px',
    borderRadius: '8px',
    border: '1px solid #3f3f3f',
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    fontSize: window.innerWidth <= 768 ? '0.95rem' : '0.9rem',
    textAlign: 'center',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  itemPrice: {
    fontSize: window.innerWidth <= 768 ? '1.25rem' : '1.1rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  removeBtn: {
    backgroundColor: '#Ffa500',
    color: 'black',
    padding: '12px 25px',
    border: 'none',
    fontFamily: "'Abril Extra Bold', sans-serif",
    borderRadius: '50px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'background-color 0.2s ease',
    fontSize: '15px',
  },
  clearCartBtn: {
    backgroundColor: 'white',
    color: 'black',
    padding: '12px 25px',
    border: 'none',
    fontFamily: "'Abril Extra Bold', sans-serif",
    borderRadius: '50px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'background-color 0.2s ease',
    fontSize: '15px',
  },
  card: {
    backgroundColor: '#2d2d2d',
    padding: window.innerWidth <= 768 ? '16px' : '24px',
    marginBottom: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
  },
  cardTitle: {
    fontSize: window.innerWidth <= 768 ? '1.4rem' : '1.3rem',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#Ffa500',
    textAlign: window.innerWidth <= 768 ? 'center' : 'left',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  orderRow: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: window.innerWidth <= 768 ? '0.95rem' : '0.9rem',
    marginBottom: '12px',
    padding: window.innerWidth <= 768 ? '8px 0' : '0',
  },
  orderItemName: {
    fontWeight: '600',
    fontSize: window.innerWidth <= 768 ? '1.05rem' : '1rem',
    color: '#ffffff',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  orderItemMeta: {
    color: '#9ca3af',
    marginLeft: window.innerWidth <= 768 ? '0' : '4px',
    marginTop: window.innerWidth <= 768 ? '4px' : '0',
    fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.85rem',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  promoCodeSection: {
    display: 'flex',
    gap: '12px',
    margin: '12px 0',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #3f3f3f',
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  applyPromoBtn: {
    backgroundColor: '#Ffa500',
    color: 'black',
    padding: '10px 20px',
    border: 'none',
    fontFamily: "'Abril Extra Bold', sans-serif",
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: '0.9rem',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkboxInput: {
    position: 'absolute',
    opacity: 0,
    cursor: 'pointer',
    height: 0,
    width: 0,
  },
  checkboxCustom: {
    height: '20px',
    width: '20px',
    border: '2px solid #Ffa500',
    borderRadius: '4px',
    marginRight: '10px',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheckmark: {
    color: 'black',
    fontSize: '14px',
    fontWeight: 'bold',
    position: 'absolute',
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: '0.9rem',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    transition: 'color 0.2s ease',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: window.innerWidth <= 768 ? '1.25rem' : '1.1rem',
    padding: window.innerWidth <= 768 ? '12px 0' : '8px 0',
    color: '#Ffa500',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  placeOrderBtn: {
    backgroundColor: 'white',
    color: 'black',
    padding: '12px 25px',
    border: 'none',
    fontFamily: "'Abril Extra Bold', sans-serif",
    borderRadius: '50px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'background-color 0.2s ease',
    fontSize: '15px',
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: window.innerWidth <= 768 ? '1.05rem' : '1rem',
    marginTop: '24px',
    padding: window.innerWidth <= 768 ? '24px' : '16px',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
};

export default CartCheckout;