import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from "../pages/Footer";      

const Success = () => {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
      @media (max-width: 768px) {
        .success-container {
          padding-top: 110px !important; /* Increased padding to prevent overlap with logo */
          padding-bottom: 40px !important;
        }
        
        .success-card {
          padding: 30px 20px !important;
        }
        
        .success-title {
          font-size: 2rem !important;
        }
        
        .success-button {
          width: 100% !important;
          padding: 12px 20px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      styleSheet.remove();
    };
  }, []);

  return (
    <div style={styles.pageWrapper}>
      <Navbar showLogo={true} />
      <div style={styles.container} className="success-container">
        <div style={styles.card} className="success-card">
          <h1 style={styles.title} className="success-title"> Order Confirmed!</h1>
          <p style={styles.subtitle}>
            Thank you for your purchase from <strong>NINE9</strong>!
          </p>
          <p style={styles.infoText}>
            Your order has been successfully placed.
          </p>
          <Link to="/">
            <button style={styles.button} className="success-button">Continue Shopping</button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px 30px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Abril Extra Bold', sans-serif", 
    fontSize: '2rem',
    color: '#28a745',
    marginBottom: '20px',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '1.2rem',
    marginBottom: '10px',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    fontWeight: '500',
  },
  infoText: {
    fontSize: '1rem',
    color: '#555',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  button: {
    padding: '14px 28px',
    backgroundColor: 'black',
    color: '#fff',
    border: 'none',
    fontFamily: "'Louvette Semi Bold', sans-serif", 
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  footer: {
    backgroundColor: '#222',
    color: '#fff',
    padding: '20px 0',
    textAlign: 'center',
    fontSize: '0.9rem',
    marginTop: 'auto',
  },
  footerLink: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default Success;