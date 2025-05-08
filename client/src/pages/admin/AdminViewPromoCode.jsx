import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const ViewPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch promo codes from Supabase
  const fetchPromoCodes = async () => {
    setLoading(true);
    setToast(null);

    try {
      const { data, error } = await supabase
        .from('promocodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setToast({ message: err.message || 'Failed to fetch promo codes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // Handle delete click to show confirmation modal
  const handleDeleteClick = (promoId) => {
    setConfirmingDeleteId(promoId);
    setToast(null);
  };

  // Handle confirmed deletion including related promo_usage records
  const handleConfirmDelete = async () => {
    if (!confirmingDeleteId) return;

    setIsDeleting(true);
    setToast(null);

    try {
      // Step 1: Delete related promo_usage records
      const { error: usageError } = await supabase
        .from('promo_usage')
        .delete()
        .eq('promo_code_id', confirmingDeleteId);

      if (usageError) throw usageError;

      // Step 2: Delete the promo code
      const { error: promoError } = await supabase
        .from('promocodes')
        .delete()
        .eq('id', confirmingDeleteId);

      if (promoError) throw promoError;

      // Update the local state
      setPromoCodes((prev) => prev.filter((promo) => promo.id !== confirmingDeleteId));
      setToast({ message: 'Promo code deleted successfully!', type: 'success' });
    } catch (err) {
      console.error('Error deleting promo code:', err);
      setToast({
        message: err.message || 'Failed to delete promo code. Please ensure no usage records exist or adjust the foreign key constraint.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmingDeleteId(null);
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  // Refresh the promo code list
  const handleRefresh = () => {
    fetchPromoCodes();
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
                <th style={tableHeaderStyle}>Max Uses Per User</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => (
                <tr key={promo.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tableCellStyle}>
                    {promo.created_at ? new Date(promo.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={tableCellStyle}>{promo.code}</td>
                  <td style={tableCellStyle}>{promo.discount}</td>
                  <td style={tableCellStyle}>
                    {promo.max_uses_per_user || 'N/A'}
                  </td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => handleDeleteClick(promo.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        opacity: loading || isDeleting ? 0.7 : 1,
                      }}
                      disabled={loading || isDeleting || confirmingDeleteId === promo.id}
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

// Table styles
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
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '12px 15px',
  verticalAlign: 'top',
  fontSize: '0.95em',
  color: '#333',
};

// Button style
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
  transition: 'opacity 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
};

// Modal styles
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

// Loading spinner styles
const spinnerContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const spinner = {
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '50%',
  borderTop: '2px solid #ffffff',
  width: '16px',
  height: '16px',
  animation: 'spin 1s linear infinite',
};

// Add spinner keyframes
if (typeof window !== 'undefined') {
  const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`;
  
  const styleElement = document.createElement('style');
  styleElement.innerHTML = spinnerKeyframes;
  document.head.appendChild(styleElement);
}

export default ViewPromoCodes;



// import React, { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
// import ToastMessage from '../../ToastMessage';

// const ViewPromoCodes = () => {
//   const [promoCodes, setPromoCodes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [toast, setToast] = useState(null);
//   const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Fetch promo codes and their usage counts from Supabase
//   const fetchPromoCodes = async () => {
//     setLoading(true);
//     setToast(null);

//     try {
//       // Fetch promo codes
//       const { data: promoData, error: promoError } = await supabase
//         .from('promocodes')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (promoError) throw promoError;

//       // Fetch usage counts for each promo code
//       const promoCodesWithUsage = await Promise.all(
//         (promoData || []).map(async (promo) => {
//           const { count: usageCount, error: usageError } = await supabase
//             .from('promo_usage')
//             .select('*', { count: 'exact' })
//             .eq('promo_code_id', promo.id);

//           if (usageError) throw usageError;

//           return { ...promo, current_uses: usageCount };
//         })
//       );

//       setPromoCodes(promoCodesWithUsage);
//     } catch (err) {
//       console.error('Error fetching promo codes:', err);
//       setToast({ message: err.message || 'Failed to fetch promo codes.', type: 'error' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPromoCodes();
//   }, []);

//   // Handle delete click to show confirmation modal
//   const handleDeleteClick = (promoId) => {
//     setConfirmingDeleteId(promoId);
//     setToast(null);
//   };

//   // Handle confirmed deletion including related promo_usage records
//   const handleConfirmDelete = async () => {
//     if (!confirmingDeleteId) return;

//     setIsDeleting(true);
//     setToast(null);

//     try {
//       // Step 1: Delete related promo_usage records
//       const { error: usageError } = await supabase
//         .from('promo_usage')
//         .delete()
//         .eq('promo_code_id', confirmingDeleteId);

//       if (usageError) throw usageError;

//       // Step 2: Delete the promo code
//       const { error: promoError } = await supabase
//         .from('promocodes')
//         .delete()
//         .eq('id', confirmingDeleteId);

//       if (promoError) throw promoError;

//       // Update the local state
//       setPromoCodes((prev) => prev.filter((promo) => promo.id !== confirmingDeleteId));
//       setToast({ message: 'Promo code deleted successfully!', type: 'success' });
//     } catch (err) {
//       console.error('Error deleting promo code:', err);
//       setToast({
//         message: err.message || 'Failed to delete promo code. Please ensure no usage records exist or adjust the foreign key constraint.',
//         type: 'error',
//       });
//     } finally {
//       setIsDeleting(false);
//       setConfirmingDeleteId(null);
//     }
//   };

//   // Handle cancel deletion
//   const handleCancelDelete = () => {
//     setConfirmingDeleteId(null);
//   };

//   // Refresh the promo code list
//   const handleRefresh = () => {
//     fetchPromoCodes();
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//         <h2 style={{ 
//           fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', 
//           fontWeight: 500, 
//           fontFamily: "'Oswald', sans-serif" 
//         }}>
//           Promo Codes
//         </h2>
//       </div>

//       {loading && <p>Loading promo codes...</p>}

//       {!loading && promoCodes.length > 0 && (
//         <div style={{ overflowX: 'auto' }}>
//           <table style={tableStyle}>
//             <thead>
//               <tr>
//                 <th style={tableHeaderStyle}>Created</th>
//                 <th style={tableHeaderStyle}>Code</th>
//                 <th style={tableHeaderStyle}>Discount (%)</th>
//                 <th style={tableHeaderStyle}>Usage</th>
//                 <th style={tableHeaderStyle}>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {promoCodes.map((promo) => (
//                 <tr key={promo.id} style={{ borderBottom: '1px solid #eee' }}>
//                   <td style={tableCellStyle}>
//                     {promo.created_at ? new Date(promo.created_at).toLocaleString() : 'N/A'}
//                   </td>
//                   <td style={tableCellStyle}>{promo.code}</td>
//                   <td style={tableCellStyle}>{promo.discount}</td>
//                   <td style={tableCellStyle}>
//                     {promo.current_uses} / {promo.total_uses_limit}
//                   </td>
//                   <td style={tableCellStyle}>
//                     <button
//                       onClick={() => handleDeleteClick(promo.id)}
//                       style={{
//                         padding: '6px 12px',
//                         backgroundColor: '#dc3545',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '6px',
//                         cursor: 'pointer',
//                         fontSize: '0.9em',
//                         opacity: loading || isDeleting ? 0.7 : 1,
//                       }}
//                       disabled={loading || isDeleting || confirmingDeleteId === promo.id}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {!loading && promoCodes.length === 0 && <p>No promo codes found.</p>}

//       {confirmingDeleteId && (
//         <div style={modalOverlay}>
//           <div style={modalContent}>
//             <p style={modalText}>
//               Are you sure you want to delete this promo code? This action cannot be undone.
//             </p>
//             <div style={modalButtonContainer}>
//               <button
//                 onClick={handleConfirmDelete}
//                 style={isDeleting ? { ...buttonStyle, backgroundColor: '#dc3545', opacity: 0.6, cursor: 'not-allowed' } : { ...buttonStyle, backgroundColor: '#dc3545' }}
//                 disabled={isDeleting}
//               >
//                 {isDeleting ? (
//                   <div style={spinnerContainer}>
//                     <div style={spinner}></div>
//                     <span style={{ marginLeft: '10px' }}>Deleting...</span>
//                   </div>
//                 ) : 'Confirm Delete'}
//               </button>
//               <button
//                 onClick={handleCancelDelete}
//                 style={isDeleting ? { ...buttonStyle, backgroundColor: '#6c757d', opacity: 0.6, cursor: 'not-allowed' } : { ...buttonStyle, backgroundColor: '#6c757d' }}
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {toast && (
//         <ToastMessage
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast(null)}
//         />
//       )}
//     </div>
//   );
// };

// // Table styles
// const tableStyle = {
//   width: '100%',
//   borderCollapse: 'collapse',
//   boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
//   backgroundColor: '#fff',
//   borderRadius: '6px',
//   overflow: 'hidden'
// };

// const tableHeaderStyle = {
//   backgroundColor: '#f5f5f5',
//   border: '1px solid #ddd',
//   padding: '12px 15px',
//   textAlign: 'left',
//   fontWeight: '600',
//   color: '#333',
//   fontSize: '0.9em',
// };

// const tableCellStyle = {
//   border: '1px solid #ddd',
//   padding: '12px 15px',
//   verticalAlign: 'top',
//   fontSize: '0.95em',
//   color: '#333',
// };

// // Button style
// const buttonStyle = {
//   padding: '10px 15px',
//   backgroundColor: '#000',
//   color: '#fff',
//   border: 'none',
//   borderRadius: '6px',
//   cursor: 'pointer',
//   marginRight: '6px',
//   fontSize: '0.95rem',
//   opacity: 1,
//   transition: 'opacity 0.2s ease',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   minWidth: '120px',
// };

// // Modal styles
// const modalOverlay = {
//   position: 'fixed',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: 'rgba(0, 0, 0, 0.4)',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   zIndex: 1000,
// };

// const modalContent = {
//   backgroundColor: '#fff',
//   padding: '25px 30px',
//   borderRadius: '8px',
//   boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
//   textAlign: 'center',
//   minWidth: '300px',
//   maxWidth: '450px',
//   zIndex: 1001,
// };

// const modalText = {
//   fontSize: '1.1em',
//   color: '#333',
//   marginBottom: '20px',
//   lineHeight: '1.5',
// };

// const modalButtonContainer = {
//   display: 'flex',
//   justifyContent: 'center',
//   gap: '15px',
// };

// // Loading spinner styles
// const spinnerContainer = {
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
// };

// const spinner = {
//   border: '2px solid rgba(255, 255, 255, 0.3)',
//   borderRadius: '50%',
//   borderTop: '2px solid #ffffff',
//   width: '16px',
//   height: '16px',
//   animation: 'spin 1s linear infinite',
// };

// // Add spinner keyframes
// if (typeof window !== 'undefined') {
//   const spinnerKeyframes = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }`;
  
//   const styleElement = document.createElement('style');
//   styleElement.innerHTML = spinnerKeyframes;
//   document.head.appendChild(styleElement);
// }

// export default ViewPromoCodes;