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

const statusOptions = [
  'Payment Pending',
  'Payment Successful',
  'Order Cancelled',
  'Shipped',
  'Delivered',
];

const allowedTransitions = {
  'Payment Pending': ['Payment Pending', 'Payment Successful', 'Order Cancelled'],
  'Payment Successful': ['Payment Successful', 'Shipped', 'Order Cancelled'],
  'Order Cancelled': ['Order Cancelled'],
  'Shipped': ['Shipped', 'Delivered'],
  'Delivered': ['Delivered'],
  'Unknown': ['Payment Pending'],
};

const AdminInternationalOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('international_orders').select('*');

    if (searchQuery.trim()) {
      query = query.eq('id', searchQuery.trim());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      setToast({ message: 'Failed to fetch international orders.', type: 'error' });
      setOrders([]);
    } else {
      const filteredOrders = [];
      const orderMap = new Map();

      data.forEach((order) => {
        if (!orderMap.has(order.id) || new Date(order.created_at) > new Date(orderMap.get(order.id).created_at)) {
          const itemsWithUniqueIds = order.items.map((item, index) => ({
            ...item,
            id: item.id || `${order.id}-item-${index}`
          }));

          orderMap.set(order.id, {
            ...order,
            items: itemsWithUniqueIds
          });
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error: statusError } = await supabase
        .from('international_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (statusError) {
        throw new Error(`Failed to update status: ${statusError.message}`);
      }

      if (newStatus === 'Payment Successful') {
        const { data: order, error: fetchError } = await supabase
          .from('international_orders')
          .select('total, user_id, id')
          .eq('id', orderId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch order: ${fetchError.message}`);
        }

        const { data: existingPoints, error: pointsCheckError } = await supabase
          .from('point_redemptions')
          .select('id')
          .eq('order_id', orderId)
          .eq('description', `Points received for order ${orderId}`);

        if (pointsCheckError) {
          throw new Error(`Error checking existing points: ${pointsCheckError.message}`);
        }

        if (existingPoints && existingPoints.length > 0) {
          setToast({ message: `Status updated to ${newStatus}. Points already awarded.`, type: 'success' });
          await fetchOrders();
          return;
        }

        const pointsReceived = Math.floor(order.total / 100) * 10;
        const amountReceived = Math.floor(pointsReceived / 5);

        const { error: pointsInsertError } = await supabase
          .from('point_redemptions')
          .insert({
            order_id: orderId,
            points_received: pointsReceived,
            amount_received: amountReceived,
            user_id: order.user_id,
            description: `Points received for order ${orderId}`,
            created_at: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
            expiry_date: new Date(new Date().setDate(new Date().getDate() + 365 + 15)).toISOString(),
          });

        if (pointsInsertError) {
          throw new Error(`Failed to record points: ${pointsInsertError.message}`);
        }

        setToast({
          message: `Status updated to ${newStatus} and ${pointsReceived} points awarded.`,
          type: 'success'
        });
      } else if (newStatus === 'Order Cancelled') {
        const { data: order, error: fetchError } = await supabase
          .from('international_orders')
          .select('total, user_id, id, promo_code, points_redeemed, items')
          .eq('id', orderId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch order: ${fetchError.message}`);
        }

        const { data: pointsData, error: pointsFetchError } = await supabase
          .from('point_redemptions')
          .select('id, points_received')
          .eq('order_id', orderId)
          .eq('description', `Points received for order ${orderId}`);

        if (pointsFetchError) {
          throw new Error(`Error fetching points: ${pointsFetchError.message}`);
        }

        if (pointsData && pointsData.length > 0) {
          const { error: pointsDeleteError } = await supabase
            .from('point_redemptions')
            .delete()
            .eq('id', pointsData[0].id);

          if (pointsDeleteError) {
            throw new Error(`Failed to revert points: ${pointsDeleteError.message}`);
          }
        }

        if (order.promo_code) {
          const { data: promoData, error: promoFetchError } = await supabase
            .from('promocodes')
            .select('id, used')
            .eq('code', order.promo_code)
            .single();

          if (promoFetchError) {
            throw new Error(`Error fetching promo code: ${promoFetchError.message}`);
          }

          if (promoData) {
            const newUsedCount = Math.max(0, (promoData.used || 0) - 1);
            const { error: promoUpdateError } = await supabase
              .from('promocodes')
              .update({ used: newUsedCount })
              .eq('id', promoData.id);

            if (promoUpdateError) {
              throw new Error(`Failed to revert promo code usage: ${promoUpdateError.message}`);
            }

            const { data: userUsageData, error: userUsageFetchError } = await supabase
              .from('promo_usage')
              .select('usage_count')
              .eq('user_id', order.user_id)
              .eq('promo_code_id', promoData.id)
              .maybeSingle();

            if (userUsageFetchError) {
              throw new Error(`Error fetching user promo usage: ${userUsageFetchError.message}`);
            }

            if (userUsageData) {
              const newUsageCount = Math.max(0, userUsageData.usage_count - 1);
              const { error: userUsageUpdateError } = await supabase
                .from('promo_usage')
                .update({ usage_count: newUsageCount })
                .eq('user_id', order.user_id)
                .eq('promo_code_id', promoData.id);

              if (userUsageUpdateError) {
                throw new Error(`Failed to revert user promo usage: ${userUsageUpdateError.message}`);
              }
            }
          }
        }

        if (order.points_redeemed && order.points_redeemed > 0) {
          const amountRedeemed = order.points_redeemed / 5;
          const { error: pointsRestoreError } = await supabase
            .from('point_redemptions')
            .insert({
              order_id: orderId,
              points_received: order.points_redeemed,
              amount_received: amountRedeemed,
              user_id: order.user_id,
              description: `Points restored due to cancellation of order ${orderId}`,
              created_at: new Date().toISOString(),
              expiry_date: new Date(new Date().setDate(new Date().getDate() + 365)).toISOString(),
            });

          if (pointsRestoreError) {
            throw new Error(`Failed to restore redeemed points: ${pointsRestoreError.message}`);
          }
        }

        if (Array.isArray(order.items) && order.items.length > 0) {
          for (const item of order.items) {
            const { sku, selectedSize, units } = item;
            if (!sku || !selectedSize || !units) continue;

            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('size')
              .eq('id', sku)
              .single();

            if (productError || !productData) {
              throw new Error(`Failed to fetch product SKU ${sku}: ${productError ? productError.message : 'No data'}`);
            }

            let currentSizes;
            try {
              currentSizes = typeof productData.size === 'string' ? JSON.parse(productData.size) : (productData.size || {});
            } catch (parseError) {
              throw new Error(`Failed to parse sizes for SKU ${sku}: ${parseError.message}`);
            }

            const currentStock = parseInt(currentSizes[selectedSize] || 0, 10);
            const newStock = currentStock + units;
            const updatedSizes = { ...currentSizes, [selectedSize]: newStock };

            const { error: stockUpdateError } = await supabase
              .from('products')
              .update({ size: updatedSizes })
              .eq('id', sku);

            if (stockUpdateError) {
              throw new Error(`Failed to restore stock for SKU ${sku}: ${stockUpdateError.message}`);
            }
          }
        }

        setToast({
          message: `Status updated to ${newStatus}. Points, promo code, and stock reverted.`,
          type: 'success'
        });
      } else {
        setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
      }

      await fetchOrders(); 
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const exportToCSV = () => {
    if (orders.length === 0) {
      setToast({ message: 'No international orders to export.', type: 'warning' });
      return;
    }

    const headers = [
      'Order ID', 'User ID', 'Subtotal', 'Discount', 'Points Discount', 'Total', 'Status', 'Date',
      'Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Pincode', 'Country', 'Order Notes',
      'Items', 'Promo Code', 'Points Redeemed'
    ];

    const rows = orders.map(order => {
      let itemsString = '';
      if (Array.isArray(order.items)) {
        itemsString = order.items.map(item => {
          let itemDesc = `${item?.name || 'N/A'} x${item?.units || 0}`;
          if (item?.selectedSize) {
            itemDesc += ` (Size: ${item.selectedSize})`;
          }
          if (item?.sku) {
            itemDesc += ` (SKU: ${item.sku})`;
          }
          return itemDesc;
        }).join('; ');
      }

      const safeGet = (val) => val ?? '';
      return [
        safeGet(order.id),
        safeGet(order.user_id),
        formatCurrency(order.subtotal || 0),
        formatCurrency(order.discount || 0),
        formatCurrency(order.points_discount || 0),
        formatCurrency(order.total || 0),
        safeGet(order.status),
        order.created_at ? new Date(order.created_at).toLocaleString() : '',
        safeGet(order.name),
        safeGet(order.phone),
        safeGet(order.email),
        safeGet(order.address),
        safeGet(order.city),
        safeGet(order.state),
        safeGet(order.pincode),
        safeGet(order.country),
        safeGet(order.order_notes),
        itemsString,
        safeGet(order.promo_code),
        safeGet(order.points_redeemed)
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
    link.setAttribute('download', `international_orders_${timestamp}.csv`);
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
      <h2 style={styles.header}>International Orders Management</h2>

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
        <div style={styles.messageContainer}>Loading international orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.messageContainer}>
          {searchQuery.trim()
            ? `No international orders found for Order ID "${searchQuery}".`
            : 'No international orders found.'
          }
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map(order => {
            const currentStatus = allowedTransitions[order.status] ? order.status : 'Payment Pending';

            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderCardHeader}>
                  <h3 style={styles.orderId}>Order ID: <span style={styles.orderIdValue}>{order.id}</span></h3>
                <div style={styles.statusContainer}>
                {['Order Cancelled', 'Delivered'].includes(currentStatus) ? null : (
                    <select
                    value={currentStatus}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={styles.statusSelect}
                    >
                    {statusOptions.map(status => (
                        <option
                        key={status}
                        value={status}
                        disabled={!allowedTransitions[currentStatus].includes(status)}
                        >
                        {status}
                        </option>
                    ))}
                    </select>
                )}
                <span style={{ ...styles.statusBadge, ...styles.statusBadge[currentStatus] }}>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </span>
                </div>
                </div>

                <div style={styles.orderDetailsGrid}>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>User ID:</strong> {order.user_id || 'N/A'}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Placed:</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Subtotal:</strong> {formatCurrency(order.subtotal || 0)}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Discount:</strong> {formatCurrency(order.discount || 0)}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Points Discount:</strong> {formatCurrency(order.points_discount || 0)}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Total:</strong> {formatCurrency(order.total || 0)}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Promo Code:</strong> {order.promo_code || 'N/A'}</p>
                  <p style={styles.orderDetail}><strong style={styles.detailLabel}>Points Redeemed:</strong> {order.points_redeemed || '0'}</p>
                </div>

                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>Shipping Address</h4>
                  <p style={styles.addressLine}>{order.name || '-'}</p>
                  <p style={styles.addressLine}>{order.phone || '-'}</p>
                  <p style={styles.addressLine}>{order.email || '-'}</p>
                  <p style={styles.addressLine}>
                    {order.address || '-'}, {order.city || '-'}, {order.state || '-'}, {order.pincode || '-'}, {order.country || '-'}
                  </p>
                  {order.order_notes && (
                    <p style={styles.addressLine}><strong style={styles.detailLabel}>Order Notes:</strong> {order.order_notes}</p>
                  )}
                </div>

                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>Items</h4>
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <ul style={styles.itemsList}>
                      {order.items.map((item, i) => (
                        <li key={item.id || `${order.id}-item-${i}`} style={styles.itemListItem}>
                          <strong style={styles.itemName}>{item.name || 'N/A'}</strong>
                          <span style={styles.itemDetails}>
                            {' — '} {formatCurrency(item.selling_price)}
                            {item.selectedSize && ` (Size: ${item.selectedSize})`}
                            {item.units && ` (Units: ${item.units})`}
                            {item.sku && ` (SKU: ${item.sku})`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={styles.addressLine}>No items information available.</p>
                  )}
                </div>
              </div>
            );
          })}
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
    border: `1.5px solid ${colors.borderLight}`,
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
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusSelect: {
    padding: '4px 8px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderMedium}`,
    backgroundColor: colors.bgInput,
    fontSize: '0.85rem',
    color: colors.textPrimary,
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
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
    'Payment Pending': {
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
      color: '#2563eb',
    },
    'Payment Successful': {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#15803d',
    },
    'Order Cancelled': {
      backgroundColor: 'rgba(248, 113, 113, 0.2)',
      color: '#dc2626',
    },
    'Shipped': {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      color: '#d97706',
    },
    'Delivered': {
      backgroundColor: 'rgba(52, 211, 153, 0.2)',
      color: '#059669',
    },
    'Unknown': {
      backgroundColor: 'rgba(156, 163, 175, 0.2)',
      color: '#4b5563',
    },
  },
};

export default AdminInternationalOrders;