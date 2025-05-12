import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const CreatePromoCode = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    maxUsesPerUser: null, 
    display: 'false',    
    limit: '',           
  });
  const [enableMaxUses, setEnableMaxUses] = useState(false); 

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    setEnableMaxUses(e.target.checked);
    if (!e.target.checked) {
      setFormData({ ...formData, maxUsesPerUser: null });
    } else {
      setFormData({ ...formData, maxUsesPerUser: '1' });
    }
  };

  // Handle form submission to create a new promo code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Validation
    if (!formData.code.trim()) {
      setToast({ message: 'Promo code is required.', type: 'error' });
      setLoading(false);
      return;
    }
    if (!formData.discount || parseFloat(formData.discount) <= 0 || parseFloat(formData.discount) > 100) {
      setToast({ message: 'Discount must be a number between 1 and 100.', type: 'error' });
      setLoading(false);
      return;
    }
    if (enableMaxUses && (!formData.maxUsesPerUser || parseInt(formData.maxUsesPerUser, 10) < 1)) {
        setToast({ message: 'Max uses per user must be at least 1.', type: 'error' });
        setLoading(false);
        return;
    }
    if (!formData.limit || parseInt(formData.limit, 10) < 1) {
        setToast({ message: 'Limit must be at least 1.', type: 'error' });
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.from('promocodes').insert([
        {
          code: formData.code.toUpperCase().trim(),
          discount: parseFloat(formData.discount),
          max_uses_per_user: enableMaxUses ? parseInt(formData.maxUsesPerUser, 10) : null,
          limit: parseInt(formData.limit, 10),
          display: formData.display === 'true', 
          used: 0,
        },
      ]);

      if (error) throw error;

      setToast({ message: 'Promo code created successfully!', type: 'success' });
      setFormData({ code: '', discount: '', maxUsesPerUser: null, display: 'true', limit: '' });
      setEnableMaxUses(false); // Reset checkbox
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

      <div style={formBox}>
        
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
            step="0.01" 
            required
          />

          <label style={labelStyle}>
            Limit (Total Uses) <span style={asterisk}>*</span>
          </label>
          <input
            type="number"
            name="limit"
            value={formData.limit}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Enter total usage limit (e.g., 100)"
            min="1"
            required
          />

          <label style={labelStyle}>
            Display <span style={asterisk}>*</span>
          </label>
          <select
            name="display"
            value={formData.display}
            onChange={handleInputChange}
            style={inputStyle}
            required
          >
            <option value="true">Display on Homepage</option>
            <option value="false">Do not display on Homepage</option>
          </select>

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={enableMaxUses}
              onChange={handleCheckboxChange}
              style={{ marginRight: '8px' }}
            />
            Enable Max Uses Per User
          </label>
          {enableMaxUses && (
            <>
              <label style={labelStyle}>
                Max Uses Per User <span style={asterisk}>*</span>
              </label>
              <input
                type="number"
                name="maxUsesPerUser"
                value={formData.maxUsesPerUser || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Enter max uses per user (e.g., 1)"
                min="1"
                required
              />
            </>
          )}

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

if (typeof window !== 'undefined') {
  const existingStyleElement = document.getElementById('spinner-keyframes-style');
  if (!existingStyleElement) { // Add only if not already present
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

export default CreatePromoCode;