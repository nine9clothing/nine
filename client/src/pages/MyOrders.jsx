import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import Navbar from '../components/Navbar';
import ToastMessage from '../ToastMessage';
import Footer from "../pages/Footer";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [exchangeReason, setExchangeReason] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const exchangeReasons = [
    'Wrong item received',
    'Item defective or damaged',
    'Size does not fit',
    'Other'
  ];

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: regularOrders, error: regularError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: internationalOrders, error: internationalError } = await supabase
        .from('international_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (regularError || internationalError) {
        setToastMessage({ 
          message: `Error loading orders: ${regularError?.message || internationalError?.message}`, 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const filteredOrders = [];
      const orderMap = new Map();
      const skus = new Set();

      regularOrders.forEach((order) => {
        if (
          order.order_id === order.display_order_id &&
          order.payment_method && 
          order.payment_method !== 'N/A'
        ) {
          order.items.forEach(item => skus.add(item.sku));
          if (!orderMap.has(order.order_id) || new Date(order.created_at) > new Date(orderMap.get(order.order_id).created_at)) {
            const itemsWithUniqueIds = order.items.map((item, index) => ({
              ...item,
              id: item.id || `${order.order_id}-item-${index}`
            }));
            orderMap.set(order.order_id, {
              ...order,
              items: itemsWithUniqueIds,
              isInternational: false
            });
          }
        }
      });

      internationalOrders.forEach((order) => {
        if (!orderMap.has(order.id) || new Date(order.created_at) > new Date(orderMap.get(order.id).created_at)) {
          const itemsWithUniqueIds = order.items.map((item, index) => ({
            ...item,
            id: item.id || `${order.id}-item-${index}`,
            sku: item.sku || item.id
          }));
          orderMap.set(order.id, {
            ...order,
            order_id: order.id,
            display_order_id: order.id,
            shipping_status: order.status,
            shipping_name: order.name,
            shipping_phone: order.phone,
            shipping_address: order.address,
            shipping_city: order.city,
            shipping_pincode: order.pincode,
            payment_method: order.payment_method || 'N/A',
            items: itemsWithUniqueIds,
            isInternational: true
          });
          order.items.forEach(item => item.sku && skus.add(item.sku));
        }
      });

      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, media_urls')
        .in('id', Array.from(skus));

      if (productError) {
        setToastMessage({ message: 'Error fetching product images: ' + productError.message, type: 'error' });
      }

      const productImageMap = new Map();
      products?.forEach(product => {
        const img = Array.isArray(product.media_urls)
          ? product.media_urls.find(url => url.match(/\.(jpeg|jpg|png|gif|webp)$/i))
          : null;
        productImageMap.set(product.id, img || 'https://via.placeholder.com/100?text=No+Image');
      });

      orderMap.forEach((order) => {
        const updatedItems = order.items.map(item => ({
          ...item,
          image_url: productImageMap.get(item.sku) || 'https://via.placeholder.com/100?text=No+Image'
        }));
        filteredOrders.push({ ...order, items: updatedItems });
      });

      filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(filteredOrders);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const canExchange = (createdAt, shipping_status) => {
    const orderDate = new Date(createdAt);
    const currentDate = new Date();
    const diffTime = currentDate - orderDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return shipping_status.toLowerCase() === 'delivered' && diffDays <= 5 && diffDays >= 0;
  };

  const isExchangeTimelineExceeded = (createdAt, shipping_status) => {
    const orderDate = new Date(createdAt);
    const currentDate = new Date();
    const diffTime = currentDate - orderDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return shipping_status.toLowerCase() === 'delivered' && diffDays > 5;
  };

  const openExchangeModal = (orderId) => {
    setSelectedOrderId(orderId);
    setExchangeReason('');
    setSelectedItems([]);
    setShowExchangeModal(true);
  };

  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleExchange = async () => {
    if (!exchangeReason) {
      setToastMessage({
        message: 'Please select a reason for the exchange.',
        type: 'error'
      });
      return;
    }

    if (selectedItems.length === 0) {
      setToastMessage({
        message: 'Please select at least one product to exchange.',
        type: 'error'
      });
      return;
    }

    try {
      const orderToUpdate = orders.find(order => order.order_id === selectedOrderId);

      if (!orderToUpdate) {
        throw new Error('Order not found');
      }

      const updatedItems = orderToUpdate.items.map(item => {
        if (selectedItems.includes(item.id)) {
          return {
            ...item,
            exchange_requested: true
          };
        }
        return item;
      });

      const exchangedItemsWithDetails = orderToUpdate.items
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          id: item.id,
          name: item.name
        }));

      const tableName = orderToUpdate.isInternational ? 'international_orders' : 'orders';
      const { error } = await supabase
        .from(tableName)
        .update({
          items: updatedItems,
          exchange_requested: true,
          exchange_reason: exchangeReason,
          exchanged_items: exchangedItemsWithDetails,
          exchange_status: 'pending'
        })
        .eq(orderToUpdate.isInternational ? 'id' : 'order_id', selectedOrderId);

      if (error) {
        throw new Error(error.message);
      }

      setToastMessage({
        message: `Exchange request initiated for selected items in order #${selectedOrderId}. Please wait for confirmation.`,
        type: 'success'
      });

      setOrders(orders.map(order =>
        order.order_id === selectedOrderId
          ? {
              ...order,
              items: updatedItems,
              exchange_requested: true,
              exchange_reason: exchangeReason,
              exchanged_items: exchangedItemsWithDetails,
              exchange_status: 'pending'
            }
          : order
      ));

      setShowExchangeModal(false);
      setSelectedOrderId(null);
      setExchangeReason('');
      setSelectedItems([]);
    } catch (error) {
      setToastMessage({
        message: `Failed to request exchange for order #${selectedOrderId}: ${error.message}`,
        type: 'error'
      });
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar showLogo={true} />
      <div style={isMobile ? styles.containerMobile : styles.container}>
        <h2 style={isMobile ? styles.headingMobile : styles.heading}>My Orders</h2>

        {loading ? (
          <p style={styles.message}>Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p style={styles.message}>No orders with a valid payment method found.</p>
        ) : (
          orders.map((order) => (
            <div key={order.order_id} style={isMobile ? styles.orderCardMobile : styles.orderCard}>
              {isMobile ? (
                <>
                  <div style={styles.orderHeaderMobile}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={styles.orderIdMobile}>#{order.display_order_id}</h3>
                      {order.isInternational && (
                        <span style={styles.internationalTagMobile}>International Order</span>
                      )}
                    </div>
                    <span style={{
                      ...styles.orderStatusMobile,
                      backgroundColor:
                        order.shipping_status.toLowerCase() === 'placed' ? '#1e7e34' :
                        order.shipping_status.toLowerCase() === 'shipped' ? '#005cbf' :
                        order.shipping_status.toLowerCase() === 'delivered' ? '#117a8b' :
                        order.shipping_status.toLowerCase() === 'order cancelled' ? '#c82333' :
                        order.shipping_status.toLowerCase() === 'payment pending' ? '#1e4976' :
                        order.shipping_status.toLowerCase() === 'payment successful' ? '#1c7430' :
                        order.shipping_status.toLowerCase() === 'payment failed' ? '#a71d2a' :
                        '#5a6268'
                    }}>
                      {order.shipping_status}
                    </span>
                  </div>

                  <div style={styles.mobileMetaInfo}>
                    <p style={styles.metaMobile}><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                    <p style={styles.metaMobile}><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
                    {!order.isInternational && (
                      <p style={styles.metaMobile}><strong>Payment Method:</strong> {order.payment_method}</p>
                    )}
                    {order.isInternational && (
                      <p style={styles.metaMobile}><strong>Country:</strong> {order.country || 'N/A'}</p>
                    )}
                  </div>

                  <div style={styles.mobileSection}>
                    <p style={styles.subTitleMobile}>Shipping Address</p>
                    <p style={styles.metaMobile}>{order.shipping_name}, {order.shipping_phone}</p>
                    <p style={styles.metaMobile}>{order.shipping_address}, {order.shipping_city} - {order.shipping_pincode}</p>
                    {order.isInternational && (
                      <p style={styles.metaMobile}>{order.country}</p>
                    )}
                  </div>

                  <div style={styles.mobileSection}>
                    <p style={styles.subTitleMobile}>Items</p>
                    {order.items.map((item, idx) => (
                      <div key={`${order.order_id}-item-${idx}`} style={styles.itemRowMobile}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={styles.itemImageMobile}
                        />
                        <div style={styles.itemInfoMobile}>
                          <p style={styles.itemNameMobile}>{item.name}</p>
                          <p style={styles.itemDetailsMobile}>Size: {item.selectedSize || 'N/A'} × {item.quantity || item.units || 1}</p>
                          {item.exchange_requested && (
                            <p style={styles.exchangeTagMobile}>Exchange Requested</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.exchange_requested ? (
                    <div style={styles.mobileSection}>
                      <p style={styles.subTitleMobile}>Exchange Status</p>
                      <p style={styles.metaMobile}>
                        Status: {order.exchange_status ? order.exchange_status.charAt(0).toUpperCase() + order.exchange_status.slice(1) : 'Pending'}
                      </p>
                      <p style={styles.metaMobile}><strong>Reason:</strong> {order.exchange_reason}</p>
                    </div>
                  ) : !order.isInternational && isExchangeTimelineExceeded(order.created_at, order.shipping_status) ? (
                    <p style={styles.exchangeTimelineExceededMobile}>
                      Exchange timeline exceeded. Products can only be exchanged within 5 days of delivery.
                    </p>
                  ) : !order.isInternational && canExchange(order.created_at, order.shipping_status) && (
                    <button
                      style={styles.exchangeButtonMobile}
                      onClick={() => openExchangeModal(order.order_id)}
                    >
                      Request Exchange
                    </button>
                  )}
                </>
              ) : (
                <div style={styles.row}>
                  <div style={styles.leftCol}>
                    <div style={styles.orderHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={styles.orderId}>#{order.display_order_id}</h3>
                        {order.isInternational && (
                          <span style={styles.internationalTag}>International Order</span>
                        )}
                      </div>
                      <span style={{
                        ...styles.orderStatus,
                        backgroundColor:
                          order.shipping_status.toLowerCase() === 'placed' ? '#1e7e34' :
                          order.shipping_status.toLowerCase() === 'shipped' ? '#005cbf' :
                          order.shipping_status.toLowerCase() === 'delivered' ? '#117a8b' :
                          order.shipping_status.toLowerCase() === 'order cancelled' ? '#c82333' :
                          order.shipping_status.toLowerCase() === 'payment pending' ? '#1e4976' :
                          order.shipping_status.toLowerCase() === 'payment successful' ? '#1c7430' :
                          order.shipping_status.toLowerCase() === 'payment failed' ? '#a71d2a' :
                          '#5a6268'
                      }}>
                        {order.shipping_status}
                      </span>
                    </div>

                    <p style={styles.meta}><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                    <p style={styles.meta}><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
                    {!order.isInternational && (
                      <p style={styles.meta}><strong>Payment Method:</strong> {order.payment_method}</p>
                    )}
                    {order.isInternational && (
                      <p style={styles.meta}><strong>Country:</strong> {order.country || 'N/A'}</p>
                    )}

                    <div style={styles.section}>
                      <p style={styles.subTitle}>Shipping Address</p>
                      <p style={styles.meta}>{order.shipping_name}, {order.shipping_phone}</p>
                      <p style={styles.meta}>{order.shipping_address}, {order.shipping_city} - {order.shipping_pincode}</p>
                      {order.isInternational && (
                        <p style={styles.meta}>{order.country}</p>
                      )}
                    </div>

                    {order.exchange_requested ? (
                      <div style={styles.section}>
                        <p style={styles.subTitle}>Exchange Status</p>
                        <p style={styles.meta}>
                          Status: {order.exchange_status ? order.exchange_status.charAt(0).toUpperCase() + order.exchange_status.slice(1) : 'Pending'}
                        </p>
                        <p style={styles.meta}><strong>Reason:</strong> {order.exchange_reason}</p>
                      </div>
                    ) : !order.isInternational && isExchangeTimelineExceeded(order.created_at, order.shipping_status) ? (
                      <p style={styles.exchangeTimelineExceeded}>
                        Exchange timeline exceeded.<br/> Products can only be exchanged within 5 days of delivery.
                      </p>
                    ) : !order.isInternational && canExchange(order.created_at, order.shipping_status) && (
                      <button
                        style={styles.exchangeButton}
                        onClick={() => openExchangeModal(order.order_id)}
                      >
                        Request Exchange
                      </button>
                    )}
                  </div>

                  <div style={styles.rightCol}>
                    <p style={styles.subTitle}>Items</p>
                    {order.items.map((item, idx) => (
                      <div key={`${order.order_id}-item-${idx}`} style={styles.itemRow}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={styles.itemImage}
                        />
                        <div style={styles.itemInfo}>
                          <p style={styles.itemName}>{item.name}</p>
                          <p style={styles.itemDetails}>Size: {item.selectedSize || 'N/A'} × {item.quantity || item.units || 1}</p>
                          {item.exchange_requested && (
                            <p style={styles.exchangeTag}>Exchange Requested</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Footer />

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {showExchangeModal && (
        <div style={styles.modalOverlay}>
          <div style={isMobile ? styles.modalContentMobile : styles.modalContent}>
            <h3 style={styles.modalTitle}>Request Exchange</h3>

            <div style={styles.modalSection}>
              <p style={styles.modalSubtitle}>Select Items for Exchange</p>
              <div style={styles.itemSelectionContainer}>
                {orders.find(order => order.order_id === selectedOrderId)?.items.map((item, idx) => (
                  <div key={`exchange-item-${idx}`} style={styles.exchangeItemRow}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                      <div style={styles.itemPreview}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={styles.exchangeItemImage}
                        />
                        <div>
                          <p style={styles.exchangeItemName}>{item.name}</p>
                          <p style={styles.exchangeItemDetails}>
                            Size: {item.selectedSize || 'N/A'} × {item.quantity || item.units || 1}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.modalSection}>
              <p style={styles.modalSubtitle}>Select Reason for Exchange</p>
              <select
                style={styles.select}
                value={exchangeReason}
                onChange={(e) => setExchangeReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                {exchangeReasons.map((reason, idx) => (
                  <option key={idx} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowExchangeModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.submitButton}
                onClick={handleExchange}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'black',
    fontFamily: "'Roboto', sans-serif"
  },
  container: {
    flex: 1,
    padding: '40px 20px',
    maxWidth: '1150px',
    margin: '0 auto',
  },
  heading: {
    fontFamily: "'Abril Extra Bold', sans-serif",
    fontSize: "2.5rem",
    fontWeight: '700',
    textAlign: 'center',
    marginTop: '60px',
    marginBottom: '40px',
    color: '#Ffa500',
  },
  message: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#666',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '30px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '40px',
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: '1 1 60%',
    minWidth: '300px',
  },
  rightCol: {
    flex: '1 1 40%',
    minWidth: '250px',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  orderId: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#111',
    margin: 0,
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  orderStatus: {
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    textTransform: 'capitalize',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  internationalTag: {
    display: 'inline-block',
    color: 'black',
    border:'1px solid black',
    fontSize: '0.85rem',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  meta: {
    fontSize: '0.95rem',
    margin: '6px 0',
    color: '#444',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  section: {
    marginTop: '20px',
  },
  subTitle: {
    fontWeight: '600',
    fontSize: '1.05rem',
    marginBottom: '8px',
    color: '#111',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
    backgroundColor: '#fafafa',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #eee',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: '4px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  itemDetails: {
    fontSize: '0.9rem',
    color: '#666',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  exchangeTag: {
    display: 'inline-block',
    backgroundColor: '#Ffa500',
    color: 'black',
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '4px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  exchangeButton: {
    marginTop: '20px',
    padding: '8px 16px',
    backgroundColor: '#Ffa500',
    color: 'black',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  exchangeTimelineExceeded: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    fontSize: '0.95rem',
    border: '1px solid #f5c6cb',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  containerMobile: {
    flex: 1,
    padding: '20px 12px',
    maxWidth: '100%',
    margin: '0 auto',
  },
  headingMobile: {
    fontFamily: "'Abril Extra Bold', sans-serif",
    fontSize: "1.5rem",
    fontWeight: '700',
    textAlign: 'center',
    marginTop: '50px',
    marginBottom: '30px',
    color: '#Ffa500',
  },
  orderCardMobile: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
  },
  orderHeaderMobile: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  orderIdMobile: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#111',
    margin: 0,
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  orderStatusMobile: {
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    textTransform: 'capitalize',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  internationalTagMobile: {
    display: 'inline-block',
    backgroundColor: '#Ffa500',
    color: 'black',
    fontSize: '0.75rem',
    padding: '1px 6px',
    borderRadius: '4px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  mobileMetaInfo: {
    marginBottom: '12px',
  },
  metaMobile: {
    fontSize: '0.9rem',
    margin: '4px 0',
    color: '#444',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  mobileSection: {
    marginTop: '16px',
    paddingBottom: '4px',
  },
  subTitleMobile: {
    fontWeight: '600',
    fontSize: '1rem',
    marginBottom: '6px',
    color: '#111',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  itemRowMobile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
    backgroundColor: '#fafafa',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  itemImageMobile: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  itemInfoMobile: {
    flex: 1,
    overflow: 'hidden',
  },
  itemNameMobile: {
    fontWeight: '600',
    marginBottom: '2px',
    fontSize: '0.9rem',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  itemDetailsMobile: {
    fontSize: '0.85rem',
    color: '#666',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  exchangeTagMobile: {
    display: 'inline-block',
    backgroundColor: '#17a2b8',
    color: '#fff',
    fontSize: '0.7rem',
    padding: '1px 4px',
    borderRadius: '4px',
    marginTop: '2px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  exchangeButtonMobile: {
    marginTop: '16px',
    padding: '6px 12px',
    backgroundColor: '#Ffa500',
    color: 'black',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  exchangeTimelineExceededMobile: {
    marginTop: '16px',
    padding: '8px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    fontSize: '0.85rem',
    border: '1px solid #f5c6cb',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
    maxHeight: '85vh',
    overflow: 'auto',
  },
  modalContentMobile: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '12px',
    maxWidth: '90%',
    width: '100%',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
    maxHeight: '85vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#111',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  modalSection: {
    marginBottom: '20px',
  },
  modalSubtitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  modalText: {
    fontSize: '1rem',
    marginBottom: '16px',
    color: '#444',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  itemSelectionContainer: {
    maxHeight: '200px',
    overflow: 'auto',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '10px',
  },
  exchangeItemRow: {
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: '#f9f9f9',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#Ffa500',
  },
  itemPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  exchangeItemImage: {
    width: '50px',
    height: '50px',
    borderRadius: '6px',
    objectFit: 'cover',
  },
  exchangeItemName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    marginBottom: '2px',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  exchangeItemDetails: {
    fontSize: '0.8rem',
    color: '#666',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  select: {
    width: '100%',
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontFamily: "'Louvette Semi Bold', sans-serif"
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#Ffa500',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: "'Abril Extra Bold', sans-serif"
  },
};

export default MyOrders;