import React, { useEffect, useState } from "react";
import { supabase } from '../lib/supabase';
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
// import ReelsSection from "../components/ReelsSection";
import logo from "../assets/nine9_logo.png";
import { FaArrowLeft, FaArrowRight, FaBoxOpen, FaSyncAlt, FaShieldAlt, FaComments, FaHandsHelping, FaLightbulb } from "react-icons/fa";
import Footer from "../pages/Footer";

const Home = () => {
  const [gridVisible, setGridVisible] = useState(true);
  const [logoEffect, setLogoEffect] = useState(0);
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [videos, setVideos] = useState([]);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState({ message: "", type: "" });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [codesToDisplay, setCodesToDisplay] = useState([]);
  const words = [
    <span>Talk <FaComments style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>,
    <span>Collaborate <FaHandsHelping style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>,
    <span>Create <FaLightbulb style={{ marginLeft: '5px', verticalAlign: 'middle' }} /></span>
  ];

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_images')
          .select('image_url')
          .order('id', { ascending: true });

        if (error) throw error;

        const imageUrls = data.map(item => item.image_url);
        setHeroImages(imageUrls.length > 0 ? imageUrls : ["/images/n1.jpg", "/images/n2.jpg", "/images/n3.jpg"]);
      } catch (error) {
        // console.error("Error fetching hero images:", error.message);
      }
    };

    fetchHeroImages();
  }, []);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('promocodes')
          .select('code, discount')
          .eq('display', true);

        if (error) throw error;

        const formattedData = data.map(item => ({
          code: item.code,
          discount: typeof item.discount === 'number' && !isNaN(item.discount) ? item.discount : 0
        }));

        setCodesToDisplay(formattedData);
      } catch (error) {
        // console.error("Error fetching codes:", error.message);
        setCodesToDisplay([]);
      }
    };

    fetchCodes();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        // console.error("Error fetching videos:", error);
        setVideos([
          {
            media_url: "/videos/reel1.mp4",
            likes: 0,
            views: 0,
            caption: "New collection"
          },
        ]);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(wordInterval);
  }, [words.length]);

  useEffect(() => {
    const logoEffectInterval = setInterval(() => {
      setLogoEffect((prev) => {
        if (prev >= 5) {
          clearInterval(logoEffectInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(logoEffectInterval);
  }, []);

  useEffect(() => {
    const gridTimeout = setTimeout(() => {
      setGridVisible(false);
    }, isMobile ? 1500 : 1800);
    return () => clearTimeout(gridTimeout);
  }, [isMobile]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

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
      // console.error("Error subscribing:", error.message);
      setSubscribeStatus({ message: "Subscription failed. Please try again later.", type: "error" });
    }
  };

  return (
    <div style={{ margin: 0, padding: 0, fontFamily: "Arial, sans-serif" }}>
      {gridVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            pointerEvents: "none",
            backgroundColor: "black",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              width: "100%",
              height: "100%",
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => {
              const fadeAnimations = [
                `fadeBox0 ${isMobile ? "0.5s" : "0.6s"} ease-in-out 1s forwards`,
                `fadeBox1 ${isMobile ? "0.5s" : "0.6s"} ease-in-out 1s forwards`,
                `fadeBox2 ${isMobile ? "0.5s" : "0.6s"} ease-in-out 1s forwards`,
                `fadeBox3 ${isMobile ? "0.5s" : "0.6s"} ease-in-out 1s forwards`,
              ];

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    opacity: 1,
                    position: "relative",
                    animation: fadeAnimations[index],
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                    willChange: "opacity, transform",
                  }}
                />
              );
            })}
          </div>

          <img
            src={logo}
            alt="nine9 Logo"
            style={{
              position: "absolute",
              top: isMobile ? "47%" : "47%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: isMobile ? "150px" : "620px",
              height: isMobile ? "110px" : "350px",
              zIndex: 10000,
              filter: logoEffect % 2 === 0 ? "grayscale(100%)" : "none",
              transition: "filter 0.3s ease",
              animation: `logoBlink ${isMobile ? "1.5s" : "1.8s"} ease-in-out 0s forwards`,
              opacity: 0,
              willChange: "transform, filter, opacity",
            }}
          />
        </div>
      )}

      <Navbar showLogo={true} />

      <section style={{ position: "relative", height: isMobile ? "80vh" : "100vh", overflow: "hidden" }}>
        {heroImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`slide-${index}`}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: index === currentSlide ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              zIndex: 0,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: isMobile ? "7%" : "6%",
            width: "100%",
            zIndex: 2,
            backgroundColor: "transparent",
            padding: isMobile ? "10px 0" : "15px 0",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "1rem" : "1.2rem",
              fontWeight: "700",
              textAlign: "center",
              color: "#FFA500",
              marginBottom: "10px",
              fontFamily: '"Abril Extra Bold", sans-serif',
              textTransform: "uppercase",
              letterSpacing: "1px",
              textShadow: "0px 0px 5px rgba(255, 165, 0, 0.5)",
            }}
          >
          </h2>

          {codesToDisplay && codesToDisplay.length > 0 ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                padding: "5px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  animation: "slideCodes 15s linear infinite",
                  width: "max-content",
                }}
              >
                {[...codesToDisplay, ...codesToDisplay].map((codeItem, index) => {
                  const { code, discount } = codeItem;
                  return (
                    <div
                      key={index}
                      style={{
                        margin: "0 10px",
                        padding: "6px 14px",
                        backgroundColor: "#FFA500",
                        opacity: '80%',
                        color: "black",
                        borderRadius: "10px",
                        fontSize: isMobile ? "0.8rem" : "1rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        fontFamily: '"Abril Extra Bold", sans-serif',
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <span>
                        {discount > 0 ? (
                          <>
                            {discount}% off: <strong>USE CODE: {code}</strong>
                          </>
                        ) : (
                          <>
                            USE CODE: <strong>{code}</strong>
                          </>
                        )}
                      </span>
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "-100%",
                          width: "50%",
                          height: "100%",
                          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)",
                          animation: `shimmer 2s infinite ${index * 0.5}s`,
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "#fff",
                fontSize: isMobile ? "0.9rem" : "1rem",
                fontFamily: '"Louvette Semi Bold", sans-serif',
                padding: "10px 0",
              }}
            >
            </p>
          )}
        </div>

        <div
          style={{
            zIndex: 2,
            position: "relative",
            color: "#fff",
            textAlign: "center",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: isMobile ? "0 20px" : undefined,
          }}
        >
        </div>

        <button
          onClick={goToPrevSlide}
          style={{
            position: "absolute",
            top: "50%",
            left: isMobile ? "10px" : "20px",
            transform: "translateY(-50%)",
            zIndex: 3,
            background: "rgba(0,0,0,0.3)",
            color: "white",
            border: "none",
            fontSize: isMobile ? "18px" : "24px",
            padding: isMobile ? "8px" : "10px",
            cursor: "pointer",
            borderRadius: "50%",
          }}
        >
          <FaArrowLeft />
        </button>

        <button
          onClick={goToNextSlide}
          style={{
            position: "absolute",
            top: "50%",
            right: isMobile ? "10px" : "20px",
            transform: "translateY(-50%)",
            zIndex: 3,
            background: "rgba(0,0,0,0.3)",
            color: "white",
            border: "none",
            fontSize: isMobile ? "18px" : "24px",
            padding: isMobile ? "8px" : "10px",
            cursor: "pointer",
            borderRadius: "50%",
          }}
        >
          <FaArrowRight />
        </button>
      </section>

      <section
        style={{
          padding: isMobile ? "40px 10px" : "60px 20px",
          background: "linear-gradient(to bottom, rgb(0, 0, 0), rgb(0, 0, 0))",
          animation: "fadeIn 1s ease-in-out",
          overflow: "hidden",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? "2rem" : "2.8rem",
            fontWeight: "700",
            textAlign: "center",
            color: "#Ffa500",
            fontFamily: '"Abril Extra Bold", sans-serif',
            marginBottom: "12px",
            letterSpacing: "2px",
          }}
        >
          Latest Drops
        </h2>

        <div />

        <div
          style={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
            padding: isMobile ? "0 10px" : "0 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              animation: "scrollProducts 30s linear infinite",
              width: "max-content",
            }}
          >
            <ProductGrid singleLine={true} isMobile={isMobile} />
            <ProductGrid singleLine={true} isMobile={isMobile} />
          </div>
        </div>
      </section>

      {/* {videos.length > 0 && <ReelsSection videos={videos} isMobile={isMobile} />} */}

      <section
        style={{
          padding: isMobile ? "30px 15px" : "60px 40px",
          background: "linear-gradient(to bottom, rgb(0, 0, 0), rgb(0, 0, 0))",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "nowrap",
          gap: isMobile ? "20px" : "40px",
          animation: "fadeInUp 1s ease-out 0.2s",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: "#ffffff",
            opacity: 0,
            animation: "slideInLeft 1s ease-out 0.3s forwards",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease",
            width: isMobile ? "90%" : "auto",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <FaBoxOpen style={{ fontSize: isMobile ? "30px" : "40px", color: "#Ffa500", marginBottom: "15px" }} />
          <h3 style={{ fontSize: isMobile ? "1.1rem" : "1.3rem", fontWeight: "700", marginBottom: "10px", letterSpacing: "1px", fontFamily: '"Abril Extra Bold", sans-serif' }}>
            SHIPPING
          </h3>
          <p style={{ fontSize: isMobile ? "0.9rem" : "1rem", fontWeight: "400", color: "#cccccc", maxWidth: isMobile ? "100%" : "180px", lineHeight: "1.5", fontFamily: '"Louvette Semi Bold", sans-serif' }}>
            Shipping PAN India
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: "#ffffff",
            opacity: 0,
            animation: "slideInUp 1s ease-out 0.5s forwards",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease",
            width: isMobile ? "90%" : "auto",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <FaSyncAlt style={{ fontSize: isMobile ? "30px" : "40px", color: "#Ffa500", marginBottom: "15px" }} />
          <h3 style={{ fontSize: isMobile ? "1.1rem" : "1.3rem", fontWeight: "700", marginBottom: "10px", letterSpacing: "1px", fontFamily: '"Abril Extra Bold", sans-serif' }}>
            5 DAYS Exchange
          </h3>
          <p style={{ fontSize: isMobile ? "0.9rem" : "1rem", fontWeight: "400", color: "#cccccc", maxWidth: isMobile ? "100%" : "180px", lineHeight: "1.5", fontFamily: '"Louvette Semi Bold", sans-serif' }}>
            Hassle-free exchange within 5 days of delivery.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: "#ffffff",
            opacity: 0,
            animation: "slideInRight 1s ease-out 0.7s forwards",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease",
            width: isMobile ? "90%" : "auto",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <FaShieldAlt style={{ fontSize: isMobile ? "30px" : "40px", color: "#Ffa500", marginBottom: "15px" }} />
          <h3 style={{ fontSize: isMobile ? "1.1rem" : "1.3rem", fontWeight: "700", marginBottom: "10px", letterSpacing: "1px", fontFamily: '"Abril Extra Bold", sans-serif' }}>
            EASY PAYMENTS
          </h3>
          <p style={{ fontSize: isMobile ? "0.9rem" : "1rem", fontWeight: "400", color: "#cccccc", maxWidth: isMobile ? "100%" : "180px", lineHeight: "1.5", fontFamily: '"Louvette Semi Bold", sans-serif' }}>
            Flexible and secure payment options.
          </p>
        </div>
      </section>

      <section
        style={{
          position: "relative",
          height: isMobile ? "50vh" : "60vh",
          width: "100%",
          overflow: "hidden",
          backgroundImage: `url(/images/DSC00081.JPG)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            zIndex: 2,
            position: "relative",
            color: "#fff",
            textAlign: "center",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: isMobile ? "0 20px" : "0 40px",
          }}
        >
        </div>
      </section>

      {/* <section
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
            fontFamily: '"Abril Extra Bold", sans-serif',
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
          <span style={{ fontFamily: '"Abril Extra Bold", sans-serif' }}>Let's</span>
          <span
            key={currentWordIndex}
            style={{
              display: "inline-block",
              color: "#Ffa500",
              animation: "jump 0.5s ease-in-out",
              fontFamily: '"Abril Extra Bold", sans-serif',
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
                fontFamily: '"Louvette Semi Bold", sans-serif',
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
                fontFamily: '"Abril Extra Bold", sans-serif',
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
                fontFamily: '"Louvette Semi Bold", sans-serif',
              }}
            >
              {subscribeStatus.message}
            </p>
          )}
          <p style={{ fontSize: isMobile ? "0.8rem" : "0.9rem", color: "#cccccc", marginTop: "15px", fontFamily: '"Louvette Semi Bold", sans-serif' }}>
            Own your Story. Wear your Art. Join the Tribe.
          </p>
        </div>
      </section> */}

      <style>
        {`
          @keyframes logoBlink {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); filter: drop-shadow(0 0 0 #FFA500); }
            25% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(0.98); filter: drop-shadow(0 0 6px #FFA500); }
            75% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4)); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 4px #FFA500); }
          }

          @keyframes fadeBox0 {
            0% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(1.1) translate(-20px, -20px); }
          }

          @keyframes fadeBox1 {
            0% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(1.1) translate(20px, -20px); }
          }

          @keyframes fadeBox2 {
            0% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(1.1) translate(-20px, 20px); }
          }

          @keyframes fadeBox3 {
            0% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(1.1) translate(20px, 20px); }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); filter: blur(1px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }

          @keyframes scrollProducts {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          @keyframes slideCodes {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }

          @keyframes shimmer {
            0% { transform: translateX(0); }
            100% { transform: translateX(1000%); }
          }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); filter: blur(1px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }

          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-15px); filter: blur(1px); }
            to { opacity: 1; transform: translateX(0); filter: blur(0); }
          }

          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(15px); filter: blur(1px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }

          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(15px); filter: blur(1px); }
            to { opacity: 1; transform: translateX(0); filter: blur(0); }
          }

          @keyframes jump {
            0% { transform: translateY(0); opacity: 1; filter: drop-shadow(0 0 0 #FFA500); }
            50% { transform: translateY(-8px); opacity: 0.8; filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); }
            100% { transform: translateY(0); opacity: 1; filter: drop-shadow(0 0 3px #FFA500); }
          }

          @media (max-width: 768px) {
            .product-item {
              transform: scale(0.85);
            }
            
            .reel-item {
              width: 150px !important;
              height: 250px !important;
            }
          }
        `}
      </style>
      <Footer />
    </div>
  );
};

export default Home;
