import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  FaBars, FaTimes, FaTachometerAlt, FaBoxOpen, FaPlusSquare,
  FaListAlt, FaChartLine, FaEnvelope, FaSignOutAlt, FaVideo,
  FaAngleDown, FaAngleRight, FaShoppingCart, FaRegEye, FaExchangeAlt, FaBell, FaNewspaper, FaOpencart, FaQrcode, FaImage, FaGift, FaPlane
} from 'react-icons/fa';
import logo from '../assets/nine9_logo.jpg';

const AdminLayout = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedSections, setExpandedSections] = useState({
    products: false,
    videos: false,
    orders: false
  });
  const navigate = useNavigate();
  const location = useLocation();

  const colors = {
    primary: '#007bff',
    primaryLight: '#e6f2ff',
    sidebarBg: '#111827',
    sidebarLinkText: '#d1d5db',
    sidebarNestedBg: '#0c111b',
    sidebarLinkHoverBg: '#1f2937',
    sidebarLinkActiveBg: '#1f2937',
    sidebarLinkActiveText: '#ffffff',
    activeBorderColor: '#3b82f6',
    headerBg: '#ffffff',
    headerText: '#1f2937',
    mainBg: '#f9fafb',
    logoutBtnBg: '#ef4444',
    logoutBtnHoverBg: '#dc2626',
    borderColor: '#e5e7eb',
    iconColor: '#9ca3af',
    iconActiveColor: '#ffffff',
  };

  const sidebarWidth = '250px';
  const headerHeight = '65px';
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

  // --- useEffect Hooks ---
  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          navigate('/login');
          return;
        }
        const user = session.user;
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (adminError) {
          navigate('/');
          return;
        }
        if (adminData) {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && isSidebarOpen) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes('/admin/product')) {
      setExpandedSections(prev => ({ ...prev, products: true }));
    }
    if (currentPath.includes('/admin/video')) {
      setExpandedSections(prev => ({ ...prev, videos: true }));
    }
    if (currentPath.includes('/admin/orders')) {
      setExpandedSections(prev => ({ ...prev, orders: true }));
    }
  }, [location.pathname]);

  useEffect(() => {
    let wasHidden = false; 

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (wasHidden) {
          window.location.reload(); 
        }
      } else {
        wasHidden = true; 
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
      }
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // --- Styles Definition ---
  const styles = {
    pageWrapper: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: colors.mainBg,
      fontFamily: fontFamily,
    },
    header: {
      backgroundColor: colors.headerBg,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 25px',
      height: headerHeight,
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1001,
      borderBottom: `1px solid ${colors.borderColor}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    logoContainer: { display: 'flex', alignItems: 'center' },
    logo: { height: '35px', marginRight: '12px', verticalAlign: 'middle' },
    logoText: {
      fontSize: '1.2rem',
      color: colors.headerText,
      fontWeight: '700',
      margin: 0,
    },
    rightHeader: { display: 'flex', alignItems: 'center', gap: '15px' },
    barsIcon: {
      fontSize: '1.6rem',
      background: 'none',
      border: 'none',
      color: colors.headerText,
      cursor: 'pointer',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
    },
    logoutBtn: {
      background: 'transparent',
      color: colors.logoutBtnBg,
      border: `1px solid ${colors.logoutBtnBg}`,
      padding: '9px 18px',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    sidebar: {
      position: 'fixed',
      top: headerHeight,
      left: 0,
      width: sidebarWidth,
      height: `calc(100vh - ${headerHeight})`,
      backgroundColor: colors.sidebarBg,
      color: colors.sidebarLinkText,
      padding: '25px 0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
      overflowY: 'auto',
    },
    sidebarContent: { display: 'flex', flexDirection: 'column', height: '100%' },
    nav: { display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, padding: '0 15px' },
    link: {
      color: colors.sidebarLinkText,
      padding: '13px 20px',
      borderRadius: '6px',
      textAlign: 'left',
      textDecoration: 'none',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'background-color 0.2s ease, color 0.2s ease',
      borderLeft: '4px solid transparent',
      marginLeft: '-4px',
    },
    activeLink: {
      backgroundColor: colors.sidebarLinkActiveBg,
      color: colors.sidebarLinkActiveText,
      fontWeight: '600',
      borderLeft: `4px solid ${colors.activeBorderColor}`,
    },
    sectionHeader: {
      color: colors.sidebarLinkText,
      padding: '13px 20px',
      borderRadius: '6px',
      textAlign: 'left',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      borderLeft: '4px solid transparent',
      marginLeft: '-4px',
    },
    activeSectionHeader: {
      backgroundColor: colors.sidebarLinkHoverBg,
      fontWeight: '600',
    },
    nestedContainer: {
      marginLeft: '10px',
      marginTop: '2px',
      marginBottom: '2px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '0',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
    },
    expandedNestedContainer: {
      maxHeight: '200px',
    },
    nestedLink: {
      color: colors.sidebarLinkText,
      padding: '10px 20px 10px 30px',
      borderRadius: '6px',
      textAlign: 'left',
      textDecoration: 'none',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.92rem',
      transition: 'background-color 0.2s ease, color 0.2s ease',
      borderLeft: '4px solid transparent',
      marginLeft: '-4px',
    },
    activeNestedLink: {
      backgroundColor: colors.sidebarLinkActiveBg,
      color: colors.sidebarLinkActiveText,
      fontWeight: '600',
      borderLeft: `4px solid ${colors.activeBorderColor}`,
    },
    linkIcon: {
      fontSize: '1.2rem',
      width: '22px',
      textAlign: 'center',
      color: colors.iconColor,
      transition: 'color 0.2s ease',
    },
    nestedLinkIcon: {
      fontSize: '1rem',
      width: '18px',
      textAlign: 'center',
      color: colors.iconColor,
      transition: 'color 0.2s ease',
    },
    activeLinkIcon: {
      color: colors.iconActiveColor,
    },
    mobileSidebar: {
      position: 'fixed',
      top: 0,
      left: isSidebarOpen ? '0' : `-${sidebarWidth}`,
      height: '100vh',
      width: sidebarWidth,
      backgroundColor: colors.sidebarBg,
      color: colors.sidebarLinkText,
      padding: '0 0 20px 0',
      zIndex: 1002,
      transition: 'left 0.3s ease-in-out',
      boxShadow: '3px 0 10px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    },
    mobileSidebarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      height: headerHeight,
      borderBottom: `1px solid #374151`,
    },
    mobileLogoContainer: { display: 'flex', alignItems: 'center' },
    mobileLogo: { height: '30px', marginRight: '10px' },
    mobileLogoText: { fontSize: '1.2rem', color: colors.sidebarLinkActiveText, fontWeight: '600', margin: 0 },
    closeIcon: { color: colors.sidebarLinkText, fontSize: '1.8rem', cursor: 'pointer' },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 999,
      opacity: isSidebarOpen ? 1 : 0,
      visibility: isSidebarOpen ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
    },
    main: {
      flex: 1,
      marginTop: headerHeight,
      padding: '35px',
      marginLeft: !isMobile ? sidebarWidth : '0',
      transition: 'margin-left 0.3s ease-in-out',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '1.3rem',
      color: '#4b5563',
      fontFamily: fontFamily,
    },
  };

  if (loading) return <div style={styles.loadingContainer}>Loading Admin Dashboard...</div>;
  if (!isAdmin) return null;

  return (
    <div style={styles.pageWrapper}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          {isMobile ? (
            <button style={styles.barsIcon} onClick={handleToggleSidebar}>
              <FaBars />
            </button>
          ) : (
            <>
              <img src={logo} alt="Logo" style={styles.logo} />
              <h1 style={styles.logoText}>Admin Panel</h1>
            </>
          )}
        </div>
        <div style={styles.rightHeader}>
          {isMobile && <h1 style={{ ...styles.logoText, fontSize: '1.2rem', marginLeft: '10px' }}>Admin</h1>}
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {!isMobile && (
        <aside style={styles.sidebar}>
          <SidebarContent
            styles={styles}
            colors={colors}
            isActive={isActive}
            onLinkClick={closeSidebar}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        </aside>
      )}

      {isMobile && (
        <>
          <div style={styles.overlay} onClick={closeSidebar} />
          <div style={styles.mobileSidebar}>
            <div style={styles.mobileSidebarHeader}>
              <div style={styles.mobileLogoContainer}>
                <img src={logo} alt="Logo" style={styles.mobileLogo} />
                <span style={styles.mobileLogoText}>Menu</span>
              </div>
              <FaTimes style={styles.closeIcon} onClick={closeSidebar} />
            </div>
            <SidebarContent
              styles={styles}
              colors={colors}
              isActive={isActive}
              onLinkClick={closeSidebar}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          </div>
        </>
      )}

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

const SidebarContent = ({ styles, colors, isActive, onLinkClick = () => {}, expandedSections, toggleSection }) => {
  const links = [
    { path: '/admin/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/admin/insights', icon: FaChartLine, label: 'Insights' },
    { path: '/admin/messages', icon: FaEnvelope, label: 'Messages' },
    { path: '/admin/notifysize', icon: FaBell, label: 'Notify Size' },
    { path: '/admin/subscription', icon: FaNewspaper, label: 'Subscription' },
    { path: '/admin/cartleftover', icon: FaOpencart, label: 'Cart Status' },
    { path: '/admin/points', icon: FaGift, label: 'Reward Points' },
    { path: '/admin/heroimage', icon: FaImage, label: 'Home Images' },
  ];

  const sections = {
    orders: {
      icon: FaBoxOpen,
      label: 'Orders',
      items: [
        { path: '/admin/orders', icon: FaListAlt, label: 'Placed Orders' },
        { path: '/admin/international', icon: FaPlane , label: 'International Orders' },
        { path: '/admin/exchange', icon: FaExchangeAlt, label: 'Exchange Orders' },

      ]
    },
    products: {
      icon: FaShoppingCart,
      label: 'Products',
      items: [
        { path: '/admin/products', icon: FaPlusSquare, label: 'Add Products' },
        { path: '/admin/viewproducts', icon: FaRegEye, label: 'View Products' },
      ]
    },
    videos: {
      icon: FaVideo,
      label: 'Videos',
      items: [
        { path: '/admin/video', icon: FaPlusSquare, label: 'Add Video' },
        { path: '/admin/Viewvideo', icon: FaRegEye, label: 'View Videos' },
      ]
    },
    promocode: {
      icon: FaQrcode,
      label: 'Promocodes',
      items: [
        { path: '/admin/promocode', icon: FaPlusSquare, label: 'Add Promo Code' },
        { path: '/admin/viewpromocode', icon: FaRegEye, label: 'View Promo Codes' },
      ]
    }
  };

  return (
    <div style={styles.sidebarContent}>
      <nav style={styles.nav}>
        {links.map(link => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              style={active ? { ...styles.link, ...styles.activeLink } : styles.link}
              onClick={onLinkClick}
            >
              <link.icon style={active ? { ...styles.linkIcon, ...styles.activeLinkIcon } : styles.linkIcon} />
              {link.label}
            </Link>
          );
        })}

        {Object.entries(sections).map(([key, section]) => {
          const anyChildActive = section.items.some(item => isActive(item.path));
          const isExpanded = expandedSections[key];

          return (
            <div key={key}>
              <div
                style={{
                  ...styles.sectionHeader,
                  ...(anyChildActive || isExpanded ? styles.activeSectionHeader : {})
                }}
                onClick={() => toggleSection(key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <section.icon
                    style={anyChildActive ?
                      { ...styles.linkIcon, ...styles.activeLinkIcon } :
                      styles.linkIcon
                    }
                  />
                  {section.label}
                </div>
                {isExpanded ?
                  <FaAngleDown style={{ fontSize: '1rem' }} /> :
                  <FaAngleRight style={{ fontSize: '1rem' }} />
                }
              </div>

              <div style={{
                ...styles.nestedContainer,
                ...(isExpanded ? styles.expandedNestedContainer : {})
              }}>
                {section.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      style={active ?
                        { ...styles.nestedLink, ...styles.activeNestedLink } :
                        styles.nestedLink
                      }
                      onClick={onLinkClick}
                    >
                      <item.icon
                        style={active ?
                          { ...styles.nestedLinkIcon, ...styles.activeLinkIcon } :
                          styles.nestedLinkIcon
                        }
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;