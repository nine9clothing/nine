import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format, subDays, subMonths, differenceInYears } from 'date-fns';

const PIE_COLORS = ['#60a5fa', '#34d399', '#facc15', '#fb923c', '#f87171', '#a78bfa'];
const BAR_COLOR = '#818cf8';
const MONTHLY_SALES_COLOR = '#10b981';

const AdminDashboard = () => {
  const [statusData, setStatusData] = useState([]);
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingMonthlySales, setIsLoadingMonthlySales] = useState(true);
  const [isLoadingAgeGroups, setIsLoadingAgeGroups] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [revenueError, setRevenueError] = useState(null);
  const [monthlySalesError, setMonthlySalesError] = useState(null);
  const [ageGroupError, setAgeGroupError] = useState(null);

  const fetchStatusChart = useCallback(async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('shipping_status, order_id, display_order_id, created_at')
        .not('shipping_status', 'is', null)
        .neq('shipping_status', '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No data received for shipping status");

  

      const orderMap = new Map();
      data.forEach((order) => {
        if (order.order_id === order.display_order_id) {
          if (!orderMap.has(order.display_order_id) || new Date(order.created_at) > new Date(orderMap.get(order.display_order_id).created_at)) {
            orderMap.set(order.display_order_id, order);
          }
        }
      });
      const uniqueOrders = Array.from(orderMap.values());


      const counts = uniqueOrders.reduce((acc, { shipping_status }) => {
        if (shipping_status && shipping_status.trim() !== '') {
          acc[shipping_status] = (acc[shipping_status] || 0) + 1;
        }
        return acc;
      }, {});

      const chartData = Object.entries(counts)
        .map(([status, value]) => ({ name: status, value }))
        .filter(entry => entry.value > 0);


      setStatusData(chartData);
    } catch (error) {
      // console.error('Shipping status chart error:', error.message);
      setStatusError('Failed to load shipping status data.');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const fetchDailyRevenue = useCallback(async () => {
    setIsLoadingRevenue(true);
    setRevenueError(null);
    try {
      const since = subDays(new Date(), 6).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('total, shipping_charges, created_at, order_id, display_order_id, cod_fee')
        .gte('created_at', since)
        .not('display_order_id', 'is', null)
        .neq('display_order_id', '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error("No data received for revenue");

     

      const orderMap = new Map();
      data.forEach((order) => {
        if (order.order_id === order.display_order_id) {
          if (!orderMap.has(order.display_order_id) || new Date(order.created_at) > new Date(orderMap.get(order.display_order_id).created_at)) {
            orderMap.set(order.display_order_id, order);
          }
        }
      });
      const uniqueOrders = Array.from(orderMap.values());


      const dailyTotals = uniqueOrders.reduce((acc, order) => {
        const date = format(new Date(order.created_at), 'MMM dd');
        const netAmount = (order.total || 0)-(order.cod_fee || 0);
        // const netAmount = (order.total || 0) - (order.shipping_charges || 0);

        acc[date] = (acc[date] || 0) + Math.max(netAmount, 0);
        return acc;
      }, {});


      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const formattedDate = format(date, 'MMM dd');
        last7Days.push({
          date: formattedDate,
          total: dailyTotals[formattedDate] || 0
        });
      }
      setDailyRevenueData(last7Days);
    } catch (error) {
      // console.error('Revenue chart error:', error.message);
      setRevenueError('Failed to load daily net revenue data.');
    } finally {
      setIsLoadingRevenue(false);
    }
  }, []);

  const fetchMonthlySales = useCallback(async () => {
    setIsLoadingMonthlySales(true);
    setMonthlySalesError(null);
    try {
      const since = subMonths(new Date(), 12).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('total, shipping_charges, created_at, order_id, display_order_id, cod_fee')
        .gte('created_at', since)
        .not('display_order_id', 'is', null)
        .neq('display_order_id', '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error("No data received for monthly sales");

   

      const orderMap = new Map();
      data.forEach((order) => {
        if (order.order_id === order.display_order_id) {
          if (!orderMap.has(order.display_order_id) || new Date(order.created_at) > new Date(orderMap.get(order.display_order_id).created_at)) {
            orderMap.set(order.display_order_id, order);
          }
        }
      });
      const uniqueOrders = Array.from(orderMap.values());


      const monthlyTotals = uniqueOrders.reduce((acc, order) => {
        const month = format(new Date(order.created_at), 'MMM yyyy');
        const netAmount = (order.total || 0) - (order.cod_fee ||0);
        // const netAmount = (order.total || 0) - (order.shipping_charges || 0);

        acc[month] = (acc[month] || 0) + Math.max(netAmount, 0);
        return acc;
      }, {});


      const last12Months = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const formattedMonth = format(date, 'MMM yyyy');
        last12Months.push({
          month: formattedMonth,
          total: monthlyTotals[formattedMonth] || 0
        });
      }


      setMonthlySalesData(last12Months);
    } catch (error) {
      // console.error('Monthly sales chart error:', error.message);
      setMonthlySalesError('Failed to load monthly net sales data.');
    } finally {
      setIsLoadingMonthlySales(false);
    }
  }, []);

  const fetchAgeGroupChart = useCallback(async () => {
    setIsLoadingAgeGroups(true);
    setAgeGroupError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id, order_id, display_order_id, created_at')
        .not('display_order_id', 'is', null)
        .neq('display_order_id', '')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No orders with valid user_id found");

    

      const orderMap = new Map();
      data.forEach((order) => {
        if (order.order_id === order.display_order_id) {
          if (!orderMap.has(order.display_order_id) || new Date(order.created_at) > new Date(orderMap.get(order.display_order_id).created_at)) {
            orderMap.set(order.display_order_id, order);
          }
        }
      });
      const uniqueOrders = Array.from(orderMap.values());


      const userIds = [...new Set(uniqueOrders.map(order => order.user_id))];
      const { data: userData, error: userError } = await supabase
        .from('registered_details')
        .select('id, birthday')
        .in('id', userIds)
        .not('birthday', 'is', null);

      if (userError) throw userError;
      if (!userData || userData.length === 0) throw new Error("No user data with valid birthday found");

      const userAgeMap = {};
      const currentDate = new Date('2025-04-20');
      userData.forEach(user => {
        const birthdayDate = new Date(user.birthday);
        if (birthdayDate < currentDate) {
          const age = differenceInYears(currentDate, birthdayDate);
          userAgeMap[user.id] = age;
        } else {
          // console.warn(`Invalid future birthday for user ${user.id}: ${user.birthday}, skipping`);
        }
      });

      const ageGroups = {
        '<18': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55+': 0
      };

      uniqueOrders.forEach(order => {
        const age = userAgeMap[order.user_id];
        if (age !== undefined) {
          if (age < 18) ageGroups['<18']++;
          else if (age <= 24) ageGroups['18-24']++;
          else if (age <= 34) ageGroups['25-34']++;
          else if (age <= 44) ageGroups['35-44']++;
          else if (age <= 54) ageGroups['45-54']++;
          else ageGroups['55+']++;
        }
      });


      const chartData = Object.entries(ageGroups)
        .map(([name, value]) => ({ name, value }))
        .filter(entry => entry.value > 0);


      setAgeGroupData(chartData);
    } catch (error) {
      // console.error('Age group chart error:', error.message);
      setAgeGroupError('Failed to load age group data.');
    } finally {
      setIsLoadingAgeGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusChart();
    fetchDailyRevenue();
    fetchMonthlySales();
    fetchAgeGroupChart();
  }, [fetchStatusChart, fetchDailyRevenue, fetchMonthlySales, fetchAgeGroupChart]);

  const renderChartContent = (isLoading, error, ChartComponent) => {
    if (isLoading) {
      return <div style={styles.loadingOrError}>Loading...</div>;
    }
    if (error) {
      return <div style={styles.loadingOrError}>{error}</div>;
    }
    return ChartComponent;
  };

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '16px' : '24px 32px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: 'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <header style={{
        marginBottom: window.innerWidth <= 768 ? '20px' : '32px'
      }}>
        <h1 style={{
          fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
          fontWeight: '500',
          color: '#111827',
          marginBottom: '8px',
          fontFamily: "'Oswald', sans-serif"
        }}>Welcome, Admin 👋</h1>
        <p style={{
          fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.95rem',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          Overview of store performance and customer demographics.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
        gridTemplateRows: 'auto auto',
        gap: window.innerWidth <= 768 ? '16px' : '24px'
      }}>
        {/* Row 1: Bar Charts (Daily Revenue and Monthly Sales) */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: window.innerWidth <= 768 ? '16px' : '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
          }}>Daily Net Revenue (Last 7 Days, ₹)</h3>
          <div style={{
            height: window.innerWidth <= 768 ? '250px' : '300px',
            width: '100%'
          }}>
            {renderChartContent(isLoadingRevenue, revenueError, (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyRevenueData}
                  margin={{ top: 5, right: 10, left: window.innerWidth <= 768 ? -25 : -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    fontSize={window.innerWidth <= 768 ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={window.innerWidth <= 768 ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(129, 140, 248, 0.1)' }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Net Revenue']}
                  />
                  <Bar
                    dataKey="total"
                    fill={BAR_COLOR}
                    radius={[4, 4, 0, 0]}
                    barSize={window.innerWidth <= 768 ? 20 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: window.innerWidth <= 768 ? '16px' : '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
          }}>Monthly Net Sales (Last 12 Months, ₹)</h3>
          <div style={{
            height: window.innerWidth <= 768 ? '250px' : '300px',
            width: '100%'
          }}>
            {renderChartContent(isLoadingMonthlySales, monthlySalesError, (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlySalesData}
                  margin={{ top: 5, right: 10, left: window.innerWidth <= 768 ? -25 : -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    fontSize={window.innerWidth <= 768 ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    angle={window.innerWidth <= 768 ? -45 : 0}
                    textAnchor={window.innerWidth <= 768 ? 'end' : 'middle'}
                  />
                  <YAxis
                    fontSize={window.innerWidth <= 768 ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Net Sales']}
                  />
                  <Bar
                    dataKey="total"
                    fill={MONTHLY_SALES_COLOR}
                    radius={[4, 4, 0, 0]}
                    barSize={window.innerWidth <= 768 ? 20 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </div>
        </div>

        {/* Row 2: Pie Charts (Shipping Status and Age Group) */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: window.innerWidth <= 768 ? '16px' : '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
          }}>Orders by Shipping Status</h3>
          <div style={{
            height: window.innerWidth <= 768 ? '250px' : '300px',
            width: '100%'
          }}>
            {renderChartContent(isLoadingStatus, statusError, (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={window.innerWidth <= 768 ? 70 : 90}
                    innerRadius={window.innerWidth <= 768 ? 40 : 50}
                    fill="#8884d8"
                    paddingAngle={2}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      return percent > 0.05 ? (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={window.innerWidth <= 768 ? 10 : 12}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} orders`, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={window.innerWidth <= 768 ? 8 : 10}
                    wrapperStyle={{ fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ))}
          </div>
          {!isLoadingStatus && !statusError && statusData.length > 0 && (
            <div style={{
              marginTop: window.innerWidth <= 768 ? '16px' : '20px',
              padding: '10px 0'
            }}>
              <h4 style={{
                fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '10px'
              }}>Shipping Status Breakdown</h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                {statusData.map((entry, index) => (
                  <li key={entry.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                    color: '#4b5563',
                    marginBottom: window.innerWidth <= 768 ? '6px' : '8px'
                  }}>
                    <span style={{
                      width: window.innerWidth <= 768 ? '8px' : '10px',
                      height: window.innerWidth <= 768 ? '8px' : '10px',
                      borderRadius: '50%',
                      marginRight: '10px',
                      display: 'inline-block',
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                    }}></span>
                    <span>{entry.name}: {entry.value} orders</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: window.innerWidth <= 768 ? '16px' : '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: window.innerWidth <= 768 ? '16px' : '20px'
          }}>Orders by Age Group</h3>
          <div style={{
            height: window.innerWidth <= 768 ? '250px' : '300px',
            width: '100%'
          }}>
            {renderChartContent(isLoadingAgeGroups, ageGroupError, (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageGroupData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={window.innerWidth <= 768 ? 70 : 90}
                    innerRadius={window.innerWidth <= 768 ? 40 : 50}
                    fill="#8884d8"
                    paddingAngle={2}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      return percent > 0.05 ? (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={window.innerWidth <= 768 ? 10 : 12}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} orders`, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={window.innerWidth <= 768 ? 8 : 10}
                    wrapperStyle={{ fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ))}
          </div>
          {!isLoadingAgeGroups && !ageGroupError && ageGroupData.length > 0 && (
            <div style={{
              marginTop: window.innerWidth <= 768 ? '16px' : '20px',
              padding: '10px 0'
            }}>
              <h4 style={{
                fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '10px'
              }}>Age Group Breakdown</h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                {ageGroupData.map((entry, index) => (
                  <li key={entry.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                    color: '#4b5563',
                    marginBottom: window.innerWidth <= 768 ? '6px' : '8px'
                  }}>
                    <span style={{
                      width: window.innerWidth <= 768 ? '8px' : '10px',
                      height: window.innerWidth <= 768 ? '8px' : '10px',
                      borderRadius: '50%',
                      marginRight: '10px',
                      display: 'inline-block',
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                    }}></span>
                    <span>{entry.name}: {entry.value} orders</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

const styles = {
  container: {
    padding: window.innerWidth <= 768 ? '16px' : '24px 32px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    fontFamily: 'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    marginBottom: window.innerWidth <= 768 ? '20px' : '32px',
  },
  title: {
    fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '8px',
    fontFamily: "'Oswald', sans-serif",
  },
  subtitle: {
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.95rem',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: window.innerWidth <= 768 ? '16px' : '24px',
  },
  chartBox: {
    backgroundColor: '#ffffff',
    padding: window.innerWidth <= 768 ? '16px' : '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  chartTitle: {
    fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
  },
  chartContainer: {
    height: window.innerWidth <= 768 ? '250px' : '300px',
    width: '100%',
  },
  loadingOrError: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
    color: '#6b7280',
  },
  statusList: {
    margincharg: window.innerWidth <= 0 ? '16px' : '24px',
    padding: '10px 0',
  },
  statusListTitle: {
    fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '10px',
  },
  statusListItems: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  statusListItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
    color: '#4b5563',
    marginBottom: window.innerWidth <= 768 ? '6px' : '8px',
  },
  statusDot: {
    width: window.innerWidth <= 768 ? '8px' : '10px',
    height: window.innerWidth <= 768 ? '8px' : '10px',
    borderRadius: '50%',
    marginRight: '10px',
    display: 'inline-block',
  },
};