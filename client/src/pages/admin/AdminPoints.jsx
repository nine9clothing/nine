import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const AdminPoints = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pointsData, setPointsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [addingUser, setAddingUser] = useState(null);
  const [newPoints, setNewPoints] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsersAndPoints = async () => {
    setLoading(true);
    setToast(null);

    try {
      // Fetch user details from registered_details
      const { data: userData, error: userError } = await supabase
        .from('registered_details')
        .select('id, email, full_name, phone');

      if (userError) throw userError;

      // Fetch all points data from point_redemptions, excluding expired points
      const { data: pointsDataRaw, error: pointsError } = await supabase
        .from('point_redemptions')
        .select('id, user_id, points_received, amount_received, points_redeemed, amount_redeemed, created_at, description, expiry_date')
        .or(`created_at.lt.${new Date().toISOString()}`)
        .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`);

      if (pointsError) throw pointsError;

      setPointsData(pointsDataRaw || []);

      // Combine user data with points, summing only non-expired entries for each user
      const formattedData = userData.map(user => {
        const userPoints = pointsDataRaw.filter(point => point.user_id === user.id);
        const totalPointsReceived = userPoints.reduce((sum, point) => sum + (point.points_received || 0), 0);
        const totalPointsRedeemed = userPoints.reduce((sum, point) => sum + (point.points_redeemed || 0), 0);
        const totalAmountReceived = userPoints.reduce((sum, point) => sum + (point.amount_received || 0), 0);
        const totalAmountRedeemed = userPoints.reduce((sum, point) => sum + (point.amount_redeemed || 0), 0);
        const totalPoints = totalPointsReceived - totalPointsRedeemed;

        return {
          id: user.id,
          email: user.email || 'N/A',
          full_name: user.full_name || 'N/A',
          phone: user.phone || 'N/A',
          points_received: totalPointsReceived,
          points_redeemed: totalPointsRedeemed,
          total_points: totalPoints >= 0 ? totalPoints : 0,
          amount_received: totalAmountReceived,
          amount_redeemed: totalAmountRedeemed,
        };
      });

      setUsers(formattedData);
      setFilteredUsers(formattedData);
    } catch (err) {
      setToast({ message: err.message || 'Error fetching data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndPoints();

    const subscription = supabase
      .channel('point_redemptions_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'point_redemptions' },
        (payload) => {
          const newRecord = payload.new;

          const currentDate = new Date();
          const expiryDate = newRecord.expiry_date ? new Date(newRecord.expiry_date) : null;
          if (expiryDate && expiryDate <= currentDate) {
            return; 
          }

          setPointsData(prevPoints => [...prevPoints, newRecord]);

          const updateUserPoints = (userList) =>
            userList.map(user => {
              if (user.id === newRecord.user_id) {
                const newPointsReceived = (user.points_received || 0) + (newRecord.points_received || 0);
                const newPointsRedeemed = (user.points_redeemed || 0) + (newRecord.points_redeemed || 0);
                const newAmountReceived = (user.amount_received || 0) + (newRecord.amount_received || 0);
                const newAmountRedeemed = (user.amount_redeemed || 0) + (newRecord.amount_redeemed || 0);
                const newTotalPoints = newPointsReceived - newPointsRedeemed;

                return {
                  ...user,
                  points_received: newPointsReceived,
                  points_redeemed: newPointsRedeemed,
                  total_points: newTotalPoints >= 0 ? newTotalPoints : 0,
                  amount_received: newAmountReceived,
                  amount_redeemed: newAmountRedeemed,
                };
              }
              return user;
            });

          setUsers(prevUsers => updateUserPoints(prevUsers));
          setFilteredUsers(prevFiltered => updateUserPoints(prevFiltered));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => {
      const fullName = user.full_name || '';
      const email = user.email || '';
      const phone = user.phone || '';
      const query = searchQuery.toLowerCase();
      return (
        fullName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleAddClick = (user) => {
    setAddingUser(user);
    setNewPoints('');
    setToast(null);
  };

  const handleAddPoints = async () => {
    if (!addingUser || isNaN(newPoints) || newPoints === '') {
      setToast({
        message: 'Please enter a valid number of points.',
        type: 'error'
      });
      return;
    }

    const pointsToAdd = parseInt(newPoints, 10);
    if (pointsToAdd < 0) {
      setToast({ message: 'Points to add cannot be negative.', type: 'error' });
      return;
    }

    setIsUpdating(true);
    setToast(null);

    try {
      const amountToAdd = pointsToAdd / 5;

      const { data: newPointsData, error: insertError } = await supabase
        .from('point_redemptions')
        .insert({
          user_id: addingUser.id,
          points_received: pointsToAdd,
          amount_received: amountToAdd,
          created_at: new Date().toISOString(),
          points_redeemed: 0,
          amount_redeemed: 0,
          description: 'Customer Service Credit',
          expiry_date: new Date(new Date().setDate(new Date().getDate() + 365)).toISOString(),
        })
        .select();

      if (insertError) throw insertError;

      setPointsData(prevPoints => [...prevPoints, newPointsData[0]]);

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === addingUser.id
            ? {
                ...user,
                points_received: user.points_received + pointsToAdd,
                amount_received: user.amount_received + amountToAdd,
                total_points: (user.points_received + pointsToAdd) - user.points_redeemed,
              }
            : user
        )
      );
      setFilteredUsers(prevFiltered =>
        prevFiltered.map(user =>
          user.id === addingUser.id
            ? {
                ...user,
                points_received: user.points_received + pointsToAdd,
                amount_received: user.amount_received + amountToAdd,
                total_points: (user.points_received + pointsToAdd) - user.points_redeemed,
              }
            : user
        )
      );
      setToast({ message: 'Points added successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Error adding points.', type: 'error' });
    } finally {
      setIsUpdating(false);
      setAddingUser(null);
      setNewPoints('');
    }
  };

  const handleCancelAdd = () => {
    setAddingUser(null);
    setNewPoints('');
  };

  const calculateCashValue = (points) => {
    const cash = (points || 0) / 5;
    return `₹${cash.toFixed(2)}`;
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
      }}>Manage Rewards</h2>

      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'flex-start'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email or phone..."
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
            color: '#1f2937',
            minWidth: '150px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            width: '100%',
            maxWidth: '400px',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#dc3545'}
          onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
        />
      </div>

      {loading && <p>Loading users...</p>}

      {!loading && filteredUsers.length > 0 && (
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
                }}>Full Name</th>
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
                }}>Total Points</th>
                <th style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                  textTransform: 'uppercase',
                  fontSize: '0.85em'
                }}>Cash Value</th>
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
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #eee'
                }}>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{user.id}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{user.full_name}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{user.email}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{user.phone}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{user.total_points}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>{calculateCashValue(user.total_points)}</td>
                  <td style={{
                    border: '1px solid #dee2e6',
                    padding: '12px 15px',
                    verticalAlign: 'top',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    <button
                      onClick={() => handleAddClick(user)}
                      style={(loading || isUpdating) ? {
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
                      disabled={loading || isUpdating}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <p>No users found.</p>
      )}

      {addingUser && (
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
            }}>
              Add points for {addingUser.email}
            </p>
            <input
              type="number"
              value={newPoints}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || parseInt(value) >= 0) {
                  setNewPoints(value);
                }
              }}
              placeholder="Enter points to add"
              min="0"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '1em'
              }}
              disabled={isUpdating}
            />
            <p style={{
              fontSize: '0.9em',
              color: '#333',
              marginBottom: '5px',
              lineHeight: '1.4'
            }}>
              Points to add ({newPoints || 0}) = {calculateCashValue(parseInt(newPoints) || 0)}
            </p>
            <p style={{
              fontSize: '0.9em',
              color: '#666',
              marginBottom: '20px',
              lineHeight: '1.4'
            }}>
              Note: 5 points = ₹1
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px'
            }}>
              <button
                onClick={handleAddPoints}
                style={isUpdating ? {
                  padding: '10px 18px',
                  backgroundColor: '#e9ecef',
                  color: '#6c757d',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1em',
                  fontWeight: '500',
                  cursor: 'not-allowed',
                  opacity: '0.8'
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
                disabled={isUpdating}
              >
                {isUpdating ? 'Adding...' : 'Add Points'}
              </button>
              <button
                onClick={handleCancelAdd}
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
                disabled={isUpdating}
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

export default AdminPoints;