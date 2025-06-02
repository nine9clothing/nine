
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

const AdminNotifySize = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sendingEmail, setSendingEmail] = useState({});
  const [userEmails, setUserEmails] = useState({});
  const [availabilityStatus, setAvailabilityStatus] = useState({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('size_notifications')
        .select(`
          *,
          products (
            id,
            name,
            size
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setToast({ message: 'Failed to fetch size notifications.', type: 'error' });
        setNotifications([]);
      } else {
        setNotifications(data);
        
        const userIds = [...new Set(data.map(n => n.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          fetchUserEmails(userIds);
        }
      }
    } catch (error) {
      setToast({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserEmails = async (userIds) => {
    try {
      const { data, error } = await supabase
        .from('registered_details')
        .select('id, email')
        .in('id', userIds);

      if (error) {
      } else if (data) {
        const emailMap = {};
        data.forEach(user => {
          emailMap[user.id] = user.email;
        });
        setUserEmails(emailMap);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const checkProductSizeAvailability = async (productId, sizeToCheck) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, size, inventory_quantity')
        .eq('id', productId)
        .single();
      
      if (productError) {
        return { 
          available: false, 
          quantity: null, 
          error: 'Failed to find product' 
        };
      }
      
      if (!product || !product.size) {
        return {
          available: false,
          quantity: 0,
          error: null
        };
      }
      
      const availableSizes = product.size.split(',').map(s => s.trim());
      const available = availableSizes.includes(sizeToCheck);
      const quantity = product.inventory_quantity || 1;
      
      return {
        available: available && quantity > 0,
        quantity: available ? quantity : 0,
        error: null
      };
    } catch (error) {
      return {
        available: false,
        quantity: null,
        error: 'An unexpected error occurred'
      };
    }
  };

  const sendAvailabilityEmail = async (notification) => {
    setSendingEmail(prev => ({ ...prev, [notification.id]: true }));
    
    try {
      const availabilityResult = await checkProductSizeAvailability(notification.product_id, notification.size);
      
      if (availabilityResult.error) {
        setToast({ message: 'Could not verify product availability.', type: 'error' });
        setSendingEmail(prev => ({ ...prev, [notification.id]: false }));
        return;
      }
      
      if (!availabilityResult.available) {
        setToast({ message: 'This size is not currently in stock.', type: 'warning' });
        setSendingEmail(prev => ({ ...prev, [notification.id]: false }));
        return;
      }
      
      let userEmail = userEmails[notification.user_id];
      
      if (!userEmail) {
        const { data: userData, error: userError } = await supabase
          .from('registered_details')
          .select('email')
          .eq('id', notification.user_id)
          .single();
          
        if (userError || !userData?.email) {
          setToast({ message: 'Could not find user email.', type: 'error' });
          setSendingEmail(prev => ({ ...prev, [notification.id]: false }));
          return;
        }
        
        userEmail = userData.email;
        
        setUserEmails(prev => ({
          ...prev,
          [notification.user_id]: userEmail
        }));
      }
      
      const { data, error } = await supabase.functions.invoke('send-availability-email', {
        body: {
          userId: notification.user_id,
          email: userEmail,
          productId: notification.product_id,
          productName: notification.products?.name || 'your requested product',
          size: notification.size,
          notificationId: notification.id
        }
      });
      
      if (error) {
        setToast({ message: 'Failed to send notification email.', type: 'error' });
      } else {
        setToast({ message: 'Availability email sent successfully!', type: 'success' });
        
        const { error: updateError } = await supabase
          .from('size_notifications')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', notification.id);
          
        if (!updateError) {
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id 
                ? { ...n, email_sent: true, email_sent_at: new Date().toISOString() } 
                : n
            )
          );
        }
      }
    } catch (error) {
      setToast({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setSendingEmail(prev => ({ ...prev, [notification.id]: false }));
    }
  };

  const exportToCSV = () => {
    if (notifications.length === 0) {
      setToast({ message: 'No notifications to export.', type: 'warning' });
      return;
    }

    const headers = [
      'ID', 'User ID', 'User Email', 'Product ID', 'Product Name', 'Size', 'Created At', 'Email Sent', 'Email Sent At'
    ];

    const rows = notifications.map(notif => {
      const safeGet = (val) => val ?? '';
      return [
        safeGet(notif.id),
        safeGet(notif.user_id),
        safeGet(userEmails[notif.user_id] || ''),
        safeGet(notif.product_id),
        safeGet(notif.products?.name),
        safeGet(notif.size),
        notif.created_at ? new Date(notif.created_at).toLocaleString() : '',
        notif.email_sent ? 'Yes' : 'No',
        notif.email_sent_at ? new Date(notif.email_sent_at).toLocaleString() : ''
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
    link.setAttribute('download', `size_notifications_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (notificationId) => {
    setConfirmingDeleteId(notificationId);
    setToast(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return;

    setIsDeleting(true);
    setToast(null);

    try {
      const { error: deleteError } = await supabase
        .from('size_notifications')
        .delete()
        .eq('id', confirmingDeleteId);

      if (deleteError) {
        throw deleteError;
      }

      setNotifications(prev => prev.filter(notif => notif.id !== confirmingDeleteId));
      setToast({ message: 'Notification deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete notification.', type: 'error' });
    } finally {
      setIsDeleting(false);
      setConfirmingDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  const styles = {
    container: {
      padding: '24px 32px',
      backgroundColor: colors.bgSecondary,
      minHeight: '100vh',
      fontFamily: fonts.primary,
      color: colors.textPrimary,
      position: 'relative'
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
    notificationsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    notificationCard: {
      backgroundColor: colors.bgPrimary,
      padding: '24px',
      borderRadius: '12px',
      boxShadow: colors.shadow,
      border: `1px solid ${colors.borderLight}`,
    },
    notificationDetailsVertical: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    notificationDetail: {
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
    actionButton: {
      padding: '8px 16px',
      backgroundColor: colors.secondary,
      color: colors.textLight,
      border: 'none',
      borderRadius: '6px',
      fontWeight: 500,
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginTop: '16px',
    },
    actionButtonDisabled: {
      backgroundColor: colors.textMuted,
      cursor: 'not-allowed',
    },
    deleteButton: {
      padding: '6px 12px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9em',
      transition: 'background-color 0.2s ease, opacity 0.2s ease',
      opacity: 1
    },
    deleteButtonDisabled: {
      padding: '6px 12px',
      backgroundColor: '#e9ecef',
      color: '#6c757d',
      border: 'none',
      borderRadius: '4px',
      fontSize: '0.9em',
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    availableTag: {
      display: 'inline-block',
      backgroundColor: colors.success,
      color: colors.textLight,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      marginTop: '16px',
      marginRight: '8px',
    },
    emailSentTag: {
      display: 'inline-block',
      backgroundColor: colors.success,
      color: colors.textLight,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      marginTop: '16px',
    },
    actionsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '16px',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Size Notifications</h2>

      <div style={styles.controlsContainer}>
        <button
          onClick={exportToCSV}
          style={{
            ...styles.exportButton,
            ...(notifications.length === 0 ? styles.exportButtonDisabled : {})
          }}
          disabled={notifications.length === 0}
        >
          Export to CSV
        </button>
      </div>

      {loading ? (
        <div style={styles.messageContainer}>Loading size notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.messageContainer}>No size notifications found.</div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map(notif => (
            <div key={notif.id} style={styles.notificationCard}>
              <div style={styles.notificationDetailsVertical}>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Notification ID:</strong> {notif.id}
                </p> 
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>User ID:</strong> {notif.user_id || 'N/A'}
                </p>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>User Email:</strong> {userEmails[notif.user_id] || 'Loading...'}
                </p>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Product ID:</strong> {notif.product_id || 'N/A'}
                </p>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Product Name:</strong> {notif.products?.name || 'N/A'}
                </p>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Size:</strong> {notif.size || 'N/A'}
                </p>
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Created:</strong>{' '}
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'N/A'}
                </p>
                
                <p style={styles.notificationDetail}>
                  <strong style={styles.detailLabel}>Available Sizes:</strong>{' '}
                  {notif.products?.size || 'N/A'}
                </p>
                
                {availabilityStatus[notif.id]?.checked && availabilityStatus[notif.id].available && (
                  <div style={styles.availableTag}>
                    Available (Qty: {availabilityStatus[notif.id].quantity})
                  </div>
                )}
                
                {notif.email_sent && (
                  <>
                    <div style={styles.emailSentTag}>Email Sent</div>
                    {notif.email_sent_at && (
                      <p style={styles.notificationDetail}>
                        <strong style={styles.detailLabel}>Email Sent At:</strong>{' '}
                        {new Date(notif.email_sent_at).toLocaleString()}
                      </p>
                    )}
                  </>
                )}
                
                <div style={styles.actionsContainer}>
                  <div>
                    {/* {!notif.email_sent && (
                      <button
                        onClick={() => sendAvailabilityEmail(notif)}
                        disabled={sendingEmail[notif.id] || isDeleting}
                        style={{
                          ...styles.actionButton,
                          ...(sendingEmail[notif.id] || isDeleting ? styles.actionButtonDisabled : {})
                        }}
                      >
                        {sendingEmail[notif.id] ? 'Sending...' : 'Send Availability Email'}
                      </button>
                    )} */}
                  </div>
                  <button
                    onClick={() => handleDeleteClick(notif.id)}
                    style={(loading || isDeleting) ? styles.deleteButtonDisabled : styles.deleteButton}
                    disabled={loading || isDeleting || confirmingDeleteId === notif.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmingDeleteId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '25px 30px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            minWidth: '300px',
            maxWidth: '450px',
            zIndex: 1001
          }}>
            <p style={{
              fontSize: '1.1em',
              color: '#333',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>Are you sure you want to delete this notification? This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px'
            }}>
              <button
                onClick={handleConfirmDelete}
                style={isDeleting ? {
                  padding: '10px 18px',
                  backgroundColor: '#e9ecef',
                  color: '#6c757d',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1em',
                  fontWeight: '500',
                  cursor: 'not-allowed',
                  opacity: 0.8
                } : {
                  padding: '10px 18px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
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

export default AdminNotifySize;