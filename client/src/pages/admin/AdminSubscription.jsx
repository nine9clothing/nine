import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage';

const NewsletterSubscriptions = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 

  const fetchSubscribers = async () => {
    setLoading(true);
    setToast(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSubscribers(data || []);

    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch subscribers.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDeleteClick = (subscriberId) => {
    setConfirmingDeleteId(subscriberId); 
    setToast(null); 
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return; 

    setIsDeleting(true); 
    setToast(null);

    try {
      const { error: deleteError } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', confirmingDeleteId);

      if (deleteError) {
        throw deleteError;
      }

      setSubscribers(prevSubscribers => prevSubscribers.filter(sub => sub.id !== confirmingDeleteId));
      setToast({ message: 'Subscriber deleted successfully!', type: 'success' });

    } catch (err) {
      setToast({ message: err.message || 'Failed to delete subscriber.', type: 'error' });
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
      }}>Newsletter Subscriptions</h2>

      {loading && <p>Loading subscribers...</p>}

      {!loading && subscribers.length > 0 && (
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
                }}>Subscribed At</th>
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
                {/* Add more headers based on your subscribers table fields */}
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
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} style={{
                  borderBottom: '1px solid #eee'
                }}>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {subscriber.created_at ? new Date(subscriber.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {subscriber.email ? <a href={`mailto:${subscriber.email}`}>{subscriber.email}</a> : 'N/A'}
                  </td>
                  {/* Add more columns based on your subscribers table fields */}
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    <button
                      onClick={() => handleDeleteClick(subscriber.id)}
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
                      disabled={loading || isDeleting || confirmingDeleteId === subscriber.id}
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

      {!loading && subscribers.length === 0 && (
        <p>No subscribers found.</p>
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
            }}>Are you sure you want to delete this subscriber? This action cannot be undone.</p>
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

export default NewsletterSubscriptions;