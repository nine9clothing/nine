import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ToastMessage from '../ToastMessage';
import Footer from "../pages/Footer";
import { supabase } from '../lib/supabase';
import { FaComments, FaHandsHelping, FaLightbulb, FaEnvelope } from "react-icons/fa";

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [toastMessage, setToastMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState({ message: "", type: "" });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const words = [
    <span>Talk <FaComments style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>,
    <span>Collaborate <FaHandsHelping style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>,
    <span>Create <FaLightbulb style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>
  ];
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(wordInterval);
  }, [words.length]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubscribe = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscribeStatus({ message: "Please enter a valid email address", type: "error" });
      return;
    }

    const subscriptionData = {
      email,
      subscription_date: new Date().toISOString(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("subscribers")
        .insert([subscriptionData]);

      if (error) {
        if (error.code === "23505") {
          setSubscribeStatus({ message: "Email already subscribed", type: "error" });
        } else {
          throw error;
        }
      } else {
        setSubscribeStatus({ message: "Thanks for subscribing!", type: "success" });
        setEmail("");
        setTimeout(() => setSubscribeStatus({ message: "", type: "" }), 3000);
      }
    } catch (error) {
      setSubscribeStatus({ message: "Subscription failed. Please try again later.", type: "error" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setForm(prev => ({ ...prev, [name]: digitsOnly.slice(0, 10) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|biz|info|io|co|us|ca|uk|au)$/;
    return re.test(String(email).toLowerCase().trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim()
    };

    if (!trimmedForm.name || !trimmedForm.email || !trimmedForm.phone || !trimmedForm.message) {
      setToastMessage({ message: 'Please fill in all fields.', type: 'error' });
      return;
    }

    if (!validateEmail(trimmedForm.email)) {
      setToastMessage({ message: 'Please enter a valid email address (e.g., example@domain.com).', type: 'error' });
      return;
    }

    if (trimmedForm.phone.length !== 10) {
      setToastMessage({ message: 'Please enter a valid 10-digit phone number.', type: 'error' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: trimmedForm.name,
            email: trimmedForm.email,
            phone: trimmedForm.phone,
            message: trimmedForm.message
          }
        ]);

      if (error) {
        throw error;
      }

      setToastMessage({ message: 'Message sent successfully!', type: 'success' });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setToastMessage({ message: 'Failed to send message. Try again later.', type: 'error' });
    }
  };

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
        flex: '1 0 auto'
      }}>
        <section style={{
          padding: isMobile ? '40px 15px' : '60px 20px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2rem',
            fontFamily: "'Abril Extra Bold', sans-serif",
            marginBottom: '30px',
            fontWeight: '700',
            color: '#Ffa500',
            marginTop: '30px'
          }}>Contact Us</h2>
          <form onSubmit={handleSubmit} style={{
            maxWidth: '600px',
            margin: '0 auto',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: "'Roboto', sans-serif",
            background: 'rgba(255, 255, 255, 0.05)',
            padding: isMobile ? '20px' : '30px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }} noValidate>
            <div style={{
              marginBottom: '20px'
            }}>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '1rem',
                  border: '1px solid #Ffa500',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                  color: '#ffffff',
                  backgroundColor: '#1a1a1a',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#e69500')}
                onBlur={(e) => (e.target.style.borderColor = '#Ffa500')}
              />
            </div>
            <div style={{
              marginBottom: '20px'
            }}>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '1rem',
                  border: '1px solid #Ffa500',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                  color: '#ffffff',
                  backgroundColor: '#1a1a1a',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#e69500')}
                onBlur={(e) => (e.target.style.borderColor = '#Ffa500')}
              />
            </div>
            <div style={{
              marginBottom: '20px'
            }}>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Your Phone Number (10 digits)"
                value={form.phone}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '1rem',
                  border: '1px solid #Ffa500',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                  color: '#ffffff',
                  backgroundColor: '#1a1a1a',
                  transition: 'border-color 0.3s ease'
                }}
                maxLength={10}
                onFocus={(e) => (e.target.style.borderColor = '#e69500')}
                onBlur={(e) => (e.target.style.borderColor = '#Ffa500')}
              />
            </div>
            <div style={{
              marginBottom: '20px'
            }}>
              <textarea
                id="message"
                name="message"
                placeholder="Your Message"
                value={form.message}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '1rem',
                  border: '1px solid #Ffa500',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                  color: '#ffffff',
                  backgroundColor: '#1a1a1a',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#e69500')}
                onBlur={(e) => (e.target.style.borderColor = '#Ffa500')}
              ></textarea>
            </div>
            <button type="submit" style={{
              padding: '12px 25px',
              backgroundColor: '#Ffa500',
              color: 'black',
              fontSize: '15px',
              fontWeight: 'bold',
              fontFamily: "'Abril Extra Bold', sans-serif",
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, transform 0.3s ease',
              display: 'block',
              width: 'fit-content',
              margin: '10px auto 0 auto',
              boxShadow: '0 4px 10px rgba(255, 165, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e69500';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#Ffa500';
              e.target.style.transform = 'scale(1)';
            }}>
              Send Message
            </button>
          </form>
          <div style={{
            maxWidth: '600px',
            margin: '30px auto 0',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 1s ease-in-out',
            fontFamily: "'Louvette Semi Bold', sans-serif"
          }}>
            <p style={{
              color: '#ffffff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              marginBottom: '15px'
            }}>
              Or you can get in touch with us directly:
            </p>
            <p>
              <a 
                href="mailto:connectus.nine9@gmail.com" 
                style={{
                  color: '#Ffa500',
                  textDecoration: 'none',
                  fontSize: isMobile ? '1.1rem' : '1.2rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'color 0.3s ease, transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#e69500';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#Ffa500';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <FaEnvelope style={{ fontSize: isMobile ? '1.2rem' : '1.3rem' }} />
                connectus.nine9@gmail.com
              </a>
            </p>
            <p style={{
              color: '#cccccc',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginTop: '15px'
            }}>
             Hold tight, love! Your message is doing cartwheels in our inbox and We'll slide into yours within 24–48 hours. Pinky promise.            </p>
          </div>
        </section>

        <section
          style={{
            padding: isMobile ? "40px 15px" : "80px 40px",
            background: "black",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            position: "relative",
            minHeight: isMobile ? "350px" : "300px",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: isMobile ? "50%" : "40%",
              transform: "translate(-50%, -50%)",
              color: "#Ffa500",
              opacity: 0.2,
              fontSize: isMobile ? "4rem" : "10rem",
              fontWeight: "900",
              letterSpacing: "5px",
              zIndex: 1,
              pointerEvents: "none",
              textTransform: "uppercase",
              fontFamily: "'Abril Extra Bold', sans-serif",
              width: isMobile ? "100%" : "auto",
              textAlign: isMobile ? "center" : "left",
            }}
          >
            GET IN TOUCH
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              left: isMobile ? "0" : "30%",
              color: "white",
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "600",
              marginBottom: "20px",
              width: isMobile ? "100%" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "center" : "flex-start",
              gap: "10px",
            }}
          >
            <span style={{ fontFamily: "'Abril Extra Bold', sans-serif" }}>Let's</span>
            <span
              key={currentWordIndex}
              style={{
                display: "inline-block",
                color: "#Ffa500",
                animation: "jump 0.5s ease-in-out",
                fontFamily: "'Abril Extra Bold', sans-serif",
              }}
            >
              {words[currentWordIndex]}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: isMobile ? "95%" : "100%",
              left: isMobile ? "0" : "30%",
              maxWidth: "500px",
              background: "rgba(0, 0, 0, 0.1)",
              padding: isMobile ? "20px" : "30px",
              borderRadius: "15px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "15px",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                style={{
                  padding: "12px 20px",
                  fontSize: "1rem",
                  border: "1px solid #Ffa500",
                  borderRadius: "25px",
                  backgroundColor: "#1a1a1a",
                  color: "#ffffff",
                  width: isMobile ? "100%" : "300px",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#e69500")}
                onBlur={(e) => (e.target.style.borderColor = "#Ffa500")}
                required
              />
              <button
                onClick={handleSubscribe}
                style={{
                  padding: "12px 30px",
                  fontSize: "1rem",
                  backgroundColor: "#Ffa500",
                  color: "black",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease, transform 0.3s ease",
                  boxShadow: "0 4px 10px rgba(255, 165, 0, 0.4)",
                  width: isMobile ? "100%" : "auto",
                  fontFamily: "'Abril Extra Bold', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e69500";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#Ffa500";
                  e.target.style.transform = "scale(1)";
                }}
              >
                Join In
              </button>
            </div>
            {subscribeStatus.message && (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: subscribeStatus.type === "success" ? "#4caf50" : "#f44336",
                  marginTop: "10px",
                  transition: "opacity 0.3s ease",
                  fontFamily: "'Louvette Semi Bold', sans-serif",
                }}
              >
                {subscribeStatus.message}
              </p>
            )}
            <p style={{
              fontSize: isMobile ? "0.8rem" : "0.9rem",
              color: "#cccccc",
              marginTop: "15px",
              fontFamily: "'Louvette Semi Bold', sans-serif"
            }}>
              Own your Story. Wear your Art. Join the Tribe.
            </p>
          </div>
        </section>
      </div>

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <Footer />

      <style>
        {`
          @keyframes jump {
            0% { transform: translateY(0); opacity: 1; filter: drop-shadow(0 0 0 #FFA500); }
            50% { transform: translateY(-8px); opacity: 0.8; filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); }
            100% { transform: translateY(0); opacity: 1; filter: drop-shadow(0 0 3px #FFA500); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Contact;