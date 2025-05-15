import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminInsights = () => {
  const [orders, setOrders] = useState([]);
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const fetchData = async () => {
    setLoading(true);
    let { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, total, shipping_charges, cod_fee')
      .not('display_order_id', 'is', null)
      .neq('display_order_id', '')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
      setLoading(false);
      return;
    }

    const orderMap = new Map();
    ordersData.forEach((order) => {
      if (order.order_id === order.display_order_id) {
        if (!orderMap.has(order.display_order_id) || new Date(order.created_at) > new Date(orderMap.get(order.display_order_id).created_at)) {
          orderMap.set(order.display_order_id, order);
        }
      }
    });
    const uniqueOrders = Array.from(orderMap.values());


    // Apply filters to deduplicated orders
    let filtered = uniqueOrders;
    if (startDate) filtered = filtered.filter(o => new Date(o.created_at) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(o => new Date(o.created_at) <= new Date(endDate));
    if (filterStatus) filtered = filtered.filter(o => o.shipping_status === filterStatus);
    if (filterCity) filtered = filtered.filter(o => o.shipping_city?.toLowerCase() === filterCity.toLowerCase());

    setOrders(filtered);

    const totalOrders = filtered.length;
    // const totalRevenue = filtered.reduce((acc, o) => acc + ((o.total || 0) - (o.shipping_charges || 0)), 0);
    const totalRevenue = filtered.reduce((acc, o) => acc + ((o.total || 0) - (o.cod_fee || 0)), 0);

    const uniqueCustomers = new Set(filtered.map(o => o.user_id)).size;
    const latestOrderDate = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at;

    const statusCounts = filtered.reduce((acc, o) => {
      const status = o.shipping_status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    const ordersByCity = filtered.reduce((acc, o) => {
      const city = o.shipping_city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const productSales = {};
    filtered.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (item?.name && item?.units !== undefined) {
            const key = `${item.name}|${item.sku || 'N/A'}`;
            productSales[key] = (productSales[key] || 0) + item.units;
          }
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([key, qty]) => {
        const [name, sku] = key.split('|');
        return { name, sku, qty };
      })
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
      .slice(0, 5);

    setInsights({
      totalOrders,
      totalRevenue,
      uniqueCustomers,
      latestOrderDate,
      statusCounts,
      avgOrderValue,
      ordersByCity,
      topProducts
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, filterStatus, filterCity]);

  const exportToCSV = () => {
    const exportDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const rows = [];

    rows.push(['=== Export Metadata ===']);
    rows.push(['Export Date', exportDate]);
    rows.push(['Start Date', startDate || 'N/A']);
    rows.push(['End Date', endDate || 'N/A']);
    rows.push(['Shipping Status Filter', filterStatus || 'All']);
    rows.push(['City Filter', filterCity || 'All']);
    rows.push(['']);

    rows.push(['=== Summary ===']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Orders', insights.totalOrders || 0]);
    rows.push(['Total Net Revenue (₹)', (insights.totalRevenue || 0).toFixed(2)]);
    rows.push(['Average Net Order Value (₹)', (insights.avgOrderValue || 0)]);
    rows.push(['Unique Customers', insights.uniqueCustomers || 0]);
    rows.push(['Latest Order Date', insights.latestOrderDate ? new Date(insights.latestOrderDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A']);
    rows.push(['']);

    rows.push(['=== Shipping Status ===']);
    rows.push(['Status', 'Order Count']);
    Object.entries(insights.statusCounts || {}).forEach(([status, count]) => {
      rows.push([status, count]);
    });
    rows.push(['']);

    rows.push(['=== Orders by City ===']);
    rows.push(['City', 'Order Count']);
    Object.entries(insights.ordersByCity || {}).forEach(([city, count]) => {
      rows.push([city, count]);
    });
    rows.push(['']);

    rows.push(['=== Top Products ===']);
    rows.push(['Rank', 'Product Name', 'SKU', 'Units Sold']);
    insights.topProducts?.forEach((p, i) => {
      rows.push([i + 1, p.name, p.sku, p.qty]);
    });
    rows.push(['']);

    rows.push(['=== Order Details ===']);
    rows.push(['Order Date', 'City', 'Shipping Status', 'Net Revenue (₹)', 'Display Order ID', 'User ID', 'Total Units']);
    orders.forEach(o => {
      const totalUnits = Array.isArray(o.items) ? o.items.reduce((acc, item) => acc + (item.units || 0), 0) : 0;
      const netRevenue = ((o.total || 0) - (o.shipping_charges || 0)).toFixed(2);
      rows.push([
        new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        o.shipping_city || 'Unknown',
        o.shipping_status || 'Unknown',
        netRevenue,
        o.display_order_id || 'N/A',
        o.user_id || 'N/A',
        totalUnits
      ]);
    });

    const csv = rows
      .map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nine9_insights_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', fontFamily: 'sans-serif' }}>
      <h2 style={{
        fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
        fontWeight: 500,
        fontFamily: "'Oswald', sans-serif",
        marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
      }}> Business Insights</h2>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: window.innerWidth <= 768 ? '12px' : '16px',
        marginBottom: window.innerWidth <= 768 ? '20px' : '30px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: window.innerWidth <= 768 ? '1 0 100%' : '1 0 auto' }}>
          <label style={styles.label}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
          />
        </div>
        <div style={{ flex: window.innerWidth <= 768 ? '1 0 100%' : '1 0 auto' }}>
          <label style={styles.label}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
          />
        </div>
        <div style={{ flex: window.innerWidth <= 768 ? '1 0 100%' : '1 0 auto' }}>
          <label style={styles.label}>Shipping Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div style={{ flex: window.innerWidth <= 768 ? '1 0 100%' : '1 0 auto' }}>
          <label style={styles.label}>City:</label>
          <input
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
            placeholder="City name"
          />
        </div>
        <button
          onClick={exportToCSV}
          style={{
            ...styles.exportBtn,
            padding: window.innerWidth <= 768 ? '8px 12px' : '10px 16px',
            fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem'
          }}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem' }}>Loading insights...</p>
      ) : (
        <div style={styles.grid}>
          <InsightCard title="Total Orders" value={insights.totalOrders || 0} />
          <InsightCard title="Total Net Revenue" value={`₹${(insights.totalRevenue || 0).toLocaleString('en-IN')}`} />
          <InsightCard title="Avg Net Order Value" value={`₹${insights.avgOrderValue || 0}`} />
          <InsightCard title="Unique Customers" value={insights.uniqueCustomers || 0} />
          <InsightCard title="Latest Order" value={insights.latestOrderDate ? new Date(insights.latestOrderDate).toLocaleString() : 'N/A'} />

          <div style={{ ...styles.fullCard, gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
            <h4 style={styles.cardTitle}>Orders by Shipping Status</h4>
            <div style={styles.tagGroup}>
              {Object.entries(insights.statusCounts || {}).map(([status, count]) => (
                <span key={status} style={styles.tag}>{status}: {count}</span>
              ))}
            </div>
          </div>

          <div style={{ ...styles.fullCard, gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
            <h4 style={styles.cardTitle}>Orders by City</h4>
            <div style={styles.tagGroup}>
              {Object.entries(insights.ordersByCity || {}).map(([city, count]) => (
                <span key={city} style={styles.tag}>{city}: {count}</span>
              ))}
            </div>
          </div>

          <div style={{ ...styles.fullCard, gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
            <h4 style={styles.cardTitle}>Top Selling Products</h4>
            {insights.topProducts?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>SKU (ID)</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topProducts.map((p, i) => (
                    <tr key={i} style={{ background: i === 0 ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '8px' }}>{i + 1}</td>
                      <td style={{ padding: '8px' }}>{p.name} {i === 0 ? '(Top Seller)' : ''}</td>
                      <td style={{ padding: '8px' }}>{p.sku}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem', color: '#666' }}>
                No products sold in the selected filters.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InsightCard = ({ title, value }) => (
  <div style={styles.card}>
    <h4 style={styles.cardTitle}>{title}</h4>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

const styles = {
  input: {
    padding: window.innerWidth <= 768 ? '6px 10px' : '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.95rem',
    boxSizing: 'border-box'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.9rem',
    color: '#333'
  },
  exportBtn: {
    backgroundColor: '#1f2937',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: window.innerWidth <= 768 ? '12px' : '20px'
  },
  card: {
    background: '#ffffff',
    padding: window.innerWidth <= 768 ? '16px' : '20px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  cardTitle: {
    fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
    marginBottom: '10px',
    color: '#333'
  },
  cardValue: {
    fontSize: window.innerWidth <= 768 ? '1.4rem' : '1.6rem',
    fontWeight: '600',
    color: '#111'
  },
  fullCard: {
    background: '#fff',
    padding: window.innerWidth <= 768 ? '16px' : '20px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: window.innerWidth <= 768 ? '8px' : '10px',
    marginTop: window.innerWidth <= 768 ? '8px' : '12px'
  },
  tag: {
    background: '#f3f4f6',
    padding: window.innerWidth <= 768 ? '4px 10px' : '6px 12px',
    borderRadius: '16px',
    fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.85rem',
    color: '#1f2937',
    fontWeight: '500'
  }
};

export default AdminInsights;