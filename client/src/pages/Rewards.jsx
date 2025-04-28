import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Navbar from '../components/Navbar';
import Footer from "../pages/Footer";

const Rewards = () => {
    const [points, setPoints] = useState(0);
    const [activities, setActivities] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const calculatePoints = (netAmount) => {
        return Math.max(0, Math.floor(netAmount / 100) * 10);
    };

    useEffect(() => {
        const fetchUserAndPoints = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (!user) {
                    navigate('/login');
                    return;
                }
                setUser(user);

                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('display_order_id, total_amount, shipping_charges, created_at')
                    .eq('user_id', user.id);

                if (ordersError) throw ordersError;

                const ordersWithPoints = ordersData.map(order => {
                    const totalAmount = order.total_amount != null ? order.total_amount : 0;
                    const shippingCharges = order.shipping_charges != null ? order.shipping_charges : 0;
                    const netAmount = totalAmount - shippingCharges;
                    return {
                        type: 'order',
                        id: order.display_order_id,
                        netAmount: netAmount,
                        points: calculatePoints(netAmount),
                        date: order.created_at,
                        discount: 0
                    };
                });

                const uniqueOrders = Object.values(
                    ordersWithPoints.reduce((acc, order) => {
                        if (order.netAmount > 0 && (!acc[order.id] || order.netAmount > acc[order.id].netAmount)) {
                            acc[order.id] = order;
                        }
                        return acc;
                    }, {})
                );

                const { data: redemptionsData, error: redemptionsError } = await supabase
                    .from('point_redemptions')
                    .select('points_redeemed, discount_amount, created_at')
                    .eq('user_id', user.id);

                if (redemptionsError) throw redemptionsError;

                const redemptions = redemptionsData.map(redemption => ({
                    type: 'redemption',
                    id: null,
                    netAmount: 0,
                    points: -redemption.points_redeemed,
                    date: redemption.created_at,
                    discount: redemption.discount_amount
                }));

                const allActivities = [...uniqueOrders, ...redemptions].sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });

                const totalEarnedPoints = uniqueOrders.reduce((sum, order) => sum + order.points, 0);
                const totalRedeemedPoints = redemptions.reduce((sum, redemption) => sum + Math.abs(redemption.points), 0);
                const netPoints = totalEarnedPoints - totalRedeemedPoints;

                setActivities(allActivities);
                setPoints(netPoints);
            } catch (error) {
                console.error('Error fetching user, orders, or redemptions:', error.message);
                alert('Error loading rewards: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndPoints();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: 'black',
                fontFamily: "'Roboto', sans-serif"
            }}>
                <Navbar showLogo={true} />
                <div style={{
                    flex: '1 0 auto',
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <p style={{ 
                        fontSize: '18px',
                        fontFamily: "'Louvette Semi Bold', sans-serif"
                    }}>Loading rewards...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: 'black',
            fontFamily: "'Roboto', sans-serif"
        }}>
            <Navbar showLogo={true} />
            
            <div style={{ flex: '1 0 auto' }}>
                <section style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <h2 style={{
                        fontSize: "2.8rem",
                        fontFamily: "'Abril Extra Bold', sans-serif",
                        marginBottom: '30px',
                        fontWeight: '700',
                        color: '#Ffa500',
                        marginTop: '60px'
                    }}>Your Rewards</h2>

                    <div style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        borderRadius: '8px',
                        textAlign: 'left',
                        padding: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{
                                fontFamily: "'Abril Extra Bold', sans-serif",
                                fontSize: '1.5rem',
                                color: 'white',
                                marginBottom: '10px'
                            }}>Points Balance: {points}</h3>
                            <p style={{
                                fontFamily: "'Louvette Semi Bold', sans-serif",
                                color: '#ccc',
                                fontSize: '1rem'
                            }}>Worth ₹{(points / 5).toFixed(2)}</p>
                            {user && (
                                <p style={{
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    color: '#999',
                                    fontSize: '0.875rem'
                                }}>Logged in as: {user.email}</p>
                            )}
                        </div>

                        <div>
                            <h3 style={{
                                fontFamily: "'Abril Extra Bold', sans-serif",
                                fontSize: '1.25rem',
                                color: 'white',
                                marginBottom: '15px'
                            }}>Rewards Activity</h3>
                            {activities.length === 0 ? (
                                <p style={{
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    color: '#ccc',
                                    textAlign: 'center',
                                    padding: '20px'
                                }}>
                                    No activity found. <a href="/shop" style={{ color: '#Ffa500' }}>Start shopping to earn points!</a>
                                </p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '14px',
                                        color: 'white',
                                        fontFamily: "'Louvette Semi Bold', sans-serif"
                                    }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Date</th>
                                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>ID</th>
                                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Net Amount (₹)</th>
                                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Points</th>
                                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Discount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.map((activity, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                                        {new Date(activity.date).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                                        {activity.type === 'order' ? activity.id : '-'}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                                        {activity.type === 'order' ? activity.netAmount.toFixed(2) : '-'}
                                                    </td>
                                                    <td style={{ 
                                                        padding: '10px', 
                                                        border: '1px solid #ccc',
                                                        color: activity.points < 0 ? '#ff4444' : 'inherit'
                                                    }}>
                                                        {activity.points}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                                        {activity.type === 'redemption' ? activity.discount.toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default Rewards;