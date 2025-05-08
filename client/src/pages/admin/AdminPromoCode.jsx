import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const CreatePromoCode = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    maxUsesPerUser: 1,
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission to create a new promo code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Validation
    if (!formData.code || !formData.discount || formData.discount <= 0 || formData.discount > 100) {
      setToast({ message: 'Please enter a valid promo code and discount (1-100%).', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('promocodes').insert([
        {
          code: formData.code.toUpperCase(),
          discount: parseFloat(formData.discount),
          max_uses_per_user: parseInt(formData.maxUsesPerUser),
          limit: 10,
          display: "true",
          used: 0,
        },
      ]);

      if (error) throw error;

      setToast({ message: 'Promo code created successfully!', type: 'success' });
      setFormData({ code: '', discount: '', maxUsesPerUser: 1 });
    } catch (err) {
      console.error('Error creating promo code:', err);
      setToast({ message: err.message || 'Failed to create promo code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        marginBottom: '20px', 
        fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', 
        fontWeight: 500, 
        fontFamily: "'Oswald', sans-serif" 
      }}>
        Create Promo Code
      </h2>

      {/* Create Promo Code Form */}
      <div style={formBox}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 500, 
          color: '#333', 
          marginBottom: '15px' 
        }}>
          Create New Promo Code
        </h3>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Promo Code <span style={asterisk}>*</span>
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Enter promo code"
            required
          />

          <label style={labelStyle}>
            Discount (%) <span style={asterisk}>*</span>
          </label>
          <input
            type="number"
            name="discount"
            value={formData.discount}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Enter discount percentage"
            min="1"
            max="100"
            required
          />

          <label style={labelStyle}>
            Max Uses Per User
          </label>
          <select
            name="maxUsesPerUser"
            value={formData.maxUsesPerUser}
            onChange={handleInputChange}
            style={inputStyle}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="999">Unlimited</option>
          </select>

          <button
            type="submit"
            style={loading ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
            disabled={loading}
          >
            {loading ? (
              <div style={spinnerContainer}>
                <div style={spinner}></div>
                <span style={{ marginLeft: '10px' }}>Creating...</span>
              </div>
            ) : 'Create Promo Code'}
          </button>
        </form>
      </div>

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

// Styles
const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box',
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
  transition: 'opacity 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
};

const formBox = {
  background: '#f5f5f5',
  padding: '25px',
  marginBottom: '30px',
  borderRadius: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
};

const labelStyle = {
  fontWeight: '500',
  marginBottom: '5px',
  display: 'block'
};

const asterisk = {
  color: 'red',
  marginLeft: '2px'
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

export default CreatePromoCode;


// import React, { useState } from 'react';
// import { supabase } from '../../lib/supabase';
// import ToastMessage from '../../ToastMessage';

// const CreatePromoCode = () => {
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [formData, setFormData] = useState({
//     code: '',
//     discount: '',
//     totalUsesLimit: '1', // Default to 1 to ensure a value
//   });

//   // Handle form input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   // Handle form submission to create a new promo code
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setToast(null);

//     // Validation
//     if (!formData.code || !formData.discount || formData.discount <= 0 || formData.discount > 100) {
//       setToast({ message: 'Please enter a valid promo code and discount (1-100%).', type: 'error' });
//       setLoading(false);
//       return;
//     }
//     if (!formData.totalUsesLimit || formData.totalUsesLimit <= 0 || isNaN(formData.totalUsesLimit)) {
//       setToast({ message: 'Total uses limit must be a positive number.', type: 'error' });
//       setLoading(false);
//       return;
//     }

//     try {
//       const { error } = await supabase.from('promocodes').insert([
//         {
//           code: formData.code.toUpperCase(),
//           discount: parseFloat(formData.discount),
//           total_uses_limit: parseInt(formData.totalUsesLimit),
//         },
//       ]);

//       if (error) throw error;

//       setToast({ message: 'Promo code created successfully!', type: 'success' });
//       setFormData({ code: '', discount: '', totalUsesLimit: '1' });
//     } catch (err) {
//       console.error('Error creating promo code:', err);
//       setToast({ message: err.message || 'Failed to create promo code.', type: 'error' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2 style={{ 
//         marginBottom: '20px', 
//         fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', 
//         fontWeight: 500, 
//         fontFamily: "'Oswald', sans-serif" 
//       }}>
//         Create Promo Code
//       </h2>

//       {/* Create Promo Code Form */}
//       <div style={formBox}>
//         <h3 style={{ 
//           fontSize: '1.5rem', 
//           fontWeight: 500, 
//           color: '#333', 
//           marginBottom: '15px' 
//         }}>
//           Create New Promo Code
//         </h3>
//         <form onSubmit={handleSubmit}>
//           <label style={labelStyle}>
//             Promo Code <span style={asterisk}>*</span>
//           </label>
//           <input
//             type="text"
//             name="code"
//             value={formData.code}
//             onChange={handleInputChange}
//             style={inputStyle}
//             placeholder="Enter promo code"
//             required
//           />

//           <label style={labelStyle}>
//             Discount (%) <span style={asterisk}>*</span>
//           </label>
//           <input
//             type="number"
//             name="discount"
//             value={formData.discount}
//             onChange={handleInputChange}
//             style={inputStyle}
//             placeholder="Enter discount percentage"
//             min="1"
//             max="100"
//             required
//           />

//           <label style={labelStyle}>
//             Total Uses Limit <span style={asterisk}>*</span>
//           </label>
//           <input
//             type="number"
//             name="totalUsesLimit"
//             value={formData.totalUsesLimit}
//             onChange={handleInputChange}
//             style={inputStyle}
//             placeholder="Enter total uses limit"
//             min="1"
//             required
//           />

//           <button
//             type="submit"
//             style={loading ? { ...buttonStyle, opacity: '0.6', cursor: 'not-allowed' } : buttonStyle}
//             disabled={loading}
//           >
//             {loading ? (
//               <div style={spinnerContainer}>
//                 <div style={spinner}></div>
//                 <span style={{ marginLeft: '10px' }}>Creating...</span>
//               </div>
//             ) : 'Create Promo Code'}
//           </button>
//         </form>
//       </div>

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

// // Styles
// const inputStyle = {
//   width: '100%',
//   padding: '10px',
//   marginBottom: '10px',
//   borderRadius: '6px',
//   border: '1px solid #ccc',
//   fontSize: '1rem',
//   boxSizing: 'border-box',
// };

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

// const formBox = {
//   background: '#f5f5f5',
//   padding: '25px',
//   marginBottom: '30px',
//   borderRadius: '10px',
//   boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
// };

// const labelStyle = {
//   fontWeight: '500',
//   marginBottom: '5px',
//   display: 'block'
// };

// const asterisk = {
//   color: 'red',
//   marginLeft: '2px'
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

// export default CreatePromoCode;