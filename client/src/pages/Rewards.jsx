import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Navbar from '../components/Navbar';
import Footer from '../pages/Footer';
import ToastMessage from '../ToastMessage'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUserCheck, 
    faCoins, 
    faExchangeAlt, 
    faClock, 
    faBan, 
    faAdjust, 
    faEdit, 
    faExclamationTriangle, 
    faFileContract 
} from '@fortawesome/free-solid-svg-icons';

const Rewards = () => {
    const [points, setPoints] = useState(0);
    const [activities, setActivities] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [flippedCards, setFlippedCards] = useState({});
    const [showTransactions, setShowTransactions] = useState(true);
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState(null);

    const loyaltyInfo = [
        {
            title: "Eligibility",
            content: "The loyalty program is open to all customers making eligible purchases.",
            icon: faUserCheck
        },
        {
            title: "Earning Points",
            content: "Points are awarded as per customer service credits or other promotions. Check your transaction history for details.",
            icon: faCoins
        },
        {
            title: "Redeeming Points",
            content: "5 loyalty points are equivalent to ₹1 when redeemed. Points can be redeemed for discounts on future purchases.",
            icon: faExchangeAlt
        },
        {
            title: "Point Expiry",
            content: "Loyalty points are valid for 12 months from the date of issuance unless otherwise specified. Expired points cannot be reinstated.",
            icon: faClock
        },
        {
            title: "Exclusions",
            content: "Points may not be earned or redeemed during certain promotional events unless stated.",
            icon: faBan
        },
        {
            title: "Account Adjustments",
            content: "Points adjustments may be made by customer service as needed.",
            icon: faAdjust
        },
        {
            title: "Program Changes",
            content: "Nine9 reserves the right to modify, suspend, or terminate the loyalty program at any time without prior notice.",
            icon: faEdit
        },
        {
            title: "Fraudulent Activity",
            content: "Any fraud, misuse, or violation of terms may result in disqualification from the loyalty program and forfeiture of points.",
            icon: faExclamationTriangle
        },
        {
            title: "General Terms",
            content: "Participation in the loyalty program constitutes acceptance of these terms and conditions.",
            icon: faFileContract
        }
    ];

    const toggleFlip = (index) => {
        setFlippedCards(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleTransactions = () => {
        setShowTransactions(prev => !prev);
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

                const { data: redemptionsData, error: redemptionsError } = await supabase
                    .from('point_redemptions')
                    .select('id, points_received, amount_received, points_redeemed, amount_redeemed, created_at, expiry_date, description')
                    .eq('user_id', user.id)
                    .or(`created_at.lt.${new Date().toISOString()}`);
                    

                if (redemptionsError) throw redemptionsError;

                const today = new Date();
                let totalPointsReceived = 0;
                let totalPointsRedeemed = 0;
                let totalAmountReceived = 0;
                let totalAmountRedeemed = 0;
                const allActivities = [];

                redemptionsData.forEach(redemption => {
                    const pointsReceived = redemption.points_received || 0;
                    const pointsRedeemed = redemption.points_redeemed || 0;
                    const amountReceived = redemption.amount_received || 0;
                    const amountRedeemed = redemption.amount_redeemed || 0;
                    const expiryDate = redemption.expiry_date ? new Date(redemption.expiry_date) : null;

                    allActivities.push({
                        type: redemption.description || 'Customer Service Credit',
                        id: redemption.id,
                        netAmount: amountReceived,
                        points: pointsReceived - pointsRedeemed,
                        date: redemption.created_at,
                        discount: amountRedeemed,
                        expiry_date: redemption.expiry_date
                    });

                    if (expiryDate && expiryDate < today && pointsReceived > 0) {
                        allActivities.push({
                            type: `${redemption.description || 'Customer Service Credit'} (Expired)`,
                            id: `${redemption.id}-expired`,
                            netAmount: -(pointsReceived / 5), 
                            points: -pointsReceived,
                            date: expiryDate.toISOString(),
                            discount: 0,
                            expiry_date: null 
                        });
                    } else {
                        totalPointsReceived += pointsReceived;
                        totalPointsRedeemed += pointsRedeemed;
                        totalAmountReceived += amountReceived;
                        totalAmountRedeemed += amountRedeemed;
                    }
                });

                const calculatedPoints = Math.max(0, totalPointsReceived - totalPointsRedeemed);
                setPoints(calculatedPoints);
                setActivities(allActivities.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (error) {
                setToastMessage({
                    message: 'Failed to load rewards. Please try again.',
                    type: 'error'
                });
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
                background: 'linear-gradient(135deg, #000, #1a1a1a)',
                fontFamily: "'Roboto', sans-serif"
            }}>
                <Navbar showLogo={true} />
                <div style={{
                    flex: '1 0 auto',
                    padding: '40px 15px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '1rem',
                        fontFamily: "'Louvette Semi Bold', sans-serif",
                        color: '#fff',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px 20px',
                        marginTop: '70px',
                        borderRadius: '8px',
                        display: 'inline-block'
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
            background: 'linear-gradient(135deg, #000, #1a1a1a)',
            fontFamily: "'Roboto', sans-serif'"
        }}>
            <Navbar showLogo={true} />
            <div style={{
                flex: '1 0 auto'
            }}>
                <section style={{
                    padding: '20px 10px',
                    textAlign: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontFamily: "'Abril Extra Bold', sans-serif",
                        marginBottom: '20px',
                        marginTop: '60px',
                        fontWeight: '700',
                        color: '#Ffa500'
                    }}>Your Rewards</h2>

                    <div style={{
                        maxWidth: '600px',
                        margin: '0 auto 20px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        padding: '15px',
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(26, 26, 26, 0.9))',
                        boxShadow: '0 6px 20px rgba(255, 165, 0, 0.2)',
                        border: '1px solid #Ffa500',
                        animation: 'fadeIn 0.5s ease-in-out'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontFamily: "'Abril Extra Bold', sans-serif",
                            marginBottom: '10px',
                            color: '#fff',
                            textTransform: 'uppercase',
                            textAlign: 'center'
                        }}>Available Balance</h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            marginBottom: '10px',
                            flexWrap: 'wrap',
                            gap: '10px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'rgba(255, 165, 0, 0.1)',
                                border: '1px solid rgba(255, 165, 0, 0.3)',
                                flex: '1',
                                minWidth: '100px'
                            }}>
                                <p style={{
                                    fontSize: '0.85rem',
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    color: '#d1d5db',
                                    marginBottom: '5px'
                                }}>Points Balance</p>
                                <p style={{
                                    fontSize: '1.5rem',
                                    fontFamily: "'Abril Extra Bold', sans-serif",
                                    color: '#Ffa500',
                                    fontWeight: '700'
                                }}>{points}</p>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'rgba(255, 165, 0, 0.1)',
                                border: '1px solid rgba(255, 165, 0, 0.3)',
                                flex: '1',
                                minWidth: '100px'
                            }}>
                                <p style={{
                                    fontSize: '0.85rem',
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    color: '#d1d5db',
                                    marginBottom: '5px'
                                }}>Cash Value</p>
                                <p style={{
                                    fontSize: '1.5rem',
                                    fontFamily: "'Abril Extra Bold', sans-serif",
                                    color: '#Ffa500',
                                    fontWeight: '700'
                                }}>₹{(points / 5).toFixed(2)}</p>
                            </div>
                        </div>
                        {user && (
                            <p style={{
                                fontSize: '0.75rem',
                                fontFamily: "'Louvette Semi Bold', sans-serif",
                                color: '#9ca3af',
                                textAlign: 'center',
                                marginTop: '8px'
                            }}>Logged in as: {user.email}</p>
                        )}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '10px'
                        }}>
                            <button 
                                onClick={toggleTransactions}
                                style={{
                                    background: 'linear-gradient(135deg, #Ffa500, #ff8c00)',
                                    color: 'black',
                                    padding: '8px 15px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 3px 10px rgba(255, 165, 0, 0.4)',
                                    transition: 'all 0.3s ease',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                {showTransactions ? 'Hide Transactions' : 'View Transactions'}
                            </button>
                        </div>
                    </div>

                    {showTransactions && (
                        <div style={{
                            maxWidth: '1200px',
                            margin: '0 auto 30px',
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(26, 26, 26, 0.85))',
                            borderRadius: '12px',
                            padding: '15px',
                            border: '1px solid #Ffa500',
                            boxShadow: '0 6px 20px rgba(255, 165, 0, 0.2)',
                            animation: 'fadeIn 0.6s ease-in-out'
                        }}>
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontFamily: "'Abril Extra Bold', sans-serif",
                                marginBottom: '15px',
                                color: '#Ffa500',
                                textTransform: 'uppercase',
                                textAlign: 'center'
                            }}>Transaction History</h3>
                            {activities.length === 0 ? (
                                <p style={{
                                    fontSize: '0.9rem',
                                    fontFamily: "'Louvette Semi Bold', sans-serif",
                                    color: '#fff',
                                    textAlign: 'center',
                                    padding: '10px',
                                    background: 'rgba(255, 165, 0, 0.1)',
                                    borderRadius: '8px',
                                    margin: '10px 0'
                                }}>
                                    No activity found!
                                </p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'separate',
                                        borderSpacing: '0',
                                        fontSize: '0.85rem',
                                        color: '#fff',
                                        fontFamily: "'Louvette Semi Bold', sans-serif",
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255, 165, 0, 0.3)' }}>
                                                <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem' }}>Date</th>
                                                <th style={{ padding: '8px', marginLeft:'10%', fontSize: '0.8rem' }}>Description</th>
                                                <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem' }}>Amount (₹)</th>
                                                <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem' }}>Points</th>
                                                <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem' }}>Discount (₹)</th>
                                                <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem' }}>Expiry Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.map((activity, index) => (
                                                <tr key={index} style={{ 
                                                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
                                                        {new Date(activity.date).toLocaleString().slice(0, 10)}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
                                                        {activity.type}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255, 165, 0, 0.2)',color: activity.netAmount > 0 ? '#4ade80' : activity.netAmount < 0 ? '#ff4d4f' : '#fff', textAlign: 'right' }}>
                                                        {activity.netAmount !== 0 ? activity.netAmount.toFixed(2) : '-'}
                                                    </td>
                                                    <td style={{
                                                        padding: '8px',
                                                        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
                                                        color: activity.points > 0 ? '#4ade80' : activity.points < 0 ? '#ff4d4f' : '#fff',
                                                        fontWeight: 'bold',
                                                        textAlign: 'right'
                                                    }}>
                                                        {activity.points > 0 ? `+${activity.points}` : activity.points}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255, 165, 0, 0.2)', textAlign: 'right' }}>
                                                        {activity.discount > 0 ? activity.discount.toFixed(2) : '-'}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255, 165, 0, 0.2)', textAlign: 'right' }}>
                                                        {activity.expiry_date && !activity.type.includes('(Expired)') ? new Date(activity.expiry_date).toLocaleString().slice(0, 10) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto 20px',
                        padding: '0 10px'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontFamily: "'Abril Extra Bold', sans-serif",
                            color: '#fff',
                            textTransform: 'uppercase',
                            marginBottom: '10px'
                        }}>Loyalty Program</h3>
                        <p style={{
                            fontSize: '0.85rem',
                            fontFamily: "'Louvette Semi Bold', sans-serif",
                            color: '#d1d5db',
                            marginBottom: '15px'
                        }}>Tap any card to learn more about our loyalty program</p>
                    </div>

                    <div className="loyalty-cards-container" style={{
                        maxWidth: '1200px',
                        margin: '0 auto 30px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '10px',
                        padding: '10px'
                    }}>
                        {loyaltyInfo.map((item, index) => (
                            <div 
                                key={index}
                                className="flip-card"
                                onClick={() => toggleFlip(index)}
                                style={{
                                    perspective: '1000px',
                                    height: '180px',
                                    cursor: 'pointer',
                                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s`,
                                    opacity: 1
                                }}
                            >
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    transition: 'transform 0.8s',
                                    transformStyle: 'preserve-3d',
                                    transform: flippedCards[index] ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        transform: "rotateY(0deg)",
                                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(230, 230, 230, 0.95))',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        border: '2px solid #Ffa500',
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '6px',
                                            background: 'linear-gradient(90deg, #Ffa500, #ff8c00)'
                                        }}></div>
                                        <div style={{
                                           fontSize: '2rem',
                                           color: '#Ffa500',
                                           marginBottom: '12px'
                                        }}>
                                         <FontAwesomeIcon icon={item.icon} />
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.2rem',
                                            fontFamily: "'Abril Extra Bold', sans-serif",
                                            color: 'black',
                                            textTransform: 'uppercase',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {item.title}
                                        </h3>
                                    </div>
                                    
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        background: 'linear-gradient(145deg, rgba(255, 165, 0, 0.9), rgba(255, 140, 0, 0.8))',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        border: '2px solid #000',
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'auto'
                                    }}>
                                        <p style={{
                                            fontSize: '0.85rem',
                                            fontFamily: "'Louvette Semi Bold', sans-serif",
                                            color: 'black',
                                            lineHeight: '1.4',
                                            textAlign: 'center'
                                        }}>
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                {toastMessage && (
                    <ToastMessage
                        message={toastMessage.message}
                        type={toastMessage.type}
                        onClose={() => setToastMessage(null)}
                    />
                )}

                <style>
                    {`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        
                        @media (max-width: 768px) {
                            section {
                                padding: '15px 8px'
                            }
                            h2 {
                                font-size: '2rem',
                                marginTop: '50px'
                            }
                            h3 {
                                font-size: '1.3rem'
                            }
                            .loyalty-cards-container {
                                grid-template-columns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '8px'
                            }
                            .flip-card {
                                height: '150px'
                            }
                            .flip-card h3 {
                                font-size: '1.1rem'
                            }
                            .flip-card p {
                                font-size: '0.8rem'
                            }
                            .flip-card > div > div {
                                padding: '12px'
                            }
                            table {
                                fontSize: '0.8rem'
                            }
                            th, td {
                                padding: '6px'
                            }
                            button {
                                padding: '8px 15px',
                                fontSize: '0.85rem'
                            }
                        }
                        
                        @media (max-width: 480px) {
                            section {
                                padding: '10px 5px'
                            }
                            h2 {
                                font-size: '1.5rem',
                                marginTop: '40px'
                            }
                            h3 {
                                font-size: '1.2rem'
                            }
                            .loyalty-cards-container {
                                grid-template-columns: '1fr',
                                gap: '5px'
                            }
                            .flip-card {
                                height: '120px'
                            }
                            .flip-card h3 {
                                font-size: '1rem'
                            }
                            .flip-card p {
                                font-size: '0.75rem'
                            }
                            .flip-card > div > div {
                                padding: '10px'
                            }
                            table {
                                font-size: '0.75rem'
                            }
                            th, td {
                                padding: '5px'
                            }
                            button {
                                padding: '6px 12px',
                                fontSize: '0.8rem'
                            }
                            .points-balance div {
                                min-width: '90px'
                            }
                        }
                        
                        .flip-card:hover {
                            transform: translateY(-5px);
                            transition: transform 0.3s ease;
                        }
                    `}
                </style>
            </div>
            <Footer />
        </div>
    );
};

export default Rewards;