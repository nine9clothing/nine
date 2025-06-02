import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const colors = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  secondary: '#10b981',
  success: '#22c55e',
  error: '#ef4444',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textLight: '#ffffff',
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgInput: '#ffffff',
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  focusRing: '0 0 0 3px rgba(99, 102, 241, 0.3)',
};

const fonts = {
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, total, shipping_charges, courier_name, courier_id');

    if (searchQuery.trim()) {
      query = query.eq('order_id', searchQuery.trim());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      setToast({ message: 'Failed to fetch orders.', type: 'error' });
      setOrders([]);
    } else {
      const filteredOrders = [];
      const orderMap = new Map();

      data.forEach((order) => {
        if (
          order.order_id === order.display_order_id &&
          order.payment_method &&
          order.payment_method !== 'N/A'
        ) {
          if (!orderMap.has(order.order_id) || new Date(order.created_at) > new Date(orderMap.get(order.order_id).created_at)) {
            const itemsWithUniqueIds = order.items.map((item, index) => ({
              ...item,
              id: item.id || `${order.order_id}-item-${index}`
            }));

            orderMap.set(order.order_id, {
              ...order,
              items: itemsWithUniqueIds
            });
          }
        }
      });

      filteredOrders.push(...orderMap.values());
      setOrders(filteredOrders || []);
    }

    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const exportToCSV = () => {
    if (orders.length === 0) {
      setToast({ message: 'No orders to export.', type: 'warning' });
      return;
    }

    const headers = ['Order ID', 'User ID', 'Net Total', 'Shipping Status', 'Date', 'Name', 'Phone', 'Address', 'City', 'Pincode', 'Items', 'Payment Method', 'Courier Name', 'Courier ID'];

    const rows = orders.map(order => {
      let itemsString = '';
      if (Array.isArray(order.items)) {
        itemsString = order.items.map(item => {
          let itemDesc = `${item?.name || 'N/A'} x${item?.quantity || 0}`;
          if (item?.selectedSize) {
            itemDesc += ` (Size: ${item.selectedSize})`;
          }
          if (item?.units) {
            itemDesc += ` (Units: ${item.units})`;
          }
          if (item?.sku) {
            itemDesc += ` (SKU: ${item.sku})`;
          }
          return itemDesc;
        }).join('; ');
      }

      const safeGet = (val) => val ?? '';
      // const netTotal = ((order.total || 0) - (order.shipping_charges || 0)- (order.cod_fee || 0)).toFixed(2);
      const netTotal = ((order.total || 0) - (order.cod_fee || 0)).toFixed(2);

      return [
        safeGet(order.id),
        safeGet(order.user_id),
        netTotal,
        safeGet(order.shipping_status),
        order.created_at ? new Date(order.created_at).toLocaleString() : '',
        safeGet(order.shipping_name),
        safeGet(order.shipping_phone),
        safeGet(order.shipping_address),
        safeGet(order.shipping_city),
        safeGet(order.shipping_pincode),
        itemsString,
        safeGet(order.payment_method),
        safeGet(order.courier_name),
        safeGet(order.courier_id)
      ];
    });

    const escapeCsvField = (field) => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `nine9_orders_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '₹--';
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Orders Management</h2>

      <div style={styles.controlsContainer}>
        <div style={styles.filterGroup}>
          <label htmlFor="searchQuery" style={styles.label}>Search by Order ID:</label>
          <input
            id="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Order ID"
            style={styles.textInput}
          />
        </div>

        <button
          onClick={exportToCSV}
          style={orders.length === 0 ? { ...styles.exportButton, ...styles.exportButtonDisabled } : styles.exportButton}
          disabled={orders.length === 0}
        >
          Export Current View to CSV
        </button>
      </div>

      {loading ? (
        <div style={styles.messageContainer}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.messageContainer}>
          {searchQuery.trim()
            ? `No orders found for Order ID "${searchQuery}".`
            : 'No orders with a valid payment method found.'
          }
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map(order => (
            <div key={order.order_id} style={styles.orderCard}>
              <div style={styles.orderCardHeader}>
                <h3 style={styles.orderId}>Order ID: <span style={styles.orderIdValue}>{order.display_order_id}</span></h3>
                <span style={{ ...styles.statusBadge, ...styles.statusBadge[order.shipping_status] }}>
                  {order.shipping_status ? order.shipping_status.charAt(0).toUpperCase() + order.shipping_status.slice(1) : 'Unknown'}
                </span>
              </div>

              <div style={styles.orderDetailsGrid}>
                <p style={styles.orderDetail}><strong style={styles.detailLabel}>User ID:</strong> {order.user_id || 'N/A'}</p>
                <p style={styles.orderDetail}><strong style={styles.detailLabel}>Placed:</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
                <p style={styles.orderDetail}><strong style={styles.detailLabel}>Net Total:</strong> {formatCurrency((order.total || 0) - (order.cod_fee || 0))}</p>
                {/* <p style={styles.orderDetail}><strong style={styles.detailLabel}>Net Total:</strong> {formatCurrency((order.total || 0) - (order.shipping_charges || 0)- (order.cod_fee || 0))}</p> */}

                <div>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Courier:</strong> {order.courier_name || 'N/A'}</p>
                  {order.courier_name && order.courier_id && (
                    <p style={styles.orderDetail}><strong style={styles.detailLabel}>Courier ID:</strong> {order.courier_id}</p>
                  )}
                </div>
                <div>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Payment Method:</strong> {order.payment_method}</p>
                  {order.payment_method === 'Paid Online' && order.payment_id && (
                    <p style={styles.orderDetail}><strong style={styles.detailLabel}>Payment ID:</strong> {order.payment_id}</p>
                  )}
                </div>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Shipping Address</h4>
                <p style={styles.addressLine}>{order.shipping_name || '-'}</p>
                <p style={styles.addressLine}>{order.shipping_phone || '-'}</p>
                <p style={styles.addressLine}>
                  {order.shipping_address || '-'}, {order.shipping_city || '-'} - {order.shipping_pincode || '-'}
                </p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Items</h4>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <ul style={styles.itemsList}>
                    {order.items.map((item, i) => (
                      <li key={item.id || `${order.order_id}-item-${i}`} style={styles.itemListItem}>
                        <strong style={styles.itemName}>{item.name || 'N/A'}</strong>
                        <span style={styles.itemDetails}>
                          {' — '} {formatCurrency(item.selling_price)}
                          {item.selectedSize && ` (Size: ${item.selectedSize})`}
                          {item.units && ` (Units: ${item.units})`}
                          {item.sku && ` (ID: ${item.sku})`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.addressLine}>No items information available.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 32px',
    backgroundColor: colors.bgSecondary,
    minHeight: '100vh',
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  header: {
    fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
    fontWeight: 500,
    fontFamily: "'Oswald', sans-serif",
    color: colors.textPrimary,
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  controlsContainer: {
    marginBottom: '32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontWeight: 500,
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
  textInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderMedium}`,
    backgroundColor: colors.bgInput,
    fontSize: '0.9rem',
    color: colors.textPrimary,
    minWidth: '150px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  exportButton: {
    padding: '9px 18px',
    backgroundColor: colors.textPrimary,
    color: colors.textLight,
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
    whiteSpace: 'nowrap',
  },
  exportButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  messageContainer: {
    textAlign: 'center',
    padding: '40px 20px',
    color: colors.textSecondary,
    fontSize: '1rem',
    backgroundColor: colors.bgPrimary,
    borderRadius: '12px',
    boxShadow: colors.shadow,
    marginTop: '20px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderCard: {
    backgroundColor: colors.bgPrimary,
    padding: '24px',
    borderRadius: '12px',
    boxShadow: colors.shadow,
    border: `1px solid ${colors.borderLight}`,
  },
  orderCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  orderId: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  },
  orderIdValue: {
    fontWeight: 400,
    color: colors.textSecondary,
    marginLeft: '8px',
    wordBreak: 'break-all',
  },
  orderDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '8px 16px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  orderDetail: {
    margin: 0,
    fontSize: '0.9rem',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  detailLabel: {
    fontWeight: 600,
    color: colors.textPrimary,
    marginRight: '6px',
  },
  section: {
    marginTop: '16px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '8px',
  },
  addressLine: {
    margin: '0 0 4px 0',
    fontSize: '0.9rem',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  itemsList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    listStyle: 'none',
  },
  itemListItem: {
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: colors.textSecondary,
    position: 'relative',
    paddingLeft: '5px',
  },
  itemName: {
    fontWeight: 600,
    color: colors.textPrimary,
  },
  itemDetails: {
    color: colors.textSecondary,
    marginLeft: '4px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'capitalize',
    color: colors.textPrimary,
    backgroundColor: colors.borderMedium,
    placed: {
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
      color: '#2563eb',
    },
    shipped: {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      color: '#d97706',
    },
    delivered: {
      backgroundColor: 'rgba(52, 211, 153, 0.2)',
      color: '#059669',
    },
    cancelled: {
      backgroundColor: 'rgba(248, 113, 113, 0.2)',
      color: '#dc2626',
    },
    Unknown: {
      backgroundColor: 'rgba(156, 163, 175, 0.2)',
      color: '#4b5563',
    },
  },
};

export default AdminOrders;