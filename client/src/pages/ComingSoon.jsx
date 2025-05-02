import React, { useState } from 'react';
import { FaWhatsapp, FaInstagram, FaYoutube } from 'react-icons/fa';
import logo from '../assets/nine9_logo.png';

const ComingSoon = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const handleIconMouseEnter = (index) => setHoveredIcon(index);
  const handleIconMouseLeave = () => setHoveredIcon(null);

  const socialIcons = [
    { Icon: FaWhatsapp, href: "https://wa.me/919226331361" },
    { Icon: FaInstagram, href: "https://www.instagram.com/nine9.co.in/?hl=en" },
    { Icon: FaYoutube, href: "https://youtube.com/@life.at.nine9?si=PjEQwxESTGxxbdCv" },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'black', 
      fontFamily: "'Roboto', sans-serif",
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header with Logo */}
      <header style={{
        padding: '20px 30px',
        textAlign: 'left',
        zIndex: 1
      }}>
       <img 
          src={logo} 
          alt="Nine9 Logo" 
          style={{
            height: '80px',
            width: 'auto',
            maxWidth: '150px',
          }} 
        />
      </header>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: '5%',
          left: '5%',
        }}></div>
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          bottom: '10%',
          left: '10%',
        }}></div>
        <div style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: '20%',
          right: '5%',
        }}></div>
        <div style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          top: '10%',
          right: '15%',
        }}></div>
      </div>

      <div style={{
        flex: '1 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 1.5s ease-in-out',
      }}>
        <style>
          {`
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
        <section style={{
          textAlign: 'center',
          maxWidth: '650px',
          width: '90%',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '50px 70px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4), 0 0 30px rgba(255, 165, 0, 0.2)', 
          border: '1px solid rgba(255, 165, 0, 0.5)', 
          '@media (maxWidth: 768px)': {
            padding: '40px 50px',
            maxWidth: '90%',
          },
          '@media (maxWidth: 600px)': {
            padding: '30px 40px',
            margin: '0 15px',
          }
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontFamily: "'Roboto', sans-serif",
            marginBottom: '35px',
            fontWeight: '700',
            color: 'black',
            letterSpacing: '0.5px',
            '@media (maxWidth: 600px)': {
              fontSize: '2rem',
            }
          }}>Opening Soon</h2>
      
          <p style={{
            fontSize: '1rem',
            color: '#666',
            fontFamily: "'Roboto', sans-serif",
            fontWeight: '400',
          }}>
            Dropping May 9th <span style={{ color: '#Ffa500' }}>🔥</span>
          </p>
        </section>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px',
        backgroundColor: 'transparent',
        zIndex: 1,
      }}>
        {socialIcons.map(({ Icon, href }, index) => (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              transition: 'all 0.3s ease',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              ':hover': {
                transform: 'translateY(-5px) scale(1.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 8px rgba(255, 165, 0, 0.3)',
              }
            }}
            onMouseEnter={() => handleIconMouseEnter(index)}
            onMouseLeave={handleIconMouseLeave}
          >
            <Icon
              size={24}
              color={hoveredIcon === index ? "#FFD580" : "white"}
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default ComingSoon;