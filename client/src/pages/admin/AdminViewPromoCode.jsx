import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const ViewPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingDisplayId, setUpdatingDisplayId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const fetchPromoCodes = async () => {
    setLoading(true);
    setToast(null);

    try {
      const { data, error } = await supabase
        .from('promocodes')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch promo codes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch products.', type: 'error' });
    }
  };

  useEffect(() => {
    fetchPromoCodes();
    fetchProducts();
  }, []);

  const handleDeleteClick = (promoId) => {
    setConfirmingDeleteId(promoId);
    setToast(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return;

    setIsDeleting(true);
    setToast(null);

    try {
      const { error: usageError } = await supabase
        .from('promo_usage')
        .delete()
        .eq('promo_code_id', confirmingDeleteId);

      if (usageError) throw usageError;

      const { error: promoError } = await supabase
        .from('promocodes')
        .delete()
        .eq('id', confirmingDeleteId);

      if (promoError) throw promoError;

      setPromoCodes((prev) => prev.filter((promo) => promo.id !== confirmingDeleteId));
      setToast({ message: 'Promo code deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({
        message: err.message || 'Failed to delete promo code. Please ensure no usage records exist or adjust the foreign key constraint.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmingDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  const handleToggleDisplay = async (promoId, currentDisplayStatus) => {
    setUpdatingDisplayId(promoId);
    setToast(null);
    const newDisplayStatus = !currentDisplayStatus;

    try {
      const { error } = await supabase
        .from('promocodes')
        .update({ display: newDisplayStatus })
        .eq('id', promoId);

      if (error) throw error;

      setPromoCodes(prevCodes =>
        prevCodes.map(p =>
          p.id === promoId ? { ...p, display: newDisplayStatus } : p
        )
      );
      setToast({ message: `Promo code display set to ${newDisplayStatus}.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update display status.', type: 'error' });
    } finally {
      setUpdatingDisplayId(null);
    }
  };

  const handleProductChange = async (promoId, newProductId) => {
    setUpdatingProductId(promoId);
    setToast(null);

    try {
      const { error } = await supabase
        .from('promocodes')
        .update({ product_id: newProductId || null })
        .eq('id', promoId);

      if (error) throw error;

      setPromoCodes(prevCodes =>
        prevCodes.map(p =>
          p.id === promoId ? { ...p, product_id: newProductId, products: products.find(prod => prod.id === newProductId) || null } : p
        )
      );
      setToast({ message: 'Product updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update product.', type: 'error' });
    } finally {
      setUpdatingProductId(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ 
          fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', 
          fontWeight: 500, 
          fontFamily: "'Oswald', sans-serif" 
        }}>
          Promo Codes
        </h2>
      </div>

      {loading && <p>Loading promo codes...</p>}

      {!loading && promoCodes.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Code</th>
                <th style={tableHeaderStyle}>Discount (%)</th>
                <th style={tableHeaderStyle}>Limit</th>
                <th style={tableHeaderStyle}>Used</th>
                <th style={tableHeaderStyle}>Remaining</th>
                <th style={tableHeaderStyle}>Product</th>
                <th style={tableHeaderStyle}>Display</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => {
                const remainingUses = (promo.limit || 0) - (promo.used || 0);
                const isCurrentlyUpdatingDisplay = updatingDisplayId === promo.id;
                const isCurrentlyUpdatingProduct = updatingProductId === promo.id;
                const isSomeActionInProgress = loading || isDeleting || confirmingDeleteId !== null;

                return (
                  <tr key={promo.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tableCellStyle}>
                      {promo.created_at ? new Date(promo.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={tableCellStyle}>{promo.code}</td>
                    <td style={tableCellStyle}>{promo.discount}</td>
                    <td style={tableCellStyle}>{promo.limit !== null ? promo.limit : 'N/A'}</td>
                    <td style={tableCellStyle}>{promo.used !== null ? promo.used : 'N/A'}</td>
                    <td style={tableCellStyle}>{remainingUses >= 0 ? remainingUses : 'N/A'}</td>
                    <td style={tableCellStyle}>
                      <select
                        value={promo.product_id || ''}
                        onChange={(e) => handleProductChange(promo.id, e.target.value)}
                        style={{ ...inputStyle, padding: '6px' }}
                        disabled={isSomeActionInProgress || isCurrentlyUpdatingDisplay || isCurrentlyUpdatingProduct}
                      >
                        <option value="">No product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => handleToggleDisplay(promo.id, promo.display)}
                          style={{
                            ...smallButtonStyle,
                            backgroundColor: isCurrentlyUpdatingDisplay ? '#ccc' : (promo.display ? '#ffc107' : '#28a745'),
                            minWidth: '100px',
                          }}
                          disabled={isSomeActionInProgress || isCurrentlyUpdatingDisplay || isCurrentlyUpdatingProduct}
                        >
                          {isCurrentlyUpdatingDisplay ? (
                            <div style={spinnerContainer}>
                              <div style={{ ...spinner, borderTop: '2px solid #333' }}></div>
                            </div>
                          ) : (promo.display ? "Don't Display" : "Display")}
                        </button>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleDeleteClick(promo.id)}
                        style={{
                          ...smallButtonStyle,
                          backgroundColor: '#dc3545',
                          opacity: (isSomeActionInProgress && confirmingDeleteId !== promo.id) || isCurrentlyUpdatingDisplay || isCurrentlyUpdatingProduct ? 0.7 : 1,
                        }}
                        disabled={isSomeActionInProgress || isCurrentlyUpdatingDisplay || isCurrentlyUpdatingProduct || confirmingDeleteId === promo.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && promoCodes.length === 0 && <p>No promo codes found.</p>}

      {confirmingDeleteId && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <p style={modalText}>
              Are you sure you want to delete this promo code? This action cannot be undone.
            </p>
            <div style={modalButtonContainer}>
              <button
                onClick={handleConfirmDelete}
                style={isDeleting ? { ...buttonStyle, backgroundColor: '#dc3545', opacity: 0.6, cursor: 'not-allowed' } : { ...buttonStyle, backgroundColor: '#dc3545' }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div style={spinnerContainer}>
                    <div style={spinner}></div>
                    <span style={{ marginLeft: '10px' }}>Deleting...</span>
                  </div>
                ) : 'Confirm Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                style={isDeleting ? { ...buttonStyle, backgroundColor: '#6c757d', opacity: 0.6, cursor: 'not-allowed' } : { ...buttonStyle, backgroundColor: '#6c757d' }}
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

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  backgroundColor: '#fff',
  borderRadius: '6px',
  overflow: 'hidden'
};

const tableHeaderStyle = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  padding: '12px 15px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#333',
  fontSize: '0.9em',
  whiteSpace: 'nowrap',
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '12px 15px',
  verticalAlign: 'middle',
  fontSize: '0.95em',
  color: '#333',
};

const buttonStyle = {
  padding: '10px 15px',
  backgroundColor: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginRight: '6px',
  fontSize: '0.95rem',
  opacity: 1,
  transition: 'opacity 0.2s ease, background-color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
};

const smallButtonStyle = {
  padding: '6px 12px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9em',
  opacity: 1,
  transition: 'opacity 0.2s ease, background-color 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: '#fff',
  padding: '25px 30px',
  borderRadius: '8px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  textAlign: 'center',
  minWidth: '300px',
  maxWidth: '450px',
  zIndex: 1001,
};

const modalText = {
  fontSize: '1.1em',
  color: '#333',
  marginBottom: '20px',
  lineHeight: '1.5',
};

const modalButtonContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const spinnerContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
};

const spinner = {
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '50%',
  borderTop: '2px solid #ffffff',
  width: '16px',
  height: '16px',
  animation: 'spin 1s linear infinite',
};

if (typeof window !== 'undefined') {
  if (!document.getElementById('spinner-keyframes-style')) {
    const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'spinner-keyframes-style';
    styleElement.innerHTML = spinnerKeyframes;
    document.head.appendChild(styleElement);
  }
}

export default ViewPromoCodes;