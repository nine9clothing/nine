import React, { useState } from 'react';
import logo from '../assets/nine9_logo.png';
import { FaWhatsapp } from 'react-icons/fa'; 
import { Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const handleMouseEnter = (index) => setHoveredLink(index);
  const handleMouseLeave = () => setHoveredLink(null);

  const handleIconMouseEnter = (index) => setHoveredIcon(index);
  const handleIconMouseLeave = () => setHoveredIcon(null);

  const links = [
    { href: "/faq", label: "FAQs" },
    { href: "/shippingpolicy", label: "Shipping" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/t&c", label: "Privacy & Policy" },
    { href: "/exchange", label: "Exchange Policy" },

  ];

  const socialIcons = [
    { Icon: FaWhatsapp, href: "https://wa.me/919226331361" },
    { Icon: Instagram, href: "https://www.instagram.com/nine9.co.in/?hl=en" },
    { Icon: Youtube, href: "https://youtube.com/@life.at.nine9?si=PjEQwxESTGxxbdCv" },
  ];

  return (
    <footer style={styles.footer}>
      <div style={styles.line}></div>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <img src={logo} alt="Logo" style={styles.logo} />
          <div style={styles.socialIcons}>
            {socialIcons.map(({ Icon, href }, index) => (
              <a
                key={index}
                href={href}
                style={{
                  ...styles.iconLink,
                  ...(hoveredIcon === index ? styles.iconHover : {}),
                }}
                onMouseEnter={() => handleIconMouseEnter(index)}
                onMouseLeave={handleIconMouseLeave}
              >
                <Icon
                  size={20}
                  color={hoveredIcon === index ? "#FFD580" : "#FFA500"}
                />
              </a>
            ))}
          </div>
        </div>

        <div style={styles.rightSection}>
          {links.map((link, index) => (
            <div key={index} style={styles.linkContainer}>
              <a
                href={link.href}
                style={{
                  ...styles.link,
                  ...(hoveredLink === index ? styles.linkHover : {}),
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "40px 0",
    fontFamily: "'Roboto', sans-serif",
    marginTop: "auto",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  line: {
    height: "2px",
    width: "100%",
    backgroundColor: "#FFA500",
    marginBottom: "20px",
  },
  leftSection: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    paddingTop: "1px",
  },
  logo: {
    width: "140px",
    marginBottom: "10px",
    borderRadius: "6px",
  },
  socialIcons: {
    display: "flex",
    gap: "15px",
    marginTop: "5px",
  },
  iconLink: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    padding: "2px",
    borderRadius: "50%",
    marginLeft: "10px",
    backgroundColor: "transparent",
  },
  iconHover: {
    transform: "translateY(-5px) scale(1.15)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 8px rgba(255, 165, 0, 0.3)",
  },
  rightSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
    justifyContent: "center",
    paddingTop: "10px",
    height: "140px",
  },
  linkContainer: {
    margin: "0",
  },
  link: {
    color: "#FFA500",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.3s ease",
    fontWeight: "500",
    letterSpacing: "0.5px",
    fontFamily: "'Louvette Semi Bold', sans-serif",
  },
  linkHover: {
    color: "#FFD580",
  },
};

export default Footer;