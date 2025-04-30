import React, { useState } from "react";
import Navbar from '../../components/Navbar';
import Footer from "../../pages/Footer";
import heroImage from '../../assets/n3.jpg'; 

const faqs = [
  {
    question: "How does your sizing work?",
    answer:
      "We design with real bodies in mind. Our sizing is Oversized fit, but to make it super simple, we’ve got a detailed Size Guide on every product page. Because your outfit should hug you in all the right places, not leave you guessing.",
  },
  {
    question: "What’s your return or exchange policy?",
    answer:
      "No returns—only exchanges, and only if the fit isn’t it. We accept exchanges within 5 days of delivery, but only if the product is unused, unwashed, and still rocking its original tags. Worn it out already? Sorry, we can’t take it back. Treat it like a first date, keep it fresh if you want a second chance.",
  },
  {
    question: "Can I model for Nine9?",
    answer:
      "Totally. We’re always looking for real people with real style. If you're into self-expression and want to wear your story with us, tag @---. Lights, camera, your vibe.",
  },
  {
    question: "Do you restock sold-out items?",
    answer:
      "Sometimes yes, sometimes no. Some styles are limited-edition drops—when they’re gone, they’re gone. But if enough of you scream loud enough (aka join the community), we might just bring them back. Manifest it.",
  },
  {
    question: "My order hasn’t arrived. What should I do?",
    answer:
      "No stress. Check your inbox for your tracking link. If it’s still playing hide-and-seek, ping us at info@nine9.co.in and we’ll track it down faster than you lose socks in the laundry.",
  },
  {
    question: "Do you collaborate with artists or influencers?",
    answer:
      "Big yes. At Nine9, we’re all about community and collabs. Whether you paint walls or paint your nails to match your outfit—we want your vibe. Drop us a line at info@nine9.co.in or tag us @---. Let’s make something dope.",
  },
  {
    question: "How do I earn and use Nine9 Reward Points?",
    answer:
      "Every time you shop, you earn points—like loyalty with drip. Rack them up and redeem them for discounts, exclusive access, and secret perks. It’s our way of saying thanks for riding with us.",
  },
  {
    question: "Do you ship across India? How long does it take?",
    answer:
      "Yup, we deliver pan-India— whether you're in Mumbai’s chaos or a sleepy Himachal town. Orders usually show up in 5–10 working days, depending on where you are. Style is en route.",
  },
  {
    question: "How do I take care of my Nine9 pieces?",
    answer:
      "Good clothes deserve good care. Most of our pieces are low-maintenance— no machine, cold wash, air dry, no bleach, no drama. Think of it like this: if you wouldn’t do it to your own skin, don’t do it to your clothes.",
  },
];

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Playfair+Display:wght@400;600;700&display=swap');

    html, body, #root {
      margin: 0;
      padding: 0;
      height: 100%;
    }

    .faq-page-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: black;
      width: 100%;
      font-family: 'Roboto', sans-serif;
      box-sizing: border-box;
    }

    .faq-hero-section {
      position: relative;
      width: 100%;
      height: 50vh;
      background-image: url(${heroImage});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .faq-hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }

    .faq-hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
    }

    .faq-hero-heading {
      font-family: 'Playfair Display', serif;
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .faq-hero-subheading {
      font-family: 'Roboto', sans-serif;
      font-size: 1.2rem;
      font-weight: 300;
    }

    .faq-content-wrap {
      flex: 1 0 auto;
      width: 100%;
      padding: 40px 5%;
      box-sizing: border-box;
      background-color: rgba(0, 0, 0, 0.95);
      border-radius: 10px;
      margin: -50px auto 0 auto;
      max-width: 900px;
      position: relative;
      margin-top: 30px;
      z-index: 3;
    }

    .faq-list-container {
      max-width: 850px;
      margin: 0 auto;
    }

    .faq-heading {
      font-family: 'Playfair Display', serif;
      text-align: center;
      font-size: 2.2rem; /* Match .policy-header h1 */
      margin-top: 60px; /* Match .policy-header h1 */
      margin-bottom: 12px; /* Match .policy-header h1 */
      color: #Ffa500;
      font-weight: 700;
      padding-bottom: 30px; /* Match .policy-header */
      border-bottom: 1px solid #444; /* Match .policy-header */
    }

    .faq-item {
      margin-bottom: 20px;
      padding: 20px 25px;
      background-color: white;
      border-radius: 6px;
      border-bottom: 1px solid #e0e0e0;
      transition: all 0.3s ease-in-out;
      overflow: hidden;
    }

    .faq-item.active {
        border-bottom: 2px solid #Ffa500;
      background-color: #ffffff;
    }

    .faq-question {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: color 0.2s ease;
    }

    .faq-item.active .faq-question {
      color:rgb(0, 0, 0);
    }

    .faq-answer {
      margin-top: 15px;
      padding-top: 10px;
      font-size: 0.98rem;
      line-height: 1.7;
      color: #4a4a4a;
      border-top: 1px dashed #eee;
      max-height: 0;
      opacity: 0;
      transition: max-height 0.4s ease-out, opacity 0.3s ease-in, margin-top 0.3s ease-out, padding-top 0.3s ease-out;
      overflow: hidden;
    }

    .faq-item.active .faq-answer {
      max-height: 500px;
      opacity: 1;
      margin-top: 15px;
      padding-top: 10px;
      transition: max-height 0.5s ease-in-out, opacity 0.4s ease-in 0.1s, margin-top 0.3s ease-in-out, padding-top 0.3s ease-in-out;
    }

    .faq-toggle-icon {
      font-size: 1.6rem;
      font-weight: 300;
      color: #Ffa500;
      margin-left: 15px;
      transition: transform 0.3s ease;
    }

    .faq-item.active .faq-toggle-icon {
      transform: rotate(180deg);
      color: #Ffa500;
    }

    .site-footer-wrapper {
      width: 100%;
    }

    @media (max-width: 768px) {
      .faq-hero-section {
        height: 40vh;
      }
      .faq-hero-heading {
        font-size: 2.5rem;
      }
      .faq-hero-subheading {
        font-size: 1rem;
      }
      .faq-heading {
        font-size: 2rem; /* Match .policy-header h1 */
        margin-top: 20px;
        margin-bottom: 40px;
      }
      .faq-content-wrap {
        padding: 30px 4%;
        margin-top: -30px;
      }
      .faq-item {
        padding: 18px 20px;
      }
      .faq-question {
        font-size: 1rem;
      }
      .faq-answer {
        font-size: 0.95rem;
      }
    }

    @media (max-width: 480px) {
      .faq-hero-section {
        height: 35vh;
      }
      .faq-hero-heading {
        font-size: 2rem;
      }
      .faq-hero-subheading {
        font-size: 0.9rem;
      }
      .faq-heading {
        font-size: 1.75rem; /* Match .policy-header h1 */
        margin-bottom: 30px;
      }
      .faq-content-wrap {
        padding: 20px 15px;
        margin-top: -20px;
      }
      .faq-item {
        padding: 15px;
      }
      .faq-question {
        font-size: 0.95rem;
      }
      .faq-answer {
        font-size: 0.9rem;
      }
      .faq-toggle-icon {
        font-size: 1.4rem;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div className="faq-page-container">
        <div className="navbar-wrapper">
          <Navbar showLogo={true} />
        </div>
        <div className="faq-hero-section">
          <div className="faq-hero-overlay"></div>
          <div className="faq-hero-content">
            {/* <h1 className="faq-hero-heading">General FAQs</h1>
            <p className="faq-hero-subheading">
              Everything you need to know about Patricia Hotel and our services.
              Can't find the answer you're looking for? Please contact our friendly team.
            </p> */}
          </div>
        </div>
        <div className="faq-content-wrap">
          <div className="faq-list-container">
            <h1 className="faq-heading">FAQs</h1>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openIndex === index ? 'active' : ''}`}
              >
                <div
                  onClick={() => toggleFAQ(index)}
                  className="faq-question"
                >
                  {faq.question}
                  <span className="faq-toggle-icon">{openIndex === index ? "−" : "+"}</span>
                </div>
                <div className="faq-answer">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="site-footer-wrapper">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default FaqPage;