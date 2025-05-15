import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { AuthContext } from '../context/AuthContext'; 
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import ToastMessage from '../ToastMessage';
import Footer from "../pages/Footer";      
import axios from 'axios';

const Checkout = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, loading } = useContext(AuthContext); 
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    phone: ''
  });

  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  const [warehousePincode] = useState('421003');
  const [paymentMethod, setPaymentMethod] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const subtotal = location.state?.subtotal || cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = location.state?.discount || 0;
  const pointsToRedeem = location.state?.pointsToRedeem || 0;
  const pointsDiscount = location.state?.pointsDiscount || 0;
  const totalAfterDiscount = location.state?.total || subtotal - (discount + pointsDiscount);
  const codFee = paymentMethod === 'Cash on Delivery' ? 10 : 0; // ₹10 fee for COD
  const totalWithShipping = totalAfterDiscount + (selectedShippingOption?.rate || 0) + codFee;
  const shippingDiscount = selectedShippingOption?.rate || 0; // TEMPORARY FOR SHIPPING DISCOUNT
  const totalForDisplay = totalWithShipping - shippingDiscount; // TEMPORARY FOR SHIPPING DISCOUNT
  useEffect(() => {
    if (!loading && cartItems.length === 0 && !location.state) {
      navigate('/cart');
    }
  }, [cartItems.length, location.state, navigate, loading]);

  useEffect(() => {
    const restoreSessionAndFetchAddresses = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // console.error('Error restoring session:', error.message);
        setToastMessage({ message: 'Failed to load session. Please log in again.', type: 'error' });
        navigate('/login');
        return;
      }

      if (!loading && !user) {
        navigate('/login');
        return;
      }

      if (!loading && user) {
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id);
        if (!error) {
          // console.log('Fetched addresses:', data);
          setAddresses(data);
        } else {
          // console.error('Error fetching addresses:', error.message);
          setToastMessage({ message: `Failed to fetch addresses: ${error.message}`, type: 'error' });
        }
      }
    };

    restoreSessionAndFetchAddresses();
  }, [user, loading, navigate]);

  const checkShippingOptions = async (pincode) => {
    if (!pincode) return;
    
    setLoadingShipping(true);
    setShippingError(null);
    try {
      const totalWeight = cartItems.reduce((weight, item) => {
        return weight + (0.35 * item.quantity);
      }, 0);

      // console.log('Checking shipping for pincode:', pincode, 'with weight:', totalWeight);
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/shiprocket/check-serviceability`, {
        pickup_postcode: warehousePincode,
        delivery_postcode: pincode,
        weight: totalWeight,
        cod: true
      });

      // console.log('Shipping options response:', response.data);
      
      if (response.data.status === 'success' && response.data.data.serviceability) {
        const availableCouriers = response.data.data.available_couriers || [];
        const cheapestOption = availableCouriers.sort((a, b) => a.rate - b.rate)[0];
        setShippingOptions(availableCouriers);
        setSelectedShippingOption(cheapestOption || null);
      } else {
        setShippingOptions([]);
        setSelectedShippingOption(null);
        setShippingError('This pincode is not serviceable by our shipping partner');
      }
    } catch (error) {
      // console.error('Error checking shipping:', error);
      setShippingOptions([]);
      setSelectedShippingOption(null);
      setShippingError('Failed to check shipping options. Please try again.');
    } finally {
      setLoadingShipping(false);
    }
  };

  useEffect(() => {
    if (selectedAddressId) {
      const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
      if (selectedAddress && selectedAddress.pincode) {
        checkShippingOptions(selectedAddress.pincode);
      }
    }
  }, [selectedAddressId, addresses]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      setToastMessage({ message: 'Please log in to add an address.', type: 'error' });
      return;
    }

    const { name, address, city, pincode, phone } = newAddress;
    if (!name || !address || !city || !pincode || !phone) {
      setToastMessage({ message: 'Please fill in all address fields.', type: 'error' });
      return;
    }

    if (address.length < 4) {
      setToastMessage({ message: 'Address must be at least 4 characters long.', type: 'error' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setToastMessage({ message: 'Please enter a valid 10-digit phone number starting with 6-9.', type: 'error' });
      return;
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert([{ user_id: user.id, name, address, city, pincode, phone }])
      .select();

    if (error) {
      // console.error('Error adding address:', error.message);
      setToastMessage({ message: `Failed to add address: ${error.message}`, type: 'error' });
      return;
    }

    const fetchAddresses = async () => {
      const { data: updatedAddresses, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id);
      if (!error) {
        // console.log('Updated addresses:', updatedAddresses);
        setAddresses(updatedAddresses);
      } else {
        // console.error('Error fetching updated addresses:', error.message);
      }
    };

    await fetchAddresses();
    setShowAddAddressForm(false);
    setNewAddress({ name: '', address: '', city: '', pincode: '', phone: '' });
    setToastMessage({ message: 'Address added successfully! Please select it from the dropdown.', type: 'success' });
  };

  const handleAddressChange = (e) => {
    const newId = e.target.value;
    // console.log('Dropdown selected address ID:', newId);
    setSelectedAddressId(newId);
  };

  const handleOnlinePayment = async (promoDetails = null) => {
    setLoadingOrder(true);
    try {
      // console.log('handleOnlinePayment - addresses:', addresses);
      // console.log('handleOnlinePayment - selectedAddressId:', selectedAddressId);
      const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
      // console.log('handleOnlinePayment - selectedAddress:', selectedAddress);
  
      if (!selectedAddress) {
        throw new Error('Selected address not found');
      }
      if (!user?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        throw new Error('Invalid or missing email');
      }
      if (!selectedAddress.phone || !/^[6-9]\d{9}$/.test(selectedAddress.phone)) {
        throw new Error('Invalid phone number: ' + selectedAddress.phone);
      }
      if (isNaN(totalWithShipping) || totalWithShipping <= 0) {
        throw new Error('Invalid totalWithShipping: ' + totalWithShipping);
      }
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key not configured');
      }
  
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/razorpay/create-order`, {
        // amount: totalWithShipping,    ////TEMPORARY COMMENTED FOR SHIPPING DISCOUNT
        amount: totalForDisplay,

        currency: 'INR',
        receipt: `order_rcptid_${Date.now()}`
      });
  
      const order = response.data;
      if (order.error) {
        throw new Error('Error creating Razorpay order: ' + order.error);
      }
  
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Nine9',
        description: 'Purchase of Clothing Items',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            const verifyResult = verifyResponse.data;
            if (verifyResult.status === 'success') {
              await completeOrder(response.razorpay_payment_id, promoDetails);
            } else {
              setToastMessage({ message: 'Payment verification failed: ' + verifyResult.message, type: 'error' });
              setLoadingOrder(false);
            }
          } catch (error) {
            // console.error('Verification error:', error);
            setToastMessage({ message: 'Payment verification failed: ' + error.message, type: 'error' });
            setLoadingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingOrder(false);
            navigate('/checkout', {
              state: { subtotal, discount, pointsToRedeem, pointsDiscount, total: totalAfterDiscount, appliedPromo }
            });
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'Customer Name',
          email: user.email,
          contact: selectedAddress.phone
        },
        theme: { color: '#Ffa500' }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        // console.error('Payment failed:', response.error);
        setToastMessage({ message: `Payment failed: ${response.error.description}`, type: 'error' });
        setLoadingOrder(false);
      });
      rzp.on('payment.error', function (response) {
        // console.error('Checkout error:', response.error);
        setToastMessage({ message: `Checkout error: ${response.error.description}`, type: 'error' });
        setLoadingOrder(false);
      });
      rzp.open();
    } catch (error) {
      // console.error('Online payment error:', error);
      setToastMessage({ message: 'Failed to initiate payment: ' + error.message, type: 'error' });
      setLoadingOrder(false);
    }
  };
