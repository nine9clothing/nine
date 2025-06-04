import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Navbar from "../components/Navbar";
import Footer from "../pages/Footer";
import ToastMessage from '../ToastMessage';

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({
    id: null,
    email: '',
    full_name: '',
    phone: '',
    birthday: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [addresses, setAddresses] = useState([]);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [showEditAddressForm, setShowEditAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    shipping: 'national',
    state: '',
    country: ''
  });
  const [filter, setFilter] = useState('all');
  const [expandedAddress, setExpandedAddress] = useState(null);

  const fetchUserData = async () => {
    try {
      setUpdateError('');
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setUpdateError('Failed to fetch session. Please login again.');
        setToast({ show: true, message: 'Failed to fetch session. Please login again.', type: 'error' });
        return;
      }

      if (!session) {
        window.location.replace('/login');
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('registered_details')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
        } else {
          setUpdateError(`Failed to fetch user details: ${error.message}`);
          setToast({ show: true, message: `Failed to fetch user details: ${error.message}`, type: 'error' });
        }
      }

      if (data) {
        setUserDetails({
          id: data.id,
          email: data.email || session.user.email,
          full_name: data.full_name || '',
          phone: data.phone || '',
          birthday: data.birthday || '',
        });
        setEditedDetails({
          email: data.email || session.user.email,
          full_name: data.full_name || '',
          phone: data.phone || '',
          birthday: data.birthday || '',
        });
      } else {
        setUserDetails({
          id: null,
          email: session.user.email,
          full_name: '',
          phone: '',
          birthday: '',
        });
        setEditedDetails({
          email: session.user.email,
          full_name: '',
          phone: '',
          birthday: '',
        });
      }

      let query = supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', session.user.id);

      if (filter !== 'all') {
        if (filter === 'national') {
          query = query.or(`shipping.ilike.${filter},shipping.is.null`);
        } else if (filter === 'international') {
          query = query.ilike('shipping', filter);
        }
      }

      const { data: addressData, error: addressError } = await query;

      if (addressError) {
        setToast({ show: true, message: `Failed to fetch addresses: ${addressError.message}`, type: 'error' });
      } else {
        setAddresses(addressData || []);
      }
    } catch (error) {
      setUpdateError(`Unexpected error: ${error.message}`);
      setToast({ show: true, message: `Unexpected error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [filter]);

  const handleEdit = () => {
    setEditing(true);
    setUpdateSuccess(false);
    setUpdateError('');
    setResetPasswordMessage('');
    setToast({ show: false, message: '', type: '' });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedDetails({ ...userDetails });
    setUpdateSuccess(false);
    setUpdateError('');
    setResetPasswordMessage('');
    setToast({ show: false, message: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError('');
    setResetPasswordMessage('');
    setToast({ show: false, message: '', type: '' });

    if (!user) {
      setUpdateError('User session not found. Please login again.');
      setToast({ show: true, message: 'User session not found. Please login again.', type: 'error' });
      return;
    }

    try {
      const changedFields = {};
      if (editedDetails.full_name !== userDetails.full_name) {
        changedFields.full_name = editedDetails.full_name || null;
      }

      const upsertData = {
        email: user.email,
        updated_at: new Date().toISOString(),
        ...changedFields,
      };

      if (userDetails.id) {
        upsertData.id = userDetails.id;
      }

      if (Object.keys(changedFields).length === 0) {
        setEditing(false);
        setUpdateSuccess(true);
        setToast({ show: true, message: 'Your profile was updated successfully!', type: 'success' });
        return;
      }

      const { error } = await supabase
        .from('registered_details')
        .upsert(upsertData, {
          onConflict: 'id',
          returning: 'minimal',
        });

      if (error) {
        setUpdateError(`Failed to update profile: ${error.message}`);
        setToast({ show: true, message: `Failed to update profile: ${error.message}`, type: 'error' });
        return;
      }
      await fetchUserData();

      setEditing(false);
      setUpdateSuccess(true);
      setToast({ show: true, message: 'Your profile was updated successfully!', type: 'success' });
    } catch (error) {
      setUpdateError(`An unexpected error occurred: ${error.message}`);
      setToast({ show: true, message: `An unexpected error occurred: ${error.message}`, type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    try {
      setResetPasswordMessage('');
      setUpdateError('');
      setToast({ show: false, message: '', type: '' });

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/resetpassword',
      });

      if (error) {
        setUpdateError(`Failed to send password reset email: ${error.message}`);
        setToast({ show: true, message: `Failed to send password reset email: ${error.message}`, type: 'error' });
        return;
      }

      setResetPasswordMessage('Password reset email sent! Please check your inbox.');
      setToast({ show: true, message: 'Password reset email sent! Please check your inbox.', type: 'success' });
    } catch (error) {
      setUpdateError(`An unexpected error occurred: ${error.message}`);
      setToast({ show: true, message: `An unexpected error occurred: ${error.message}`, type: 'error' });
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      setToast({ show: true, message: 'Please log in to add an address.', type: 'error' });
      return;
    }

    const { name, address, city, pincode, phone, shipping, state, country } = newAddress;
    if (!name || !address || !city || !pincode || !phone || !shipping) {
      setToast({ show: true, message: 'Please fill in all required address fields.', type: 'error' });
      return;
    }

    if (address.length < 4) {
      setToast({ show: true, message: 'Address must be at least 4 characters long.', type: 'error' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setToast({ show: true, message: 'Please enter a valid 10-digit phone number starting with 6-9.', type: 'error' });
      return;
    }

    if (shipping === 'international' && (!state || !country)) {
      setToast({ show: true, message: 'State and country are required for international addresses.', type: 'error' });
      return;
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert([{ user_id: user.id, name, address, city, pincode, phone, shipping, state, country }])
      .select();

    if (error) {
      setToast({ show: true, message: `Failed to add address: ${error.message}`, type: 'error' });
      return;
    }

    await fetchUserData();
    setShowAddAddressForm(false);
    setNewAddress({ name: '', address: '', city: '', pincode: '', phone: '', shipping: 'national', state: '', country: '' });
    setToast({ show: true, message: 'Address added successfully!', type: 'success' });
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();
    if (!user || !editingAddress) {
      setToast({ show: true, message: 'Please log in to edit an address.', type: 'error' });
      return;
    }

    const { name, address, city, pincode, phone, state, country } = editingAddress;
    if (!name || !address || !city || !pincode || !phone) {
      setToast({ show: true, message: 'Please fill in all required address fields.', type: 'error' });
      return;
    }

    if (address.length < 4) {
      setToast({ show: true, message: 'Address must be at least 4 characters long.', type: 'error' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setToast({ show: true, message: 'Please enter a valid 10-digit phone number starting with 6-9.', type: 'error' });
      return;
    }

    if (editingAddress.shipping === 'international' && (!state || !country)) {
      setToast({ show: true, message: 'State and country are required for international addresses.', type: 'error' });
      return;
    }

    const { error } = await supabase
      .from('user_addresses')
      .update({ name, address, city, pincode, phone, state, country })
      .eq('id', editingAddress.id)
      .eq('user_id', user.id);

    if (error) {
      setToast({ show: true, message: `Failed to update address: ${error.message}`, type: 'error' });
      return;
    }

    await fetchUserData();
    setShowEditAddressForm(false);
    setEditingAddress(null);
    setToast({ show: true, message: 'Address updated successfully!', type: 'success' });
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user) {
      setToast({ show: true, message: 'Please log in to delete an address.', type: 'error' });
      return;
    }

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      setToast({ show: true, message: `Failed to delete address: ${error.message}`, type: 'error' });
      return;
    }

    await fetchUserData();
    setToast({ show: true, message: 'Address deleted successfully!', type: 'success' });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
      }}>
        <div style={{
          backgroundColor: 'black',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{
            fontSize: 'calc(1rem + 0.5vw)',
            fontWeight: '600',
            color: 'white',
            fontFamily: "'Abril Extra Bold', sans-serif",
          }}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Roboto', sans-serif",
    }}>
      <Navbar showLogo={true} />
      <div style={{
        flex: '1',
        padding: '1rem',
        marginTop: '5rem',
        marginBottom: '2rem',
      }}>
        <h1 style={{
          fontSize: 'calc(1.5rem + 0.75vw)',
          fontWeight: '700',
          color: '#Ffa500',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontFamily: "'Abril Extra Bold', sans-serif",
        }}>Profile</h1>
        <div style={{
          maxWidth: 'min(90vw, 64rem)',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          marginTop: '1rem',
          marginBottom: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '1rem',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: '2rem',
        }}>
          <div style={{
            flex: '1',
            maxWidth: window.innerWidth < 768 ? '100%' : '50%',
            marginTop: '1rem',
          }}>
            {toast.show && (
              <ToastMessage
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false, message: '', type: '' })}
              />
            )}

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #dee2e6',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                gap: '0.5rem',
              }}>
                <h2 style={{
                  fontSize: 'calc(1.2rem + 0.3vw)',
                  fontWeight: '600',
                  color: '#000000',
                  margin: 0,
                  fontFamily: "'Abril Extra Bold', sans-serif",
                }}>Account Details</h2>
                {!editing && (
                  <button
                    onClick={handleEdit}
                    style={{
                      backgroundColor: 'white',
                      color: 'black',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid grey',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      fontFamily: "'Abril Extra Bold', sans-serif",
                      width: window.innerWidth < 640 ? '100%' : 'auto',
                      minHeight: '2.5rem',
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = 'rgba(2, 2, 2, 0.15)'}
                    onMouseOut={e => e.target.style.backgroundColor = 'white'}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#6c757d',
                      marginBottom: '0.5rem',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editedDetails.full_name || ''}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da', 
                        fontSize: '0.9rem',
                        color: '#000000',
                        backgroundColor: '#ffffff',
                        transition: 'border-color 0.2s',
                        fontFamily: "'Louvette Semi Bold', sans-serif",
                        minHeight: '2.5rem',
                      }}
                      onFocus={e => e.target.style.borderColor = '#80bdff'}
                      onBlur={e => e.target.style.borderColor = '#ced4da'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#6c757d',
                      marginBottom: '0.5rem',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editedDetails.email || ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#e9ecef',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        fontFamily: "'Louvette Semi Bold', sans-serif",
                        minHeight: '2.5rem',
                      }}
                    />
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      marginTop: '0.25rem',
                      display: 'block',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Email cannot be changed</span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#6c757d',
                      marginBottom: '0.5rem',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editedDetails.phone || ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#e9ecef',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        fontFamily: "'Louvette Semi Bold', sans-serif",
                        minHeight: '2.5rem',
                      }}
                    />
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      marginTop: '0.25rem',
                      display: 'block',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Phone cannot be changed</span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#6c757d',
                      marginBottom: '0.5rem',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Birthday</label>
                    <input
                      type="date"
                      name="birthday"
                      value={editedDetails.birthday || ''}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#e9ecef',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        fontFamily: "'Louvette Semi Bold', sans-serif",
                        minHeight: '2.5rem',
                      }}
                    />
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      marginTop: '0.25rem',
                      display: 'block',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}>Birthday cannot be changed</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginTop: '1.5rem',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                  }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #000000',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        fontFamily: "'Abril Extra Bold', sans-serif",
                        width: window.innerWidth < 640 ? '100%' : 'auto',
                        minHeight: '2.5rem',
                      }}
                      onMouseOver={e => {
                        e.target.style.backgroundColor = '#000000';
                        e.target.style.color = '#ffffff';
                      }}
                      onMouseOut={e => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.color = '#000000';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        fontFamily: "'Abril Extra Bold', sans-serif",
                        width: window.innerWidth < 640 ? '100%' : 'auto',
                        minHeight: '2.5rem',
                      }}
                      onMouseOver={e => e.target.style.backgroundColor = '#333333'}
                      onMouseOut={e => e.target.style.backgroundColor = '#000000'}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: window.innerWidth < 640 ? 'flex' : 'grid',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'unset',
                    gridTemplateColumns: window.innerWidth < 640 ? 'none' : '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #dee2e6',
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: '#6c757d',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.85rem',
                    }}>Name:</span>
                    <span style={{
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.9rem',
                    }}>{userDetails.full_name || 'Not provided'}</span>
                  </div>
                  
                  <div style={{
                    display: window.innerWidth < 640 ? 'flex' : 'grid',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'unset',
                    gridTemplateColumns: window.innerWidth < 640 ? 'none' : '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #dee2e6',
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: '#6c757d',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.85rem',
                    }}>Email:</span>
                    <span style={{
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.9rem',
                    }}>{userDetails.email}</span>
                  </div>
                  
                  <div style={{
                    display: window.innerWidth < 640 ? 'flex' : 'grid',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'unset',
                    gridTemplateColumns: window.innerWidth < 640 ? 'none' : '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #dee2e6',
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: '#6c757d',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.85rem',
                    }}>Phone:</span>
                    <span style={{
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.9rem',
                    }}>{userDetails.phone || 'Not provided'}</span>
                  </div>
                  
                  <div style={{
                    display: window.innerWidth < 640 ? 'flex' : 'grid',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'unset',
                    gridTemplateColumns: window.innerWidth < 640 ? 'none' : '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #dee2e6',
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: '#6c757d',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.85rem',
                    }}>Birthday:</span>
                    <span style={{
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.9rem',
                    }}>
                      {userDetails.birthday ? new Date(userDetails.birthday).toLocaleDateString() : 'Not provided'}
                    </span>
                  </div>

                  <div style={{
                    display: window.innerWidth < 640 ? 'flex' : 'grid',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'unset',
                    gridTemplateColumns: window.innerWidth < 640 ? 'none' : '120px 1fr',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                  }}>
                    <span style={{
                      fontWeight: '500',
                      color: '#6c757d',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                      fontSize: '0.85rem',
                    }}>Password:</span>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'black',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid grey',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: window.innerWidth < 640 ? '100%' : 'fit-content',
                        transition: 'background-color 0.2s',
                        fontFamily: "'Abril Extra Bold', sans-serif",
                        minHeight: '2.5rem',
                      }}
                      onMouseOver={e => e.target.style.backgroundColor = 'rgba(2, 2, 2, 0.15)'}
                      onMouseOut={e => e.target.style.backgroundColor = 'white'}
                    >
                      Send Password Reset Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{
            flex: '1',
            maxWidth: window.innerWidth < 768 ? '100%' : '50%',
            marginTop: '1rem', 
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #dee2e6',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                gap: '0.5rem',
              }}>
                <h2 style={{
                  fontSize: 'calc(1.2rem + 0.3vw)',
                  fontWeight: '600',
                  color: '#000000',
                  margin: 0,
                  fontFamily: "'Abril Extra Bold', sans-serif",
                }}>Addresses</h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid grey',
                    fontSize: '0.85rem',
                    fontFamily: "'Louvette Semi Bold', sans-serif",
                    width: window.innerWidth < 640 ? '100%' : 'auto',
                  }}
                >
                  <option value="all">All Addresses</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>

              {addresses.length > 0 ? (
                <div>
                  {addresses.map(addr => (
                    <div key={addr.id} style={{
                      padding: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      borderLeft: '4px solid #000000',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <p style={{
                          margin: '0.25rem 0',
                          fontSize: '0.9rem',
                          fontFamily: "'Louvette Semi Bold', sans-serif",
                          color: '#000000',
                        }}><strong>{addr.name}</strong></p>
                        <button
                          onClick={() => setExpandedAddress(expandedAddress === addr.id ? null : addr.id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#000000',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: "'Abril Extra Bold', sans-serif",
                          }}
                        >
                          {expandedAddress === addr.id ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                      {expandedAddress === addr.id && (
                        <div>
                          <p style={{
                            margin: '0.25rem 0',
                            fontSize: '0.9rem',
                            fontFamily: "'Louvette Semi Bold', sans-serif",
                            color: '#000000',
                          }}>{addr.address}</p>
                          <p style={{
                            margin: '0.25rem 0',
                            fontSize: '0.9rem',
                            fontFamily: "'Louvette Semi Bold', sans-serif",
                            color: '#000000',
                          }}>{addr.city} - {addr.pincode}</p>
                          {addr.shipping && addr.shipping.toLowerCase() === 'international' && (
                            <>
                              <p style={{
                                margin: '0.25rem 0',
                                fontSize: '0.9rem',
                                fontFamily: "'Louvette Semi Bold', sans-serif",
                                color: '#000000',
                              }}>State: {addr.state || 'Not provided'}</p>
                              <p style={{
                                margin: '0.25rem 0',
                                fontSize: '0.9rem',
                                fontFamily: "'Louvette Semi Bold', sans-serif",
                                color: '#000000',
                              }}>Country: {addr.country || 'Not provided'}</p>
                            </>
                          )}
                          <p style={{
                            margin: '0.25rem 0',
                            fontSize: '0.9rem',
                            fontFamily: "'Louvette Semi Bold', sans-serif",
                            color: '#000000',
                          }}>Phone: {addr.phone}</p>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                      }}>
                        <button
                          onClick={() => {
                            setEditingAddress(addr);
                            setShowEditAddressForm(true);
                            setShowAddAddressForm(false);
                          }}
                          style={{
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                            fontFamily: "'Abril Extra Bold', sans-serif",
                          }}
                          onMouseOver={e => e.target.style.backgroundColor = '#333333'}
                          onMouseOut={e => e.target.style.backgroundColor = '#000000'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                            fontFamily: "'Abril Extra Bold', sans-serif",
                          }}
                          onMouseOver={e => e.target.style.backgroundColor = '#c82333'}
                          onMouseOut={e => e.target.style.backgroundColor = '#dc3545'}
                        >
                          Delete
                        </button>
                      </div>
                      {showEditAddressForm && editingAddress && editingAddress.id === addr.id && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                        }}>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={editingAddress.name}
                            onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              fontSize: '0.9rem',
                              color: '#000000',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Address"
                            value={editingAddress.address}
                            onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              fontSize: '0.9rem',
                              color: '#000000',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={editingAddress.city}
                            onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              fontSize: '0.9rem',
                              color: '#000000',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Pincode"
                            value={editingAddress.pincode}
                            onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              fontSize: '0.9rem',
                              color: '#000000',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={editingAddress.phone}
                            onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ced4da',
                              fontSize: '0.9rem',
                              color: '#000000',
                              fontFamily: "'Louvette Semi Bold', sans-serif",
                            }}
                          />
                          {editingAddress.shipping && editingAddress.shipping.toLowerCase() === 'international' && (
                            <>
                              <input
                                type="text"
                                placeholder="State"
                                value={editingAddress.state || ''}
                                onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  marginBottom: '0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #ced4da',
                                  fontSize: '0.9rem',
                                  color: '#000000',
                                  fontFamily: "'Louvette Semi Bold', sans-serif",
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Country"
                                value={editingAddress.country || ''}
                                onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  marginBottom: '0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #ced4da',
                                  fontSize: '0.9rem',
                                  color: '#000000',
                                  fontFamily: "'Louvette Semi Bold', sans-serif",
                                }}
                              />
                            </>
                          )}
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'flex-end',
                            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                          }}>
                            <button
                              onClick={handleEditAddress}
                              style={{
                                width: window.innerWidth < 640 ? '100%' : 'auto',
                                padding: '0.5rem',
                                backgroundColor: '#28a745',
                                color: '#ffffff',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'background-color 0.2s',
                                fontFamily: "'Abril Extra Bold', sans-serif",
                              }}
                              onMouseOver={e => e.target.style.backgroundColor = '#218838'}
                              onMouseOut={e => e.target.style.backgroundColor = '#28a745'}
                            >
                              Update Address
                            </button>
                            <button
                              onClick={() => {
                                setShowEditAddressForm(false);
                                setEditingAddress(null);
                              }}
                              style={{
                                width: window.innerWidth < 640 ? '100%' : 'auto',
                                padding: '0.5rem',
                                backgroundColor: '#6c757d',
                                color: '#ffffff',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'background-color 0.2s',
                                fontFamily: "'Abril Extra Bold', sans-serif",
                              }}
                              onMouseOver={e => e.target.style.backgroundColor = '#5a6268'}
                              onMouseOut={e => e.target.style.backgroundColor = '#6c757d'}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  textAlign: 'center',
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                  color: '#6c757d',
                  fontSize: '0.9rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                }}>No saved addresses found.</p>
              )}

              {showAddAddressForm && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                }}>
                  <select
                    value={newAddress.shipping}
                    onChange={(e) => setNewAddress({ ...newAddress, shipping: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  >
                    <option value="national">National</option>
                    <option value="international">International</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontFamily: "'Louvette Semi Bold', sans-serif",
                    }}
                  />
                  {newAddress.shipping && newAddress.shipping.toLowerCase() === 'international' && (
                    <>
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          fontSize: '0.9rem',
                          color: '#000000',
                          fontFamily: "'Louvette Semi Bold', sans-serif",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          fontSize: '0.9rem',
                          color: '#000000',
                          fontFamily: "'Louvette Semi Bold', sans-serif",
                        }}
                      />
                    </>
                  )}
                  <button
                    onClick={handleAddAddress}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#28a745',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      fontFamily: "'Abril Extra Bold', sans-serif",
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = '#218838'}
                    onMouseOut={e => e.target.style.backgroundColor = '#28a745'}
                  >
                    Save Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAccount;