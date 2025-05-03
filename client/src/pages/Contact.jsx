import React, { useState } from 'react'; 
import Navbar from '../components/Navbar'; 
import ToastMessage from '../ToastMessage'; 
import Footer from "../pages/Footer";      
import { supabase } from '../lib/supabase'; 

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [toastMessage, setToastMessage] = useState(null);

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
      console.error(err);
      setToastMessage({ message: 'Failed to send message. Try again later.', type: 'error' });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'black',
      fontFamily: "'Roboto', sans-serif" // Base font for the page
    }}>
      <Navbar showLogo={true} />

      <div style={{
        flex: '1 0 auto'
      }}>
        <section style={{
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: "2.8rem",
            fontFamily: "'Abril Extra Bold', sans-serif", 
            marginBottom: '30px',
            fontWeight: '700',
            color: '#Ffa500',
            marginTop: '50px' 
          }}>Contact Us</h2>
          <form onSubmit={handleSubmit} style={{
            maxWidth: '600px',
            margin: '0 auto',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: "'Roboto', sans-serif" 
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
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions (replacing Roboto)
                  color: '#333' // Default input text color
                }}
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
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions (replacing Roboto)
                  color: '#333'
                }}
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
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions (replacing Roboto)
                  color: '#333'
                }}
                maxLength={10}
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
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: "'Louvette Semi Bold', sans-serif", // Applied to descriptions (replacing Roboto)
                  color: '#333'
                }}
              ></textarea>
            </div>
            <button type="submit" style={{
              padding: '12px 25px',
              backgroundColor: 'white',
              color: 'black',
              fontSize: '15px',
              fontWeight: 'bold',
              fontFamily: "'Abril Extra Bold', sans-serif", // Applied to headings (replacing Roboto)
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'block',
              width: 'fit-content',
              margin: '10px auto 0 auto',
              zIndex: 1001
            }}>
              Send Message
            </button>
          </form>
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
    </div> 
  );
};

export default Contact;