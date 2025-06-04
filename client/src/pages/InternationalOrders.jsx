import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../pages/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import ToastMessage from '../ToastMessage';

const InternationalOrders = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, loading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    phone: '',
    email: '',
    order_notes: ''
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const subtotal = location.state?.subtotal || cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = location.state?.discount || 0;
  const pointsToRedeem = location.state?.pointsToRedeem || 0;
  const pointsDiscount = location.state?.pointsDiscount || 0;
  const appliedPromo = location.state?.appliedPromo || null;
  const total = location.state?.total || subtotal - (discount + pointsDiscount);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;

      try {
        const { data: addressData, error: addressError } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('shipping', 'International');

        if (addressError) {
          setToastMessage({ message: `Failed to fetch addresses: ${addressError.message}`, type: 'error' });
          return;
        }

        setAddresses(addressData || []);
      } catch (error) {
        setToastMessage({ message: `Unexpected error: ${error.message}`, type: 'error' });
      }
    };

    fetchAddresses();
  }, [user]);

  const handleAddressChange = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    if (addressId === '') {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        phone: '',
        email: '',
        order_notes: ''
      });
      return;
    }

    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setFormData({
        name: selectedAddress.name || '',
        address: selectedAddress.address || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode || '',
        country: selectedAddress.country || '',
        phone: selectedAddress.phone || '',
        email: formData.email, 
        order_notes: formData.order_notes 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const { name, address, city, state, pincode, country, phone, email } = formData;

    if (!name || !address || !city || !state || !pincode || !country || !phone || !email) {
      return { valid: false, message: 'Please fill in all required fields.', type: 'error' };
    }

    if (address.length < 4) {
      return { valid: false, message: 'Address must be at least 4 characters long.', type: 'error' };
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return { valid: false, message: 'Please enter a valid phone number (10-15 digits).', type: 'error' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address.', type: 'error' };
    }

    return { valid: true };
  };

  const handleConfirmSubmit = () => {
    setToastMessage(null);

    const validation = validateForm();
    if (!validation.valid) {
      setToastMessage({ message: validation.message, type: validation.type });
      return;
    }

    setShowConfirmToast(true);
    setLoadingSubmit(true); 
    setTimeout(() => {
      setShowConfirmToast(false);
      handleSubmit();
    }, 4000);
  };

  const handleSubmit = async () => {
    if (!user) {
      setToastMessage({ message: 'Please log in to submit the order.', type: 'error' });
      navigate('/login');
      setLoadingSubmit(false);
      return;
    }

    try {
      let addressIdToUse = selectedAddressId;
      if (!selectedAddressId) {
        const { name, address, city, state, pincode, country, phone } = formData;
        const { data: addressData, error: addressError } = await supabase
          .from('user_addresses')
          .insert([
            {
              user_id: user.id,
              name,
              address,
              city,
              state,
              pincode,
              country,
              phone,
              shipping: 'International',
            },
          ])
          .select()
          .single();

        if (addressError) {
          setToastMessage({ message: `Failed to save address: ${addressError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        addressIdToUse = addressData.id;
        setAddresses(prev => [...prev, addressData]); 
      }

      let promoDetails = null;
      if (appliedPromo?.id) {
        const { data: promoData, error: promoError } = await supabase
          .from('promocodes')
          .select('*')
          .eq('id', appliedPromo.id)
          .single();

        if (promoError) {
          setToastMessage({ message: `Error fetching promo details: ${promoError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        if (!promoData) {
          setToastMessage({ message: 'No promo details found for this promo code.', type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        const usedCount = promoData.used;
        const limitCount = promoData.limit;

        if (usedCount >= limitCount) {
          setToastMessage({ message: 'This promo code has reached its usage limit.', type: 'error' });
          navigate('/cart');
          setLoadingSubmit(false);
          return;
        }

        const { data: usageData, error: usageError } = await supabase
          .from('promo_usage')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('promo_code_id', promoData.id)
          .single();

        let usageCount = 0;
        if (usageData) {
          usageCount = usageData.usage_count;
        }

        if (promoData.max_uses_per_user && usageCount >= promoData.max_uses_per_user) {
          setToastMessage({ message: 'You have exceeded the maximum uses for this promo code.', type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        promoDetails = promoData;
      }

      const orderItems = cartItems.map((item, index) => ({
        name: item.name,
        sku: item.id || `SKU_${item.name.replace(/\s+/g, '_')}_${index}_${item.selectedSize || 'NOSIZE'}`,
        units: item.quantity,
        selling_price: item.price,
        selectedSize: item.selectedSize,
      }));

      const { data: insertedOrder, error } = await supabase.from('international_orders').insert([
        {
          user_id: user.id,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          order_notes: formData.order_notes || null,
          items: orderItems,
          subtotal: subtotal,
          discount: discount,
          points_discount: pointsDiscount,
          total: total,
          created_at: new Date().toISOString(),
          promo_code_id: promoDetails?.id || null,
          promo_code: promoDetails?.code || null,
          points_redeemed: pointsToRedeem,
          status: "Payment Pending",
        },
      ]).select().single();

      if (error) {
        setToastMessage({ message: `Failed to submit order: ${error.message}`, type: 'error' });
        setLoadingSubmit(false);
        return;
      }

      if (pointsDiscount > 0 && !promoDetails) {
        const pointsToDeduct = pointsDiscount * 5;
        const { error: redemptionInsertError } = await supabase
          .from('point_redemptions')
          .insert({
            order_id: insertedOrder.id,
            points_redeemed: pointsToDeduct,
            amount_redeemed: pointsDiscount,
            user_id: user.id,
            description: `Points redeemed for international order ${insertedOrder.id}`,
            created_at: new Date().toISOString(),
          });

        if (redemptionInsertError) {
          setToastMessage({ message: `Error recording points redemption: ${redemptionInsertError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }
      }

      for (const item of orderItems) {
        const { sku, selectedSize, units } = item;
        if (!selectedSize) {
          continue;
        }
        try {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('size, name')
            .eq('id', sku)
            .single();

          if (productError) throw productError;
          if (!productData) {
            continue;
          }

          let currentSizes;
          try {
            currentSizes = typeof productData.size === 'string' ? JSON.parse(productData.size) : (productData.size || {});
          } catch (parseError) {
            continue;
          }

          const currentStock = parseInt(currentSizes[selectedSize] || 0, 10);

          if (currentStock < units) {
            throw new Error(
              `Insufficient stock for ${productData.name} (SKU ${sku}, Size ${selectedSize}). Ordered: ${units}, Available: ${currentStock}.`
            );
          }

          const newStock = currentStock - units;
          const updatedSizes = { ...currentSizes, [selectedSize]: newStock };

          const { error: updateError } = await supabase
            .from('products')
            .update({ size: updatedSizes })
            .eq('id', sku);

          if (updateError) throw updateError;
        } catch (stockUpdateError) {
          setToastMessage({ message: `Error updating stock for item ${sku}: ${stockUpdateError.message}. Contact support.`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }
      }

      if (promoDetails) {
        const { error: updateError } = await supabase
          .from('promocodes')
          .update({ used: promoDetails.used + 1 })
          .eq('id', promoDetails.id);

        if (updateError) {
          setToastMessage({ message: `Error updating promo code usage: ${updateError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        const { data: existingUsage, error: fetchError } = await supabase
          .from('promo_usage')
          .select('id, usage_count')
          .eq('user_id', user.id)
          .eq('promo_code_id', promoDetails.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          setToastMessage({ message: `Error checking promo usage: ${fetchError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }

        let usageError;

        if (existingUsage) {
          const { error: updateError } = await supabase
            .from('promo_usage')
            .update({
              usage_count: existingUsage.usage_count + 1,
            })
            .eq('id', existingUsage.id);

          usageError = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('promo_usage')
            .insert([{
              user_id: user.id,
              promo_code_id: promoDetails.id,
              usage_count: 1,
            }]);

          usageError = insertError;
        }

        if (usageError) {
          setToastMessage({ message: `Error recording promo usage: ${usageError.message}`, type: 'error' });
          setLoadingSubmit(false);
          return;
        }
      }

      clearCart();
      setToastMessage({ message: 'Order submitted successfully!', type: 'success' });
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        phone: '',
        email: '',
        order_notes: ''
      });
      setSelectedAddressId(''); 
      navigate('/cart');
    } catch (error) {
      setToastMessage({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const styles = {
    pageWrapper: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      backgroundColor: 'black',
      color: '#ffffff',
    },
    container: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      padding: window.innerWidth <= 768 ? '12px' : '32px 20px',
      maxWidth: window.innerWidth <= 768 ? '100%' : '1000px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    },
    mainColumn: {
      width: window.innerWidth <= 768 ? '100%' : '95%',
      maxWidth: window.innerWidth <= 768 ? '100%' : '1500px',
      padding: window.innerWidth <= 768 ? '0' : '12px',
    },
    columnHeading: {
      marginTop: window.innerWidth <= 768 ? '60px' : '60px',
      marginBottom: '20px',
      fontSize: '2rem',
      fontWeight: '700',
      fontFamily: "'Abril Extra Bold', sans-serif",
      color: '#Ffa500',
      textAlign: 'center',
    },
    card: {
      backgroundColor: '#252525',
      padding: window.innerWidth <= 768 ? '12px' : '24px',
      marginBottom: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      fontFamily: "'Abril Extra Bold', sans-serif",
      marginBottom: '16px',
      color: '#ffffff',
      borderBottom: '1px solid #404040',
      paddingBottom: '10px',
      textAlign: 'left',
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '14px',
      borderRadius: '8px',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      border: '1px solid #404040',
      backgroundColor: '#1f1f1f',
      color: '#ffffff',
      fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
      transition: 'border-color 0.2s ease-in-out',
    },
    select: {
      width: '100%',
      padding: '10px',
      marginBottom: '14px',
      borderRadius: '8px',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      border: '1px solid #404040',
      backgroundColor: '#1f1f1f',
      color: '#ffffff',
      fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
      transition: 'border-color 0.2s ease-in-out',
    },
    textarea: {
      width: '100%',
      padding: '10px',
      marginBottom: '14px',
      borderRadius: '8px',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      border: '1px solid #404040',
      backgroundColor: '#1f1f1f',
      color: '#ffffff',
      fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
      transition: 'border-color 0.2s ease-in-out',
      minHeight: '80px',
      resize: 'vertical',
    },
    orderRow: {
      display: 'flex',
      flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
      fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
      marginBottom: '12px',
      padding: '12px',
      backgroundColor: '#333333',
      borderRadius: '10px',
      justifyContent: window.innerWidth <= 768 ? 'flex-start' : 'space-between',
      alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
      transition: 'background-color 0.2s ease-in-out',
    },
    orderItemHeader: {
      display: 'flex',
      fontFamily: "'Abril Extra Bold', sans-serif",
      justifyContent: 'space-between',
      marginBottom: window.innerWidth <= 768 ? '6px' : '0',
      width: window.innerWidth <= 768 ? '100%' : '70%',
    },
    orderItemName: {
      fontFamily: "'Louvette Semi Bold', sans-serif",
      fontWeight: '600',
      fontSize: window.innerWidth <= 768 ? '0.95rem' : '1rem',
      color: '#ffffff',
    },
    orderItemPrice: {
      fontFamily: "'Louvette Semi Bold', sans-serif",
      fontWeight: '600',
      fontSize: window.innerWidth <= 768 ? '0.95rem' : '1rem',
      color: '#ffffff',
    },
    orderItemMeta: {
      color: '#a1a1aa',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.85rem',
      width: window.innerWidth <= 768 ? '100%' : '30%',
      textAlign: window.innerWidth <= 768 ? 'left' : 'right',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1px 1px',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      borderRadius: '10px',
      marginTop: '12px',
      fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    submitBtn: {
      width: '100%',
      padding: window.innerWidth <= 768 ? '14px' : '16px',
      backgroundColor: '#Ffa500',
      color: 'black',
      borderRadius: '8px',
      border: 'none',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: window.innerWidth <= 768 ? '0.95rem' : '1rem',
      marginBottom: '14px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      transition: 'background-color 0.25s ease-in-out, transform 0.2s ease-in-out',
    },
    backToCartBtn: {
      width: '100%',
      padding: window.innerWidth <= 768 ? '10px' : '12px',
      backgroundColor: 'transparent',
      color: '#ffffff',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      borderRadius: '8px',
      border: '1px solid #6b7280',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
      marginBottom: '24px',
      transition: 'border-color 0.25s ease-in-out, color 0.25s ease-in-out',
    },
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar showLogo={true} />
      <div style={styles.container}>
        <div style={styles.mainColumn}>
          <h2 style={styles.columnHeading}>International Order</h2>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>International Delivery Information</h3>
            {addresses.length > 0 && (
              <select
                value={selectedAddressId}
                onChange={handleAddressChange}
                style={styles.select}
                disabled={loadingSubmit}
              >
                <option value="">Select an Address</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {addr.name}, {addr.address}, {addr.city}, {addr.state}, {addr.country} - {addr.pincode}
                  </option>
                ))}
              </select>
            )}
            <p style={styles.label}>Add new Address</p>
            <input
              type="text"
              name="name"
              placeholder="Full Name *"
              value={formData.name}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={formData.address}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="city"
              placeholder="City *"
              value={formData.city}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="state"
              placeholder="State/Province *"
              value={formData.state}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="pincode"
              placeholder="Pincode/Postal Code *"
              value={formData.pincode}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="country"
              placeholder="Country *"
              value={formData.country}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address *"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              disabled={loadingSubmit}
            />
            <textarea
              name="order_notes"
              placeholder="Order Notes (Optional)"
              value={formData.order_notes}
              onChange={handleInputChange}
              style={styles.textarea}
              disabled={loadingSubmit}
            />
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Order Summary</h3>
            {cartItems.map((item, idx) => (
              <div key={`${item.id}-${item.selectedSize}-${idx}`} style={styles.orderRow}>
                <div style={styles.orderItemHeader}>
                  <span style={styles.orderItemName}>{item.name}</span>
                  <span style={styles.orderItemPrice}>₹{item.price * item.quantity}</span>
                </div>
                <span style={styles.orderItemMeta}>
                  Size: {item.selectedSize} | Qty: {item.quantity}
                </span>
              </div>
            ))}
            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={styles.totalRow}>
                <span>Discount {appliedPromo ? `(${appliedPromo.code})` : ''}</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={styles.totalRow}>
                <span>Points Discount ({pointsToRedeem} points)</span>
                <span>-₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>Total</span>
              <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleConfirmSubmit}
            disabled={loadingSubmit}
            style={{
              ...styles.submitBtn,
              opacity: loadingSubmit ? 0.6 : 1,
            }}
          >
            {loadingSubmit ? 'Submitting...' : 'Submit Order'}
          </button>

          <button
            onClick={() => navigate('/cart')}
            style={styles.backToCartBtn}
            disabled={loadingSubmit}
          >
            Back to Cart
          </button>
        </div>
      </div>
      <Footer />
      {showConfirmToast && (
        <ToastMessage
          message="For payment, customer support will contact you"
          type="success"
          onClose={() => setShowConfirmToast(false)}
        />
      )}
      {toastMessage && !showConfirmToast && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default InternationalOrders;