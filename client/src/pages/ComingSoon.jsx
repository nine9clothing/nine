import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaInstagram, FaYoutube } from 'react-icons/fa';
import logo from '../assets/nine9_logo.png';

const ComingSoon = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const handleIconMouseEnter = (index) => setHoveredIcon(index);
  const handleIconMouseLeave = () => setHoveredIcon(null);

  const targetDate = new Date('2025-05-09T21:00:00+05:30').getTime(); // 9 PM IST

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const socialIcons = [
    { Icon: FaWhatsapp, href: 'https://wa.me/919226331361', name: 'WhatsApp' },
    { Icon: FaInstagram, href: 'https://www.instagram.com/nine9.co.in/?hl=en', name: 'Instagram' },
    { Icon: FaYoutube, href: 'https://youtube.com/@life.at.nine9?si=PjEQwxESTGxxbdCv', name: 'YouTube' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        fontFamily: "'Roboto', sans-serif",
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with Logo */}
      <header
        style={{
          padding: '15px 20px',
          textAlign: 'left',
          zIndex: 2,
        }}
      >
        <img
          src={logo}
          alt="Nine9 Logo"
          style={{
            height: '60px',
            width: 'auto',
            maxWidth: '120px',
            transition: 'transform 0.3s ease',
            objectFit: 'contain',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </header>

      {/* Background Decorative Elements */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255, 165, 0, 0.15) 0%, rgba(255, 165, 0, 0) 70%)',
            borderRadius: '50%',
            top: '5%',
            left: '5%',
            animation: 'pulse 10s infinite ease-in-out',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
            borderRadius: '50%',
            bottom: '10%',
            left: '10%',
            animation: 'pulse 12s infinite ease-in-out',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(255, 165, 0, 0.1) 0%, rgba(255, 165, 0, 0) 70%)',
            borderRadius: '50%',
            top: '20%',
            right: '5%',
            animation: 'pulse 8s infinite ease-in-out',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)',
            borderRadius: '50%',
            top: '10%',
            right: '15%',
            animation: 'pulse 14s infinite ease-in-out',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: '1 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 1.5s ease-in-out',
        }}
      >
        <style>
          {`
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes numberPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}
        </style>
        <section
          style={{
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4), 0 0 30px rgba(255, 165, 0, 0.2)',
            border: '2px solid rgba(255, 165, 0, 0.6)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              '0 6px 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.3)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              '0 4px 15px rgba(255, 165, 0, 0.4), 0 0 30px rgba(255, 165, 0, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <h2
            style={{
              fontSize: '2.5rem',
              fontFamily: "'Roboto', sans-serif",
              marginBottom: '20px',
              fontWeight: '900',
              color: '#1a1a1a',
              letterSpacing: '1px',
            }}
          >
            Opening Soon
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              margin: '15px 0',
            }}
          >
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map(({ value, label }, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 165, 0, 0.4)',
                  minWidth: '70px',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(255, 165, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#Ffa500',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    animation: 'numberPulse 2s infinite ease-in-out',
                  }}
                >
                  {value.toString().padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    fontWeight: '500',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#666',
              fontFamily: "'Roboto', sans-serif",
              fontWeight: '400',
              marginTop: '15px',
            }}
          >
            Get Ready for Something Epic! <span style={{ color: '#Ffa500' }}>🔥</span>
          </p>
        </section>
      </div>

      {/* Social Icons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          padding: '15px',
          backgroundColor: 'transparent',
          zIndex: 2,
        }}
      >
        {socialIcons.map(({ Icon, href, name }, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow us on ${name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                transition: 'all 0.4s ease',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                touchAction: 'manipulation',
              }}
              onMouseEnter={() => handleIconMouseEnter(index)}
              onMouseLeave={handleIconMouseLeave}
              onTouchStart={() => handleIconMouseEnter(index)}
              onTouchEnd={() => setTimeout(handleIconMouseLeave, 500)}
            >
              <Icon
                size={24}
                color={hoveredIcon === index ? '#FFD580' : 'white'}
                style={{ transition: 'color 0.3s ease' }}
              />
            </a>
            {hoveredIcon === index && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  zIndex: 3,
                }}
              >
                {name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Responsive Styles */}
      <style>
        {`
          @media (max-width: 768px) {
            header {
              padding: 10px 15px;
            }
            section {
              padding: 30px;
              maxWidth: 95%;
              border-radius: 10px;
            }
            h2 {
              fontSize: 2rem;
              margin-bottom: 20px;
            }
            div[style*="gap: 10px"] {
              gap: 8px;
            }
            div[style*="gap: 10px"] > div {
              minWidth: 65px;
              padding: 10px 12px;
            }
            div[style*="gap: 10px"] > div span:first-child {
              font-size: 1.6rem;
            }
            div[style*="gap: 10px"] > div span:last-child {
              font-size: 0.8rem;
            }
            p {
              fontSize: 1rem;
              margin-top: 10px;
            }
            img {
              height: 50px;
              maxWidth: 100px;
            }
            div[style*="gap: 20px"] {
              gap: 15px;
              padding: 10px;
            }
            a {
              width: 40px;
              height: 40px;
            }
            a svg {
              width: 22px;
              height: 22px;
            }
            /* Reduce decorative element sizes */
            div[style*="width: 200px"] { width: 150px; height: 150px; }
            div[style*="width: 150px"] { width: 120px; height: 120px; }
            div[style*="width: 180px"] { width: 140px; height: 140px; }
            div[style*="width: 120px"] { width: 100px; height: 100px; }
          }
          @media (max-width: 480px) {
            header {
              padding: 8px 10px;
            }
            section {
              padding: 20px;
              margin: 0 5px;
              border-radius: 8px;
            }
            h2 {
              fontSize: 1.6rem;
              margin-bottom: 15px;
            }
            div[style*="gap: 10px"] {
              gap: 6px;
            }
            div[style*="gap: 10px"] > div {
              minWidth: 55px;
              padding: 8px 10px;
            }
            div[style*="gap: 10px"] > div span:first-child {
              font-size: 1.4rem;
            }
            div[style*="gap: 10px"] > div span:last-child {
              font-size: 0.75rem;
            }
            p {
              fontSize: 0.9rem;
              margin-top: 8px;
            }
            img {
              height: 45px;
              maxWidth: 90px;
            }
            div[style*="gap: 20px"] {
              gap: 12px;
              padding: 8px;
            }
            a {
              width: 36px;
              height: 36px;
            }
            a svg {
              width: 20px;
              height: 20px;
            }
            span[style*="position: absolute"] {
              font-size: 0.7rem;
              padding: 3px 6px;
              bottom: 45px;
            }
            /* Further reduce decorative element sizes */
            div[style*="width: 200px"] { width: 120px; height: 120px; }
            div[style*="width: 150px"] { width: 100px; height: 100px; }
            div[style*="width: 180px"] { width: 110px; height: 110px; }
            div[style*="width: 120px"] { width: 80px; height: 80px; }
            /* Disable heavy animations on mobile */
            div[style*="animation: pulse"] {
              animation: none;
            }
            span[style*="animation: numberPulse"] {
              animation: none;
            }
            /* Disable hover effects on mobile */
            div[style*="transition: transform 0.3s ease, box-shadow 0.3s ease"] {
              pointer-events: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ComingSoon;