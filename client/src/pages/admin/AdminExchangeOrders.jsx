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

const AdminExchangeOrders = () => {
  const [exchangeOrders, setExchangeOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const fetchExchangeOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('id, order_id, user_id, exchange_status, exchange_reason, created_at, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_pincode, exchanged_items')
      .eq('exchange_requested', true)
      .not('display_order_id', 'is', null);

    if (statusFilter !== 'all') {
      query = query.eq('exchange_status', statusFilter);
    }

    const { data: exchangeData, error: exchangeError } = await query.order('created_at', { ascending: false });

    if (exchangeError) {
      setToast({ message: 'Failed to fetch exchange orders.', type: 'error' });
      setExchangeOrders([]);
      setLoading(false);
      return;
    }

    const parsedData = exchangeData.map(order => ({
      ...order,
      exchanged_items: order.exchanged_items ? JSON.parse(order.exchanged_items.replace(/'/g, '"')) : []
    }));
    setExchangeOrders(parsedData);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchExchangeOrders();
  }, [fetchExchangeOrders]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ exchange_status: newStatus })
      .eq('id', orderId);

    if (error) {
      setToast({ message: 'Failed to update exchange status.', type: 'error' });
    } else {
      setToast({ message: 'Exchange status updated successfully!', type: 'success' });
      fetchExchangeOrders();
    }
  }, [fetchExchangeOrders]);

  const exportToCSV = () => {
    if (exchangeOrders.length === 0) {
      setToast({ message: 'No exchange orders to export.', type: 'warning' });
      return;
    }

    const headers = [
      'Exchange ID', 'Order ID', 'User ID', 'Status', 'Reason', 'Date',
      'Name', 'Phone', 'Address', 'City', 'Pincode', 'Exchanged Item'
    ];

    const rows = exchangeOrders.map(order => {
      const safeGet = (val) => val ?? '';
      
      // Extract the first item name from the parsed exchanged_items array
      const exchangedItemName = Array.isArray(order.exchanged_items) && order.exchanged_items.length > 0 
        ? order.exchanged_items[0].name || 'N/A'
        : 'N/A';

      return [
        safeGet(order.id),
        safeGet(order.order_id),
        safeGet(order.user_id),
        safeGet(order.exchange_status),
        safeGet(order.exchange_reason),
        order.created_at ? new Date(order.created_at).toLocaleString() : '',
        safeGet(order.shipping_name),
        safeGet(order.shipping_phone),
        safeGet(order.shipping_address),
        safeGet(order.shipping_city),
        safeGet(order.shipping_pincode),
        exchangedItemName
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
    link.setAttribute('download', `nine9_exchange_orders_${statusFilter}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Exchange Orders Management</h2>

      <div style={styles.controlsContainer}>
        <div style={styles.filterGroup}>
          <label htmlFor="statusFilter" style={styles.label}>Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          style={{
            ...styles.exportButton,
            ...(exchangeOrders.length === 0 ? styles.exportButtonDisabled : {})
          }}
          disabled={exchangeOrders.length === 0}
        >
          Export Current View to CSV
        </button>
      </div>

      {loading ? (
        <div style={styles.messageContainer}>Loading exchange orders...</div>
      ) : exchangeOrders.length === 0 ? (
        <div style={styles.messageContainer}>
          No exchange orders found {statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}.
        </div>
      ) : (
        <div style={styles.ordersList}>
          {exchangeOrders.map(order => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderCardHeader}>
                <span style={{ 
                  ...styles.statusBadge, 
                  ...(styles.statusBadge[order.exchange_status] || styles.statusBadge.Unknown) 
                }}>
                  {order.exchange_status ? order.exchange_status.charAt(0).toUpperCase() + order.exchange_status.slice(1) : 'Unknown'}
                </span>
              </div>

              <div style={styles.orderDetailsGrid}>
                <p style={styles.orderDetail}>
                  <strong style={styles.detailLabel}>Order ID:</strong> {order.order_id || 'N/A'}
                </p>
                <p style={styles.orderDetail}>
                  <strong style={styles.detailLabel}>User ID:</strong> {order.user_id || 'N/A'}
                </p>
                <p style={styles.orderDetail}>
                  <strong style={styles.detailLabel}>Requested:</strong>{' '}
                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                </p>
                <p style={styles.orderDetail}>
                  <strong style={styles.detailLabel}>Reason:</strong> {order.exchange_reason || 'N/A'}
                </p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Shipping Address</h4>
                <p style={styles.addressLine}>{order.shipping_name || '-'}</p>
                <p style={styles.addressLine}>{order.shipping_phone || '-'}</p>
                <p style={styles.addressLine}>
                  {order.shipping_address || '-'}, {order.shipping_city || '-'} - {order.shipping_pincode || '-'}
                </p>
                <p style={styles.addressLine}>
                  <strong style={styles.detailLabel}>Exchanged Item:</strong>{' '}
                  {Array.isArray(order.exchanged_items) && order.exchanged_items.length > 0 
                    ? order.exchanged_items[0].name || 'N/A' 
                    : 'N/A'}
                </p>
              </div>

              <div style={styles.statusUpdateContainer}>
                <label htmlFor={`status-${order.id}`} style={styles.label}>Update Status:</label>
                <select
                  id={`status-${order.id}`}
                  value={order.exchange_status || ''}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
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
  selectInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderMedium}`,
    backgroundColor: colors.bgInput,
    fontSize: '0.9rem',
    color: colors.textPrimary,
    cursor: 'pointer',
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
  statusUpdateContainer: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.borderLight}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    pending: {
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
      color: '#2563eb',
    },
    approved: {
      backgroundColor: 'rgba(52, 211, 153, 0.2)',
      color: '#059669',
    },
    rejected: {
      backgroundColor: 'rgba(248, 113, 113, 0.2)',
      color: '#dc2626',
    },
    completed: {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      color: '#d97706',
    },
    Unknown: {
      backgroundColor: 'rgba(156, 163, 175, 0.2)',
      color: '#4b5563',
    },
  },
};

export default AdminExchangeOrders;