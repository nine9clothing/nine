import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 

  const fetchMessages = async () => {
    setLoading(true);
    setToast(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);

    } catch (err) {
      console.error("Error fetching contact messages:", err);
      setToast({ message: err.message || 'Failed to fetch messages.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDeleteClick = (messageId) => {
    setConfirmingDeleteId(messageId); 
    setToast(null); 
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return; 

    setIsDeleting(true); 
    setToast(null);

    try {
      const { error: deleteError } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', confirmingDeleteId);

      if (deleteError) {
        throw deleteError;
      }

      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== confirmingDeleteId));
      setToast({ message: 'Message deleted successfully!', type: 'success' });

    } catch (err) {
        console.error("Error deleting message:", err);
        setToast({ message: err.message || 'Failed to delete message.', type: 'error' });
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
      }}>Contact Form Messages</h2>

      {loading && <p>Loading messages...</p>}

      {!loading && messages.length > 0 && (
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
                }}>Received</th>
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
                }}>Message</th>
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
              {messages.map((message) => (
                <tr key={message.id} style={{
                  borderBottom: '1px solid #eee'
                }}>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {message.created_at ? new Date(message.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{message.name || 'N/A'}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {message.email ? <a href={`mailto:${message.email}`}>{message.email}</a> : 'N/A'}
                  </td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    {message.phone ? <a href={`tel:${message.phone}`}>{message.phone}</a> : 'N/A'}
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
                  }}>{message.message || 'N/A'}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    <button
                      onClick={() => handleDeleteClick(message.id)}
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
                      disabled={loading || isDeleting || confirmingDeleteId === message.id}
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

      {!loading && messages.length === 0 && (
        <p>No messages found.</p>
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
            }}>Are you sure you want to delete this message? This action cannot be undone.</p>
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

export default AdminMessages;