const completeOrder = async (paymentId = null, promoDetails = null ) => {
    if (cartItems.length === 0) {
      setToastMessage({ message: 'Your cart is empty.', type: 'error' });
      return;
    }
    if (!user) {
      setToastMessage({ message: 'Please log in.', type: 'error' });
      return;
    }
    if (!selectedAddressId) {
      setToastMessage({ message: 'Please select a delivery address.', type: 'error' });
      return;
    }
    if (!selectedShippingOption) {
      setToastMessage({ message: 'No shipping method available for this address.', type: 'error' });
      return;
    }
    if (!paymentMethod) {
      setToastMessage({ message: 'Please select a payment method.', type: 'error' });
      return;
    }
    const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
    if (!selectedAddress) {
      setToastMessage({ message: 'Selected address not found.', type: 'error' });
      return;
    }

    const order_id = `ORDER_${Date.now()}`;

  try {
    const orderItems = cartItems.map((item, index) => ({
      name: item.name,
      sku: item.id || `SKU_${item.name.replace(/\s+/g, '_')}_${index}_${item.selectedSize || 'NOSIZE'}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: '1234',
      selectedSize: item.selectedSize,
    }));

    const totalWeight = cartItems.reduce((weight, item) => {
      return weight + (0.35 * item.quantity);
    }, 0);

    const shiprocketPayload = {
      order_id,
      order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
      pickup_location: 'warehouse-1',
      billing: {
        customer_name: selectedAddress.name.split(' ')[0] || 'Customer',
        last_name: selectedAddress.name.split(' ').slice(1).join(' ') || '',
        address: selectedAddress.address,
        city: selectedAddress.city,
        pincode: selectedAddress.pincode,
        state: 'Maharashtra',
        country: 'India',
        email: user.email || 'customer@example.com',
        phone: selectedAddress.phone,
      },
      shipping: { is_billing: true },
      items: orderItems,
      sub_total: totalForDisplay,
      // sub_total: totalWithShipping, TEMPORARY FOR SHIPPING DISCOUNT
      dimensions: { length: 16, breadth: 12, height: 16, weight: totalWeight },
      user_id: user.id,
      shipping_charges: selectedShippingOption.rate,
      cod_fee: codFee,
      payment_method: paymentMethod === 'Cash on Delivery' ? 'COD' : 'Prepaid',
      courier_id: selectedShippingOption.courier_company_id,
    };

    const shiprocketResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/shiprocket/order`, shiprocketPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const dataForConfirmingPage = {
      user_id: user.id,
      order_id,
      // total: totalWithShipping,//TEMPORARY FOR SHIPPING DISCOUNT
      // total_amount: totalWithShipping,  //TEMPORARY FOR SHIPPING DISCOUNT
      total: totalForDisplay,
      total_amount: totalForDisplay,
      discount: discount + pointsDiscount,
      shipping_charges: selectedShippingOption.rate,
      cod_fee: codFee,
      items: orderItems,
      status: 'placed',
      shipping_name: selectedAddress.name,
      shipping_phone: selectedAddress.phone,
      shipping_address: selectedAddress.address,
      shipping_city: selectedAddress.city,
      shipping_pincode: selectedAddress.pincode,
      shipping_details: shiprocketResponse.data.shiprocket_response || shiprocketResponse.data,
      shipping_status: 'pending',
      display_order_id: order_id,
      courier_id: selectedShippingOption.courier_company_id,
      courier_name: selectedShippingOption.courier_name,
      estimated_delivery: selectedShippingOption.estimated_delivery_days,
      payment_method: paymentMethod,
      payment_id: paymentId,
      promoDetails: promoDetails,
    };

    sessionStorage.setItem('pendingOrderData', JSON.stringify(dataForConfirmingPage));
    window.location.href = '/confirming';
    return true;
  }
  catch (error) {
      // console.error('Shiprocket order creation or data prep error:', error);
      let errorMessage = 'Failed to process order with shipping partner';
      if (error.response) {
        errorMessage += `: ${error.response.status} - ${JSON.stringify(error.response.data?.message || error.response.data?.errors || error.response.data || error.response.statusText)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      setToastMessage({ message: errorMessage, type: 'error' });
      setLoadingOrder(false);
      return false;
    }
};
  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      setToastMessage({ message: 'Please select a payment method.', type: 'error' });
      return;
    }

 if (location.state?.appliedPromo?.id) {
  try {
    const promoId = location.state.appliedPromo.id;
    const userId = user?.id;

    if (!userId) {
      // console.error('User ID is undefined. Cannot process promo code.', { user });
      setToastMessage({ message: 'User ID is undefined. Cannot process promo code.', type: 'error' });
      return;
    }

    const { data: promoDetails, error: promoDetailsError } = await supabase
      .from('promocodes')
      .select('*')
      .eq('id', promoId)
      .single();

    if (promoDetailsError) {
      console.error('Error fetching promo details:', {
        message: promoDetailsError.message,
        code: promoDetailsError.code,
        details: promoDetailsError.details
      });
      setToastMessage({ message: `Error fetching promo details: ${promoDetailsError.message}`, type: 'error' });
      return;
    }

    if (!promoDetails) {
      // console.error('No promo details found for promo ID:', promoId);
      setToastMessage({ message: 'No promo details found for this promo code.', type: 'error' });
      return;
    }

    const usedCount = promoDetails.used;
    const limitCount = promoDetails.limit;

    if (usedCount >= limitCount) {
      setToastMessage({ message: 'This promo code has reached its usage limit.', type: 'error' });
      navigate('/cart');
      return;
    }

    if (paymentMethod === 'Paid Online') {
      await handleOnlinePayment(promoDetails);
    } else {
      setLoadingOrder(true);
      await completeOrder(null, promoDetails); 
    }

    const { data: usageData, error: usageError } = await supabase
            .from('promo_usage')
            .select('usage_count')
            .eq('user_id', user.id)
            .eq('promo_code_id', promoDetails.id)
            .single();
    
          if (usageError && usageError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
            // console.error("Error fetching promo usage:", usageError);
            
          }
          
          let usageCount = 0;
          if (usageData) {
            usageCount = usageData.usage_count;
          }
    
          if (promoDetails.max_uses_per_user && usageCount >= promoDetails.max_uses_per_user) {
            setToastMessage({ message: 'You have exceeded the maximum uses for this promo code.', type: 'error' });
            return;
          }
    if (usageError) {
      setToastMessage({ message: 'Error Occured: ', type: 'error' });
      }

  } catch (promoError) {
    console.error('Error processing promo code:', {
      message: promoError.message,
      stack: promoError.stack
    });
    setToastMessage({ message: `Error processing promo code: ${promoError.message}`, type: 'error' });
    setLoadingOrder(false);
  }
} else {
  if (paymentMethod === 'Paid Online') {
    await handleOnlinePayment(); 
  } else {
    setLoadingOrder(true);
    await completeOrder(); 
  }
}
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar showLogo={true} />
      <div style={styles.container}>
        <div style={styles.mainColumn}>
        
          <h2 style={styles.columnHeading}>Checkout</h2>

          {user && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Delivery Address</h3>
              {addresses.length > 0 ? (
                <div>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressChange}
                    style={styles.input}
                    disabled={loadingOrder}
                  >
                    {!selectedAddressId && <option value="">Select an address</option>}
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id.toString()}>
                        {addr.name} - {addr.address}, {addr.city} ({addr.pincode})
                      </option>
                    ))}
                  </select>
                  
                  {selectedAddressId && (
                    <div style={styles.selectedAddressBox}>
                      {(() => {
                        const address = addresses.find(a => a.id.toString() === selectedAddressId);
                        return address ? (
                          <div>
                            <p style={styles.addressLine}><strong>{address.name}</strong></p>
                            <p style={styles.addressLine}>{address.address}</p>
                            <p style={styles.addressLine}>{address.city} - {address.pincode}</p>
                            <p style={styles.addressLine}>Phone: {address.phone}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <p style={styles.emptyText}>No saved addresses found.</p>
              )}
              
              <button
                onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                style={styles.addAddressBtn}
                disabled={loadingOrder}
              >
                {showAddAddressForm ? 'Cancel' : 'Add New Address'}
              </button>

              {showAddAddressForm && (
                <div style={styles.addressForm}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    style={styles.input}
                    disabled={loadingOrder}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    style={styles.input}
                    disabled={loadingOrder}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    style={styles.input}
                    disabled={loadingOrder}
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    style={styles.input}
                    disabled={loadingOrder}
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    style={styles.input}
                    disabled={loadingOrder}
                  />
                  <button
                    onClick={handleAddAddress}
                    style={styles.saveAddressBtn}
                    disabled={loadingOrder}
                  >
                    Save Address
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Shipping Method</h3>
            {loadingShipping ? (
              <p style={styles.emptyText}>Loading shipping options...</p>
            ) : shippingError ? (
              <p style={styles.emptyText}>{shippingError}</p>
            ) : selectedShippingOption ? (
              <div style={styles.selectedAddressBox}>
                <p>Estimated Delivery in {selectedShippingOption.estimated_delivery_days} days</p>
                <p>Shipping Cost: ₹{selectedShippingOption.rate.toFixed(2)}</p>
              </div>
            ) : selectedAddressId ? (
              <p style={styles.emptyText}>No shipping options available for this address</p>
            ) : (
              <p style={styles.emptyText}>Please select an address to view shipping options</p>
            )}
          </div>


          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Payment Method</h3>
            <div style={styles.paymentOptions}>
              <div style={styles.paymentOption}>
                <input 
                  type="checkbox" 
                  id="cashOnDelivery" 
                  name="payment" 
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  disabled={loadingOrder}
                />
                <label htmlFor="cashOnDelivery" style={styles.paymentLabel}>Cash on Delivery (₹10 COD Fee)</label>
              </div>
              <div style={styles.paymentOption}>
                <input 
                  type="checkbox" 
                  id="paidOnline" 
                  name="payment" 
                  value="Paid Online"
                  checked={paymentMethod === 'Paid Online'}
                  onChange={() => setPaymentMethod('Paid Online')}
                  disabled={loadingOrder}
                />
                <label htmlFor="paidOnline" style={styles.paymentLabel}>Secure Razorpay (UPI, Cards, Wallets, NetBanking)</label>
              </div>
            </div>
          </div>
 <div style={styles.card}>
            <h3 style={styles.cardTitle}>Review Your Order</h3>
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
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={styles.totalRow}>
                <span>Points Discount</span>
                <span>-₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            {selectedShippingOption && (
              <div style={styles.totalRow}>
                <span>Shipping</span>
                <span>₹{selectedShippingOption.rate.toFixed(2)}</span>
              </div>
            )}
            {shippingDiscount > 0 && (                                        //TEMPORARY FOR SHIPPING DISCOUNT next 5 lines
              <div style={styles.totalRow}>
                <span>Shipping Discount</span>
                <span>-₹{shippingDiscount.toFixed(2)}</span>
              </div>
            )}
            {codFee > 0 && (
              <div style={styles.totalRow}>
                <span>COD Fee</span>
                <span>₹{codFee.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>Total</span>
              {/* <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>₹{totalWithShipping.toFixed(2)}</span>     // TEMPORARY COMMENTED FOR SHIPPING DISCOUNT */}
              <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>₹{totalForDisplay.toFixed(2)}</span>  

            </div>
          </div>
          <button 
            onClick={handleConfirmOrder} 
            disabled={loadingOrder || !selectedAddressId || !selectedShippingOption || !paymentMethod} 
            style={{
              ...styles.confirmOrderBtn,
              opacity: (!selectedAddressId || !selectedShippingOption || !paymentMethod || loadingOrder) ? 0.6 : 1
            }}
          >
            {/* {loadingOrder ? 'Confirming...' : `Confirm Order - ₹${totalWithShipping.toFixed(2)}`}   // //TEMPORARY COMMENTED FOR SHIPPING DISCOUNT */}
            {loadingOrder ? 'Confirming...' : `Confirm Order - ₹${totalForDisplay.toFixed(2)}`}
          </button>
          
          <button 
            onClick={() => navigate('/cart')}
            style={styles.backToCartBtn}
            disabled={loadingOrder}
          >
            Back to Cart
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
  selectedAddressBox: {
    padding: '14px',
    backgroundColor: '#333333',
    borderRadius: '10px',
    marginBottom: '14px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    borderLeft: '4px solid #Ffa500',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
  },
  addressLine: {
    margin: '6px 0',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
    color: '#e5e7eb',
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    padding: '12px',
    backgroundColor: '#333333',
    borderRadius: '10px',
    transition: 'background-color 0.2s ease-in-out',
  },
  paymentLabel: {
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
    fontWeight: '500',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#ffffff',
  },
  confirmOrderBtn: {
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
    opacity: 1,
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
  emptyText: {
    textAlign: 'center',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    color: '#a1a1aa',
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
    padding: '16px',
    backgroundColor: '#252525',
    borderRadius: '10px',
  },
  addAddressBtn: {
    width: '100%',
    padding: window.innerWidth <= 768 ? '8px' : '8px',
    backgroundColor: 'white',
    color: 'black',
    borderRadius: '8px',
    border: 'none',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.85rem',
    marginTop: '10px',
    transition: 'background-color 0.25s ease-in-out',
  },
  addressForm: {
    marginTop: '20px',
    padding: '14px',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    backgroundColor: '#333333',
    borderRadius: '10px',
  },
  saveAddressBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#22c55e',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
    marginTop: '10px',
    transition: 'background-color 0.25s ease-in-out',
  },
};

export default Checkout;