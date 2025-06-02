import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage';

const AdminCartData = () => {
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 

  const fetchCartData = async () => {
    setLoading(true);
    setToast(null);

    try {
      const { data: cartDataResult, error: cartError } = await supabase
        .from('cart_data')
        .select('*')
        .neq('user_id', 'c586ff15-713a-4f3b-9c01-4f043885ad41')
        .order('updated_at', { ascending: false });

      if (cartError) throw cartError;

      const userIds = cartDataResult.map(item => item.user_id);
      const { data: regData, error: regError } = await supabase
        .from('registered_details')
        .select('id, email, full_name ,phone')
        .in('id', userIds);

      if (regError) throw regError;

      const combinedData = cartDataResult.map(cartItem => ({
        ...cartItem,
        registered_details: regData.find(reg => reg.id === cartItem.user_id) || {}
      }));

      setCartData(combinedData || []);

    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch cart data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const handleDeleteClick = (userId) => {
    setConfirmingDeleteId(userId); 
    setToast(null); 
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return; 

    setIsDeleting(true); 
    setToast(null);

    try {
      const { error: deleteError } = await supabase
        .from('cart_data')
        .delete()
        .eq('user_id', confirmingDeleteId);

      if (deleteError) {
        throw deleteError;
      }

      setCartData(prevData => prevData.filter(item => item.user_id !== confirmingDeleteId));
      setToast({ message: 'Cart data deleted successfully!', type: 'success' });

    } catch (err) {
      setToast({ message: err.message || 'Failed to delete cart data.', type: 'error' });
    } finally {
      setIsDeleting(false); 
      setConfirmingDeleteId(null); 
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null); 
  };

  return (
    <div style={{
      padding: '25px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <h2 style={{
        fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
        fontWeight: 500,
        fontFamily: "'Oswald', sans-serif",
        marginBottom: '25px',
        color: '#333',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>User Cart Data</h2>

      {loading && <p>Loading cart data...</p>}

      {!loading && cartData.length > 0 && (
        <div style={{
          overflowX: 'auto',
          marginTop: '20px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>User ID</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Name</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Email</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Phone</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Cart Items</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Updated At</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cartData.map((item) => (
                <tr key={item.user_id} style={{
                  borderBottom: '1px solid #eee'
                }}>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {item.user_id || 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {item.registered_details?.full_name || 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {item.registered_details?.email || 'N/A'}
                  </td>
                  <td style={{
                      border: '1px solid #dee2e6',
                      padding: '12px 15px',
                      verticalAlign: 'top',
                      fontSize: '0.95em',
                      color: '#333'
                    }}>
                      {item.registered_details?.phone || 'N/A'}
                    </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    minWidth: '300px',
                    maxWidth: '500px'
                  }}>
                    {item.cart_items && item.cart_items.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {item.cart_items.map((cartItem, index) => (
                          <li key={index}>
                            {cartItem.name} (ID: {cartItem.id})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: 'red' }}>No items in cart</span>
                    )}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    <button
                      onClick={() => handleDeleteClick(item.user_id)}
                      style={(loading || isDeleting) ? {
                        padding: '6px 12px',
                        backgroundColor: '#e9ecef',
                        color: '#6c757d',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        opacity: 0.7,
                        cursor: 'not-allowed'
                      } : {
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        transition: 'background-color 0.2s ease, opacity 0.2s ease',
                        opacity: 1
                      }}
                      disabled={loading || isDeleting || confirmingDeleteId === item.user_id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && cartData.length === 0 && (
        <p>No cart data found.</p>
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
            }}>Are you sure you want to delete this cart data? This action cannot be undone.</p>
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

export default AdminCartData;