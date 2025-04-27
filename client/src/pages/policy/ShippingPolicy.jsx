import React from "react";
import Navbar from '../../components/Navbar'; 
import Footer from "../Footer"; 

const ShippingPolicy = () => {

  const cssStyles = `
    /* --- Font Imports --- */
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Playfair+Display:wght@400;600;700&display=swap');

    /* --- Global Styles --- */
    html, body, #root {
       margin: 0;
       padding: 0;
       height: 100%;
    }
.p{
color:white;}

    /* --- Base & Container Styles --- */
    .shipping-policy-container {
      font-family: 'Roboto', sans-serif;
      font-size: 15px;
      line-height: 1.75;
      color:rgb(255, 255, 255);
      background-color:rgb(0, 0, 0);
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
        /* Add background/shadow if needed by Navbar design */
    }

    /* --- Main Content Wrapper --- */
    .shipping-policy-content {
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
      border-bottom: 1px solid #444; /* Match ExchangePolicy and PrivacyPolicy */
      max-width: 800px;
    }

    .policy-header h1 {
      font-family: 'Playfair Display', serif;
      margin-top: 60px;
      color: #Ffa500;
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .tagline {
      font-size: 1.05rem;
      color:rgb(200, 200, 200); /* Lighter grey for tagline */
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
      color:rgb(255, 255, 255);
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #d5dbdb;
      display: inline-block;
    }

    .policy-section h2 .heading-icon {
        margin-right: 8px;
        font-size: 1.5rem;
        vertical-align: middle;
    }


    .policy-section p {
      margin-bottom: 18px;
      color: rgb(220, 220, 220); /* Light grey paragraph text */
    }

     .policy-section strong {
        font-weight: 500;
        color: white;
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
      color: white;
    }

    .info-list li::before {
      content: '›';
      position: absolute;
      left: 10px;
      top: -1px;
      color:#Ffa500;
      font-weight: bold;
      font-size: 1.4em;
    }

    .info-list li strong {
      font-weight: 500;
      color:rgb(255, 255, 255);
    }

    /* --- Links --- */
    .contact-link {
      color: #Ffa500;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease, border-bottom 0.2s ease;
      border-bottom: 1px dottedrgb(255, 255, 255);
      word-break: break-all;
    }

    .contact-link:hover,
    .contact-link:focus {
      color:rgb(255, 255, 255);
      border-bottom: 1px solid #2980b9;
    }

    
    /* --- Responsive Adjustments --- */
    @media (max-width: 900px) {
        .shipping-policy-content {
             padding: 30px 5% 50px 5%;
        }
        .policy-section, .policy-header, .tagline {
            max-width: 95%;
            padding: 0 10px;
        }
    }

    @media (max-width: 768px) {
       .shipping-policy-container {
           font-size: 14.5px;
       }
        .shipping-policy-content {
             padding: 25px 4% 40px 4%;
        }
      .policy-header h1 { font-size: 2rem; }
      .policy-section h2 { font-size: 1.5rem; }
      .tagline { font-size: 1rem; }
      .policy-page-footer { padding: 40px 5%; } /* Adjust footer padding */
    }

    @media (max-width: 480px) {
        .shipping-policy-container { font-size: 14px; }
         .shipping-policy-content { padding: 20px 15px 30px 15px; }
        .policy-header h1 { font-size: 1.75rem; }
        .policy-section h2 { font-size: 1.35rem; }
        .info-list li { padding-left: 25px; }
        .info-list li::before { left: 8px; }
        .policy-page-footer { padding: 30px 15px; } /* Adjust footer padding */
        .footer-links a { margin: 0 8px; font-size: 0.85rem;} /* Closer links on mobile */
        .footer-links span { margin: 0 2px; }
    }
  `;

  return (
    <>
      {/* Inject the CSS string into a style tag */}
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />

      {/* Main container */}
      <div className="shipping-policy-container">

        {/* Navbar Component */}
        <div className="navbar-wrapper">
            <Navbar showLogo={true} />
        </div>

        {/* Main Content Wrapper */}
        <div className="shipping-policy-content">
            <header className="policy-header">
                <h1><span className="heading-icon"></span> Shipping Policy – Nine9</h1>
            </header>
            <p className="tagline">
                Because great style deserves a smooth ride.
            </p>

            {/* Where We Ship */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Where We Ship</h2>
            <p>
                We deliver <strong>across India</strong> — from bustling cities to quiet corners. If there’s a pin code, we’ll find it. Whether you're in Delhi’s street hustle or chilling in Kerala’s greens — <strong>Nine9 is coming through</strong>.
            </p>
            </section>

            {/* Delivery Timeline */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Delivery Timeline</h2>
            <ul className="info-list">
                <li><strong>Processing Time:</strong> 1–2 working days</li>
                <li><strong>Shipping Time:</strong> 5–10 working days (depending on your location)</li>
                <li><strong>Remote Areas:</strong> Might take a little longer — but we promise, it’s worth the wait!</li>
            </ul>
            <p>
                You’ll get an <strong>email or SMS with tracking info</strong> as soon as your order ships — so you can follow your package's journey.
            </p>
            </section>

            {/* Shipping Charges */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Shipping Charges</h2>
            <ul className="info-list">
                <li>Standard shipping charges apply at checkout (they’ll be clearly visible — <strong>no sneaky surprises</strong>).</li>
                <li>We <strong>sometimes offer free shipping</strong> during special promos or for orders above a certain amount. <strong>Keep an eye out!</strong></li>
            </ul>
            </section>

            {/* Order Tracking */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Order Tracking</h2>
            <p>
                Once your order is shipped, we’ll provide you with a tracking number. Use it to follow your package’s journey from our warehouse to your wardrobe.
            </p>
            <p>
                Can’t find the link? Hit us up at <a href="mailto:info@nine9.co.in" className="contact-link">info@nine9.co.in</a> and we’ll resend it faster than a refresh on your cart.
            </p>
            </section>

            {/* Delays & Delivery Issues */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Delays & Delivery Issues</h2>
            <p>
                Delays can happen due to festivals, extreme weather, or courier issues — we’re just being real. But if your order’s taking too long or seems MIA, don’t panic. Just reach out, and we’ll sort it out for you.
            </p>
            </section>

            {/* Wrong Address */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Wrong Address?</h2>
            <p>
                Entered the wrong address and just realized it? Email us <strong>ASAP</strong> at <a href="mailto:info@nine9.co.in" className="contact-link">info@nine9.co.in</a> before the order ships. Once it’s out for delivery, we won’t be able to make changes.
            </p>
            </section>

            {/* Undelivered Orders */}
            <section className="policy-section">
            <h2><span className="heading-icon"></span> Undelivered Orders</h2>
            <p>
                If your order returns to us due to an incorrect address or failed delivery attempts, we’ll reach out to reschedule. <strong>Re-shipping charges may apply.</strong>
            </p>
            </section>

            {/* Final Note */}
            <section className="policy-section">
            <h2>Final Note</h2>
            <p>
                At Nine9, we treat your order like art — carefully packed, protected, and delivered with love. Got more questions? We’ve got answers.
            </p>
            <p>
                <a href="mailto:info@nine9.co.in" className="contact-link">info@nine9.co.in</a><br />
                Or DM us <strong>@Nine9</strong> on socials
            </p>
            </section>
        </div> {/* End of .shipping-policy-content */}

   <Footer/>

      </div> {/* End of .shipping-policy-container */}
    </>
  );
};

export default ShippingPolicy;