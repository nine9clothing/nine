// src/pages/About.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import logo from '../assets/nine9_logo.png';

const About = () => {
  const styles = {
    wrapper: {
      position: 'relative',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      backgroundColor: 'black',
    },
    movingBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 0,
      animation: 'scrollUp 20s linear infinite', 
      whiteSpace: 'nowrap',
    },
    bgText: {
      fontSize: '4rem', 
      fontWeight: 'bold',
      opacity: 0.2, 
      color: '#Ffa500', 
      textTransform: 'uppercase',
      lineHeight: '1.9',
      width: '100%',
      display: 'inline-block',
      textAlign: 'center',
      fontFamily: '"Abril Extra Bold", sans-serif'
    },
    contentSection: {
      position: 'relative',
      zIndex: 2,
      padding: '100px 20px 40px',
      maxWidth: '900px',
      margin: '0 auto',
      textAlign: 'center',
    },
    heading: {
      fontSize: "2rem",
      fontWeight: '900',
      marginBottom: '30px',
      fontFamily: '"Abril Extra Bold", sans-serif', 
      color: '#Ffa500', 
      textShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)', 
    },
    paragraph: {
      fontFamily: '"Louvette Semi Bold", sans-serif', 
      fontSize: '1.1rem', 
      color: '#f1f1f1', 
      lineHeight: '1.9',
      marginBottom: '20px',
      fontWeight: '300', 
      letterSpacing: '0.8px', 
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.4)', 
      maxWidth: '800px',
      margin: '0 auto 20px auto', 
      textAlign: 'justify', 
    },
    links: {
      marginTop: "10px",
    },
    link: {
      color: "#Ffa500",
      textDecoration: "none",
      margin: "0 10px",
      fontSize: "14px",
      fontFamily: '"Louvette Semi Bold", sans-serif' 
    },
    separator: {
      color: "#fff",
      margin: "0 5px",
    },
    keyframes: `
      @keyframes scrollUp {
        0% { transform: translateY(100%); }
        100% { transform: translateY(-100%); }
      }
    `,
  };

  if (typeof document !== 'undefined') {
    if (!document.getElementById('about-keyframes')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'about-keyframes';
      styleTag.innerHTML = styles.keyframes;
      document.head.appendChild(styleTag);
    }
  }

  return (
    <div style={styles.wrapper}>
      <Navbar showLogo={true} />
      
      <div style={styles.movingBackground}>
        {[
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",
          "MADE BY ARTIST, FOR SOULS WHO WEAR ART",

        ].map((line, idx) => (
          <div key={idx} style={styles.bgText}>{line}</div>
        ))}
      </div>

      {/* Foreground Content */}
      <section style={styles.contentSection}>
        <h1 style={styles.heading}>About Us</h1>
        <p style={styles.paragraph}>
          <strong>nine9</strong> is a home-grown Indian brand born from the minds of young, bold, and creative individuals who believe fashion should be more than just a trend — it should be a true reflection of <em>you</em>.
        </p>
        <p style={styles.paragraph}>
          At <strong>nine9</strong>, we don’t just make clothes. Our pieces go beyond style — they tell a story. Each design is carefully crafted with meaning, creativity, and a personal touch, making sure you feel seen, heard, and valued.
        </p>
        <p style={styles.paragraph}>
          Because to us, your style isn’t just fashion — it’s your art. Every Nine9 piece carries a story — handcrafted with soul, shaped by intention and infused with the kind of creativity that speaks <em>you</em>.
        </p>

        <img src={logo} alt="Logo" style={{ width: '350px', height: 'auto', borderRadius: '8px' }} />

        <footer style={styles.footer}>
          <div style={styles.line}></div> 
          <div style={styles.links}>
            <a href="/shippingpolicy" style={styles.link}>Shipping</a>
            <span style={styles.separator}>|</span>
            <a href="/t&c" style={styles.link}>Privacy & Policy</a>
            <span style={styles.separator}>|</span>
            <a href="/faq" style={styles.link}>FAQs</a>
            <span style={styles.separator}>|</span>
            <a href="/exchange" style={styles.link}>Exchange Policy</a> 
          </div>
        </footer>
      </section>
    </div>
  );
};

export default About;