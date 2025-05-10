// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from '../components/Navbar';
// import { supabase } from '../lib/supabase.js';
// import ToastMessage from '../ToastMessage';
// import Footer from "../pages/Footer";

// const Login = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [useOtp, setUseOtp] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [birthday, setBirthday] = useState('');
//   const [regPhone, setRegPhone] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [toastMessage, setToastMessage] = useState(null);
//   const navigate = useNavigate();
//   const [hoveredLink, setHoveredLink] = useState(null);

//   // Real-time auth state listener
//   useEffect(() => {
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (event === 'SIGNED_IN' && session?.user) {
//         const user = session.user;
//         const { data: isAdmin } = await supabase
//           .from('admins')
//           .select('*')
//           .eq('id', user.id)
//           .single();
//         if (isAdmin) {
//           setToastMessage({ message: "Welcome, Admin!", type: "success" });
//           navigate('/admin/dashboard');
//         } else {
//           setToastMessage({ message: "Logged in successfully!", type: "success" });
//           navigate('/');
//         }
//       }
//     });
//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   const checkEmailExists = async (email) => {
//     try {
//       const { data, error } = await supabase
//         .from('registered_details')
//         .select('*')
//         .eq('email', email)
//         .single();
//       return !!data && !error;
//     } catch {
//       return false;
//     }
//   };

//   const handleAuth = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!email.trim()) {
//       setToastMessage({ message: "Email is required.", type: "error" });
//       setLoading(false);
//       return;
//     }

//     if (isLogin && !useOtp && !password) {
//       setToastMessage({ message: "Password is required.", type: "error" });
//       setLoading(false);
//       return;
//     }

//     if (!isLogin) {
//       if (!fullName.trim()) {
//         setToastMessage({ message: "Name is required.", type: "error" });
//         setLoading(false);
//         return;
//       }
//       if (!birthday.trim()) {
//         setToastMessage({ message: "Birthday is required.", type: "error" });
//         setLoading(false);
//         return;
//       }
//       if (!regPhone.trim()) {
//         setToastMessage({ message: "Phone Number is required.", type: "error" });
//         setLoading(false);
//         return;
//       }
//       if (!password) {
//         setToastMessage({ message: "Password is required.", type: "error" });
//         setLoading(false);
//         return;
//       }
//       const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
//       if (!passwordRegex.test(password)) {
//         setToastMessage({
//           message: "Password must be at least 8 characters long and contain at least one letter, one number, and one special symbol",
//           type: "error",
//         });
//         setLoading(false);
//         return;
//       }
//     }

//     try {
//       if (isLogin) {
//         if (useOtp) {
//           const exists = await checkEmailExists(email);
//           if (!exists) {
//             setToastMessage({ message: "Email not found. Please register first.", type: "error" });
//             setLoading(false);
//             return;
//           }
//           const { error } = await supabase.auth.signInWithOtp({
//             email,
//             options: {
//               emailRedirectTo: window.location.origin,
//             },
//           });
//           if (error) {
//             setToastMessage({ message: error.message, type: "error" });
//           } else {
//             setToastMessage({
//               message: "OTP link sent to your email. Please click the link to complete login.",
//               type: "success",
//             });
//           }
//           setLoading(false);
//           return;
//         } else {
//           const { error } = await supabase.auth.signInWithPassword({ email, password });
//           if (error) {
//             setToastMessage({ message: error.message, type: "error" });
//             setLoading(false);
//             return;
//           }
//           const { data: sessionData } = await supabase.auth.getSession();
//           const user = sessionData?.session?.user;
//           if (user) {
//             const { data: isAdmin } = await supabase
//               .from('admins')
//               .select('*')
//               .eq('id', user.id)
//               .single();
//             if (isAdmin) {
//               setToastMessage({ message: "Welcome, Admin!", type: "success" });
//               navigate('/admin/dashboard');
//             } else {
//               setToastMessage({ message: "Logged in successfully!", type: "success" });
//               navigate('/');
//             }
//           } else {
//             setToastMessage({ message: "Login failed to retrieve user session.", type: "error" });
//           }
//         }
//       } else {
//         const { data, error } = await supabase.auth.signUp({
//           email,
//           password,
//           options: {
//             data: {
//               display_name: fullName,
//               phone: regPhone,
//               birthday: birthday,
//             },
//           },
//         });
//         if (error) {
//           setToastMessage({ message: "SignUp Error: " + error.message, type: "error" });
//           setLoading(false);
//           return;
//         }

//         const userId = data.user?.id;
//         if (!userId) {
//           setToastMessage({ message: "Registration succeeded but no user ID was returned.", type: "error" });
//           setLoading(false);
//           return;
//         }

//         const { error: insertError } = await supabase.from('registered_details').insert([
//           {
//             id: userId,
//             email,
//             full_name: fullName,
//             phone: regPhone,
//             birthday,
//           },
//         ]);
//         if (insertError) {
//           setToastMessage({ message: "Failed to store registration details.", type: "error" });
//         } else {
//           setToastMessage({
//             message: "Registration successful! Please verify your email before logging in.",
//             type: "success",
//           });
//         }
//       }
//     } catch (err) {
//       setToastMessage({ message: err.message, type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleForgotPassword = async () => {
//     if (!email.trim()) {
//       setToastMessage({ message: 'Please enter your email address first.', type: "error" });
//       return;
//     }
//     try {
//       const { error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: window.location.origin + '/resetpassword',
//       });
//       if (error) {
//         setToastMessage({ message: error.message, type: "error" });
//       } else {
//         setToastMessage({ message: 'Password reset email sent!', type: "success" });
//       }
//     } catch (err) {
//       setToastMessage({ message: err.message, type: "error" });
//     }
//   };

//   return (
//     <div style={{ fontFamily: "'Roboto', sans-serif" }}>
//       <Navbar showLogo={true} />
//       <div style={containerStyle}>
//         <div style={cardStyle}>
//           <h2 style={headingStyle}>{isLogin ? 'Login' : 'Register'}</h2>
//           <form onSubmit={handleAuth} style={formStyle}>
//             <label htmlFor="email" style={labelStyle}>Email</label>
//             <input
//               id="email"
//               type="email"
//               placeholder="e.g. john@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               style={inputStyle}
//             />

//             {isLogin && !useOtp && (
//               <>
//                 <label htmlFor="password" style={labelStyle}>Password</label>
//                 <input
//                   id="password"
//                   type="password"
//                   placeholder="e.g. Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   style={inputStyle}
//                 />
//               </>
//             )}

//             {!isLogin && (
//               <>
//                 <label htmlFor="fullName" style={labelStyle}>Name</label>
//                 <input
//                   id="fullName"
//                   type="text"
//                   placeholder="e.g. John Doe"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   style={inputStyle}
//                 />

//                 <label htmlFor="birthday" style={labelStyle}>Birthday</label>
//                 <input
//                   id="birthday"
//                   type="date"
//                   value={birthday}
//                   onChange={(e) => setBirthday(e.target.value)}
//                   style={inputStyle}
//                   max={new Date().toISOString().split("T")[0]}
//                 />

//                 <label htmlFor="phone" style={labelStyle}>Phone Number</label>
//                 <input
//                   id="phone"
//                   type="tel"
//                   placeholder="e.g. 1234567890"
//                   value={regPhone}
//                   onChange={(e) => setRegPhone(e.target.value)}
//                   style={inputStyle}
//                 />

//                 <label htmlFor="regPassword" style={labelStyle}>Set Password</label>
//                 <input
//                   id="regPassword"
//                   type="password"
//                   placeholder="e.g. Abc123!@#"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   style={inputStyle}
//                 />
//               </>
//             )}

//             {isLogin && (
//               <div style={forgotPasswordStyle}>
//                 <button
//                   type="button"
//                   onClick={handleForgotPassword}
//                   style={{
//                     ...linkButton,
//                     ...(hoveredLink === 'forgot' ? hoverLinkStyle : {})
//                   }}
//                   onMouseEnter={() => setHoveredLink('forgot')}
//                   onMouseLeave={() => setHoveredLink(null)}
//                 >
//                   Forgot Password?
//                 </button>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={loading}
//               style={{
//                 ...buttonStyle,
//                 ...(hoveredLink === 'submit' ? hoverButtonStyle : {})
//               }}
//               onMouseEnter={() => setHoveredLink('submit')}
//               onMouseLeave={() => setHoveredLink(null)}
//             >
//               {loading
//                 ? isLogin
//                   ? (useOtp ? 'Sending OTP...' : 'Logging in...')
//                   : 'Registering...'
//                 : isLogin
//                 ? (useOtp ? 'Send OTP Link' : 'Login')
//                 : 'Register'}
//             </button>
//           </form>

//           {isLogin && (
//             <div style={{ marginTop: '10px' }}>
//               <button
//                 onClick={() => setUseOtp(!useOtp)}
//                 style={{
//                   ...linkButton,
//                   ...(hoveredLink === 'otpSwitch' ? hoverLinkStyle : {})
//                 }}
//                 onMouseEnter={() => setHoveredLink('otpSwitch')}
//                 onMouseLeave={() => setHoveredLink(null)}
//               >
//                 {useOtp ? 'Switch to Password Login' : 'Switch to OTP Login'}
//               </button>
//             </div>
//           )}

//           <div style={{ marginTop: '20px' }}>
//             <button
//               onClick={() => setIsLogin(!isLogin)}
//               style={{
//                 ...linkButton,
//                 ...(hoveredLink === 'authSwitch' ? hoverLinkStyle : {})
//               }}
//               onMouseEnter={() => setHoveredLink('authSwitch')}
//               onMouseLeave={() => setHoveredLink(null)}
//             >
//               {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
//             </button>
//           </div>
//         </div>
//       </div>
//       <Footer/>

//       {toastMessage && (
//         <ToastMessage
//           message={toastMessage.message}
//           type={toastMessage.type}
//           onClose={() => setToastMessage(null)}
//         />
//       )}
//     </div>
//   );
// };

// const containerStyle = {
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   minHeight: '100vh',
//   background: 'black',
//   padding: '20px',
// };

// const cardStyle = {
//   backgroundColor: 'white',
//   padding: '40px',
//   borderRadius: '8px',
//   boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
//   maxWidth: '400px',
//   width: '100%',
// };

// const headingStyle = {
//   fontSize: '2rem',
//   marginBottom: '20px',
//   textAlign: 'center',
//   color: 'black',
//   fontFamily: "'Abril Extra Bold', sans-serif" // Applied to headings
// };

// const formStyle = {
//   display: 'flex',
//   flexDirection: 'column',
// };

// const labelStyle = {
//   marginBottom: '5px',
//   fontSize: '0.9rem',
//   color: '#333',
//   fontFamily: "'Louvette Semi Bold', sans-serif" // Applied to descriptions
// };

// const inputStyle = {
//   width: '100%',
//   padding: '12px 15px',
//   marginBottom: '15px',
//   fontSize: '1rem',
//   borderRadius: '4px',
//   border: '1px solid #ddd',
//   transition: 'all 0.3s ease',
//   fontFamily: "'Louvette Semi Bold', sans-serif" // Applied to descriptions
// };

// const buttonStyle = {
//   width: '100%',
//   padding: '12px',
//   backgroundColor: 'black',
//   color: '#fff',
//   fontSize: '1rem',
//   cursor: 'pointer',
//   border: 'none',
//   borderRadius: '50px',
//   transition: 'background-color 0.3s ease',
//   fontFamily: "'Abril Extra Bold', sans-serif" // Applied to headings
// };

// const hoverButtonStyle = {
//   backgroundColor: '#333',
//   transform: 'translateY(-2px)',
//   boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
// };

// const linkButton = {
//   background: 'none',
//   border: 'none',
//   color: 'black',
//   cursor: 'pointer',
//   fontSize: '0.9rem',
//   transition: 'all 0.3s ease',
//   fontFamily: "'Louvette Semi Bold', sans-serif" // Applied to descriptions
// };

// const hoverLinkStyle = {
//   color: '#ff8c00',
// };

// const forgotPasswordStyle = {
//   textAlign: 'right',
//   marginBottom: '15px',
// };

// export default Login;

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import ToastMessage from '../ToastMessage';
import { AuthContext } from '../context/AuthContext'; 
import Footer from './Footer';

const Login = () => {
  const { user, loading } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [useOtp, setUseOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data: isAdmin }) => {
          if (isAdmin) {
            setToastMessage({ message: 'Welcome, Admin!', type: 'success' });
            navigate('/admin/dashboard');
          } else {
            setToastMessage({ message: 'Logged in successfully!', type: 'success' });
            navigate('/');
          }
        })
        .catch((err) => {
          console.error('Error checking admin status:', err.message);
        });
    }
  }, [user, loading, navigate]);

  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .from('registered_details')
        .select('*')
        .eq('email', email)
        .single();
      return !!data && !error;
    } catch {
      return false;
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);

    if (!email.trim()) {
      setToastMessage({ message: 'Email is required.', type: 'error' });
      setLoadingAuth(false);
      return;
    }

    if (isLogin && !useOtp && !password) {
      setToastMessage({ message: 'Password is required.', type: 'error' });
      setLoadingAuth(false);
      return;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setToastMessage({ message: 'Name is required.', type: 'error' });
        setLoadingAuth(false);
        return;
      }
      if (!birthday.trim()) {
        setToastMessage({ message: 'Birthday is required.', type: 'error' });
        setLoadingAuth(false);
        return;
      }
      if (!regPhone.trim()) {
        setToastMessage({ message: 'Phone Number is required.', type: 'error' });
        setLoadingAuth(false);
        return;
      }
      if (!password) {
        setToastMessage({ message: 'Password is required.', type: 'error' });
        setLoadingAuth(false);
        return;
      }
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(password)) {
        setToastMessage({
          message:
            'Password must be at least 8 characters long and contain at least one letter, one number, and one special symbol',
          type: 'error',
        });
        setLoadingAuth(false);
        return;
      }
    }

    try {
      if (isLogin) {
        if (useOtp) {
          const exists = await checkEmailExists(email);
          if (!exists) {
            setToastMessage({ message: 'Email not found. Please register first.', type: 'error' });
            setLoadingAuth(false);
            return;
          }
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) {
            setToastMessage({ message: error.message, type: 'error' });
          } else {
            setToastMessage({
              message: 'OTP link sent to your email. Please click the link to complete login.',
              type: 'success',
            });
          }
          setLoadingAuth(false);
          return;
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            setToastMessage({ message: error.message, type: 'error' });
            setLoadingAuth(false);
            return;
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName,
              phone: regPhone,
              birthday: birthday,
            },
          },
        });
        if (error) {
          setToastMessage({ message: 'SignUp Error: ' + error.message, type: 'error' });
          setLoadingAuth(false);
          return;
        }

        const userId = data.user?.id;
        if (!userId) {
          setToastMessage({ message: 'Registration succeeded but no user ID was returned.', type: 'error' });
          setLoadingAuth(false);
          return;
        }

        const { error: insertError } = await supabase.from('registered_details').insert([
          {
            id: userId,
            email,
            full_name: fullName,
            phone: regPhone,
            birthday,
          },
        ]);
        if (insertError) {
          setToastMessage({ message: 'Failed to store registration details.', type: 'error' });
        } else {
          setToastMessage({ message: 'Registration successful!', type: 'success' });
        }
      }
    } catch (err) {
      setToastMessage({ message: err.message, type: 'error' });
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setToastMessage({ message: 'Please enter your email address first.', type: 'error' });
      return;
    }
    const exists = await checkEmailExists(email);
    if (!exists) {
      setToastMessage({ message: 'Email not found. Please register first.', type: 'error' });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/resetpassword',
      });
      if (error) {
        setToastMessage({ message: error.message, type: 'error' });
      } else {
        setToastMessage({ message: 'Password reset email sent!', type: 'success' });
      }
    } catch (err) {
      setToastMessage({ message: err.message, type: 'error' });
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'black',
    padding: '20px',
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px',
    width: '100%',
  };

  const headingStyle = {
    fontSize: '2rem',
    marginTop: '10px',
    marginBottom: '20px',
    textAlign: 'center',
    color: 'black',
    fontFamily: "'Abril Extra Bold', sans-serif",
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const labelStyle = {
    marginBottom: '5px',
    fontSize: '0.9rem',
    color: '#333',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  };

  const inputContainerStyle = {
    position: 'relative',
    width: '100%',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 80px 12px 15px', // Extra padding for text toggle
    marginBottom: '15px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    transition: 'all 0.3s ease',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  };

  const togglePasswordStyle = {
    position: 'absolute',
    right: '10px',
    top: '55%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#333',
    padding: '5px 10px',
    fontFamily: "'Louvette Semi Bold', sans-serif",
    touchAction: 'manipulation', 
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'black',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '50px',
    transition: 'background-color 0.3s ease',
    fontFamily: "'Abril Extra Bold', sans-serif",
  };

  const hoverButtonStyle = {
    backgroundColor: '#333',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  const linkButton = {
    background: 'none',
    border: 'none',
    color: 'black',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    fontFamily: "'Louvette Semi Bold', sans-serif",
  };

  const hoverLinkStyle = {
    color: '#ff8c00',
  };

  const forgotPasswordStyle = {
    textAlign: 'right',
    marginBottom: '15px',
  };

  // Responsive styles and disable browser's default eye icon
  const styles = `
    /* Disable browser's default password reveal icon */
    input[type="password"]::-ms-reveal,
    input[type="password"]::-ms-clear {
      display: none;
    }
    /* General reset for other browsers */
    input[type="password"] {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    @media (max-width: 600px) {
      .card {
        padding: 20px;
        max-width: 90%;
      }
      .heading {
        font-size: 1.5rem;
      }
      .input {
        font-size: 0.9rem;
        padding: 10px 70px 10px 12px; /* Adjust for toggle */
      }
      .toggle-password {
        font-size: 0.8rem;
        padding: 5px 8px;
      }
      .button {
        font-size: 0.9rem;
        padding: 10px;
      }
    }
  `;

  return (
    <div style={{ fontFamily: "'Roboto', sans-serif" }}>
      <style>{styles}</style>
      <Navbar showLogo={true} />
      <div style={containerStyle}>
        <div style={cardStyle} className="card">
          <h2 style={headingStyle} className="heading">{isLogin ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuth} style={formStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              className="input"
            />

            {isLogin && !useOtp && (
              <div style={inputContainerStyle}>
                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="input"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  style={togglePasswordStyle}
                  className="toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            )}

            {!isLogin && (
              <>
                <label htmlFor="fullName" style={labelStyle}>
                  Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  className="input"
                />

                <label htmlFor="birthday" style={labelStyle}>
                  Birthday
                </label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  style={inputStyle}
                  max={new Date().toISOString().split('T')[0]}
                  className="input"
                />

                <label htmlFor="phone" style={labelStyle}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 1234567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={inputStyle}
                  className="input"
                />

                <div style={inputContainerStyle}>
                  <label htmlFor="regPassword" style={labelStyle}>
                    Set Password
                  </label>
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="e.g. Abc123!@#"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    style={togglePasswordStyle}
                    className="toggle-password"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </>
            )}

            {isLogin && (
              <div style={forgotPasswordStyle}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    ...linkButton,
                    ...(hoveredLink === 'forgot' ? hoverLinkStyle : {}),
                  }}
                  onMouseEnter={() => setHoveredLink('forgot')}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAuth}
              style={{
                ...buttonStyle,
                ...(hoveredLink === 'submit' ? hoverButtonStyle : {}),
              }}
              onMouseEnter={() => setHoveredLink('submit')}
              onMouseLeave={() => setHoveredLink(null)}
              className="button"
            >
              {loadingAuth
                ? isLogin
                  ? useOtp
                    ? 'Sending OTP...'
                    : 'Logging in...'
                  : 'Registering...'
                : isLogin
                ? useOtp
                  ? 'Send OTP Link'
                  : 'Login'
                : 'Register'}
            </button>
          </form>

          {isLogin && (
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setUseOtp(!useOtp)}
                style={{
                  ...linkButton,
                  ...(hoveredLink === 'otpSwitch' ? hoverLinkStyle : {}),
                }}
                onMouseEnter={() => setHoveredLink('otpSwitch')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {useOtp ? 'Switch to Password Login' : 'Switch to OTP Login'}
              </button>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                ...linkButton,
                ...(hoveredLink === 'authSwitch' ? hoverLinkStyle : {}),
              }}
              onMouseEnter={() => setHoveredLink('authSwitch')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
      <Footer />

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default Login;