import React from 'react';
import Navbar from '../../components/Navbar'; 
import Footer from "../Footer"; 

function ExchangePolicy() {
  const cssStyles = `
    /* --- Font Imports --- */
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Playfair+Display:wght@400;600;700&display=swap');

    /* --- Global Styles --- */
    html, body, #root {
       margin: 0;
       padding: 0;
       height: 100%;
    }
    .p { /* This global p rule might be too broad, be careful */
      color: white;
    }

    /* --- Base & Container Styles --- */
    /* Use exchange-policy-container class */
    .exchange-policy-container {
      font-family: 'Roboto', sans-serif;
      font-size: 15px;
      line-height: 1.75;
      color: rgb(255, 255, 255); /* Default text white */
      background-color: rgb(0, 0, 0); /* Black background */
      width: 100%;
      min-height: 100vh;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    /* --- Navbar Wrapper --- */
    .navbar-wrapper {
        position: sticky;
        top: 0;
        z-index: 100;
        width: 100%;
        /* background-color: #000; Add if Navbar needs explicit background */
    }

    /* --- Main Content Wrapper --- */
    /* Use exchange-policy-content class */
    .exchange-policy-content {
        flex: 1 0 auto; /* Pushes footer down */
        width: 100%;
        padding: 40px 8% 60px 8%; /* Padding for content area */
        box-sizing: border-box;
    }

    /* --- Header --- */
    .policy-header {
      text-align: center;
      margin: 0 auto 50px auto; /* Center */
      padding-bottom: 30px;
      border-bottom: 1px solid #444; /* Darker border for dark theme */
      max-width: 800px;
    }

    .policy-header h1 {
      font-family: 'Playfair Display', serif;
      margin-top: 60px;
      color: #FFA500; /* Orange-gold accent */
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .tagline {
      font-size: 1.05rem;
      color: rgb(200, 200, 200); /* Lighter grey for tagline */
      font-style: italic;
      font-weight: 300;
      text-align: center;
      margin: 0 auto 40px auto; /* Center */
      max-width: 800px;
    }

    /* --- Sections --- */
    .policy-section {
      margin: 0 auto 45px auto;
      max-width: 800px;
      padding: 0 15px;
      box-sizing: border-box;
    }

    .policy-section h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      font-weight: 600;
      color: rgb(255, 255, 255); /* White headings */
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #555; /* Darker dashed border */
      display: inline-block;
    }

    /* No heading icons needed in exchange policy */

    .policy-section p {
      margin-bottom: 18px;
      color: rgb(220, 220, 220); /* Light grey paragraph text */
    }

    .policy-section strong {
        font-weight: 500;
        color: rgb(255, 255, 255); /* White strong text */
    }

    /* --- Lists --- */
    .info-list {
      list-style: none;
      padding-left: 5px;
      margin-bottom: 20px;
      margin-top: 10px;
    }

    .info-list li {
      padding-left: 28px;
      margin-bottom: 12px;
      position: relative;
      color: rgb(220, 220, 220); /* Light grey list items */
    }

    .info-list li::before {
      content: '›';
      position: absolute;
      left: 10px;
      top: -1px;
      color: #FFA500; /* Orange-gold accent */
      font-weight: bold;
      font-size: 1.4em;
    }

    .info-list li strong {
      font-weight: 500;
      color: rgb(255, 255, 255); /* White strong text in lists */
    }

    /* --- Highlighted Section --- */
    .highlight-section {
      background-color: #1a1a1a; /* Dark background for highlight */
      padding: 25px 30px; /* Add padding specific to this section */
      border-radius: 6px;
      border-left: 5px solid #FFA500; /* Orange-gold accent */
      margin-top: 20px;
      margin-bottom: 40px;
      /* max-width is inherited from .policy-section */
    }

    .highlight-section h2 {
      border-bottom: none;
      margin-bottom: 15px;
      color: #ffffff; /* Ensure heading is white */
    }

    .highlight-section p {
        color: #cccccc; /* Slightly different grey */
    }

    .highlight-section p strong {
      color: #FFA500; /* Orange-gold accent */
      font-weight: 600;
    }

    /* --- Links --- */
    .contact-link {
      color: #FFA500; /* Orange-gold accent */
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease, border-bottom 0.2s ease;
      border-bottom: 1px dotted #cccccc; /* Lighter dotted line */
      word-break: break-all;
    }

    .contact-link:hover,
    .contact-link:focus {
      color: rgb(255, 255, 255); /* White on hover */
      border-bottom: 1px solid #FFA500; /* Orange-gold solid line on hover */
    }

    /* --- Footer Styles (Copied from ShippingPolicy) --- */
    .policy-page-footer {
        background-color: #000000;
        color: #ffffff;
        width: 100%;
        padding: 50px 5% 40px 5%;
        margin-top: auto; /* Ensures it's at the bottom */
        border-top: 4px solid #e4b74e; /* Match gold/yellow border */
        box-sizing: border-box;
        text-align: center;
    }

    .footer-logo img {
        display: block;
        margin: 0 auto 30px auto;
        max-height: 40px;
        width: auto;
    }

    .footer-logo-text {
        font-size: 2rem;
        font-weight: bold;
        letter-spacing: 0.15em;
        margin-bottom: 30px;
        display: inline-block;
    }

    .footer-links a {
        color: #d0d0d0;
        text-decoration: none;
        margin: 0 15px;
        font-size: 0.9rem;
        font-weight: 400;
        transition: color 0.2s ease;
    }

    .footer-links a:hover {
        color: #ffffff;
    }

    .footer-links span {
        color: #777777;
        margin: 0 5px;
        user-select: none;
    }

    /* --- Responsive Adjustments --- */
    @media (max-width: 900px) {
        .exchange-policy-content { /* Adjusted class name */
             padding: 30px 5% 50px 5%;
        }
        .policy-section, .policy-header, .tagline {
            max-width: 95%;
            padding: 0 10px;
        }
    }

    @media (max-width: 768px) {
       .exchange-policy-container { /* Adjusted class name */
           font-size: 14.5px;
       }
        .exchange-policy-content { /* Adjusted class name */
             padding: 25px 4% 40px 4%;
        }
      .policy-header h1 { font-size: 2rem; }
      .policy-section h2 { font-size: 1.5rem; }
      .tagline { font-size: 1rem; }
      .policy-page-footer { padding: 40px 5%; }
    }

    @media (max-width: 480px) {
        .exchange-policy-container { font-size: 14px; } /* Adjusted class name */
         .exchange-policy-content { padding: 20px 15px 30px 15px; } /* Adjusted class name */
        .policy-header h1 { font-size: 1.75rem; }
        .policy-section h2 { font-size: 1.35rem; }
        .info-list li { padding-left: 25px; }
        .info-list li::before { left: 8px; }
        .policy-page-footer { padding: 30px 15px; }
        .footer-links a { margin: 0 8px; font-size: 0.85rem;}
        .footer-links span { margin: 0 2px; }
    }
  `;

  return (
    <> 
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />

      <div className="exchange-policy-container">

        <div className="navbar-wrapper">
            <Navbar showLogo={true} />
        </div>

        <div className="exchange-policy-content">

            <header className="policy-header">
                <h1>Exchange Policy</h1>
            </header>
            <p className="tagline">We get it — sometimes things don’t fit just right or feel how you imagined.</p>

            <section className="policy-section intro">
            <p>
                That’s why we offer a 5-day exchange window to make sure you absolutely love what you wear. 
                If something doesn’t vibe with your style or size, we’re here to help you swap it out for something that does.
            </p>
            </section>

            <section className="policy-section">
            <h2>📦 What’s Eligible for Exchange?</h2>
            <p>
                You can request an exchange within 5 days of delivery if the following conditions are met:
            </p>
            <ul className="info-list">
                <li>The product is <strong>unused, unworn, unwashed</strong></li>
                <li><strong>Tags</strong> are intact</li>
                <li>It’s not what you expected — especially size-wise</li>
            </ul>
            </section>

            <section className="policy-section highlight-section">
            <h2>🚫 No Returns</h2>
            <p>
                We currently don’t accept returns or offer refunds — but we’re happy to help you find the right size or style through an exchange.
            </p>
            </section>

            <section className="policy-section">
            <h2>Ready to Exchange?</h2>
            <p>
                If your product meets the criteria, reach out to us within 5 days of delivery at{' '}
                <a href="mailto:info@nine9.co.in" className="contact-link">
                  info@nine9.co.in                  </a>. We’ll guide you through the process to get you the perfect fit!
            </p>
            </section>

        </div> 
      <Footer/>
   </div> 
 </>
);
};

export default ExchangePolicy;