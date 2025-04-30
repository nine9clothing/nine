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

  const fetchUserData = async () => {
    try {
      setUpdateError('');
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        setUpdateError('Failed to fetch session. Please login again.');
        setToast({ show: true, message: 'Failed to fetch session. Please login again.', type: 'error' });
        return;
      }

      if (!session) {
        console.log('No active session found. Redirecting to login...');
        window.location.replace('/login');
        return;
      }

      setUser(session.user);
      console.log('Session user:', session.user);

      console.log('Fetching details for email:', session.user.email);
      const { data, error } = await supabase
        .from('registered_details')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No existing record found for this user.');
        } else {
          console.error('Error fetching user details:', error);
          setUpdateError(`Failed to fetch user details: ${error.message}`);
          setToast({ show: true, message: `Failed to fetch user details: ${error.message}`, type: 'error' });
        }
      }

      if (data) {
        console.log('User details fetched successfully:', data);
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
        console.log('Setting default values for new user');
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
    } catch (error) {
      console.error('Unexpected error in fetchUserData:', error);
      setUpdateError(`Unexpected error: ${error.message}`);
      setToast({ show: true, message: `Unexpected error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
        console.log('No changes detected. Skipping database update.');
        setEditing(false);
        setUpdateSuccess(true);
        setToast({ show: true, message: 'Your profile was updated successfully!', type: 'success' });
        return;
      }

      console.log('Upserting data:', upsertData);

      const { error } = await supabase
        .from('registered_details')
        .upsert(upsertData, {
          onConflict: 'id',
          returning: 'minimal',
        });

      if (error) {
        console.error('Database operation error:', error);
        setUpdateError(`Failed to update profile: ${error.message}`);
        setToast({ show: true, message: `Failed to update profile: ${error.message}`, type: 'error' });
        return;
      }

      console.log('Database operation successful');
      await fetchUserData();

      setEditing(false);
      setUpdateSuccess(true);
      setToast({ show: true, message: 'Your profile was updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Unexpected error during update:', error);
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
        console.error('Error initiating password reset:', error);
        setUpdateError(`Failed to send password reset email: ${error.message}`);
        setToast({ show: true, message: `Failed to send password reset email: ${error.message}`, type: 'error' });
        return;
      }

      setResetPasswordMessage('Password reset email sent! Please check your inbox.');
      setToast({ show: true, message: 'Password reset email sent! Please check your inbox.', type: 'success' });
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      setUpdateError(`An unexpected error occurred: ${error.message}`);
      setToast({ show: true, message: `An unexpected error occurred: ${error.message}`, type: 'error' });
    }
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
        marginTop: '6rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          maxWidth: 'min(90vw, 32rem)',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          marginTop:"50px",
          marginBottom:"20px",
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '1rem',
        }}>
          <h1 style={{
            fontSize: 'calc(1.5rem + 0.75vw)',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontFamily: "'Abril Extra Bold', sans-serif",
          }}>Profile</h1>

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
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      width: window.innerWidth < 640 ? '100%' : 'fit-content',
                      transition: 'background-color 0.2s',
                      fontFamily: "'Abril Extra Bold', sans-serif",
                      minHeight: '2.5rem',
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = '#333333'}
                    onMouseOut={e => e.target.style.backgroundColor = '#000000'}
                  >
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAccount;