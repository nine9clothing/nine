import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Volume2, VolumeX, X, Play } from 'lucide-react';
import { supabase } from '../lib/supabase.js'; // Use the single imported instance

// Constants
const VIDEO_FORMATS = /\.(mp4|webm|ogg|mov)$/i; // Retained from old code

// Custom Hook for Window Size
const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
};

// Full Video Page Component
const VideoPage = ({ video, onClose, allVideos }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(
    allVideos.findIndex(v => v.internalId === video.internalId)
  );
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => console.log('Autoplay prevented:', error));
    }
  }, [currentVideoIndex]);

  const getStyles = () => {
    return {
      fullScreenContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      closeButton: {
        position: 'absolute',
        top: isMobile ? '8px' : '16px', 
        left: isMobile ? '8px' : '16px', 
        zIndex: 1001,
        color: '#fff',
        background: 'none',
        border: 'none',
        padding: isMobile ? '4px' : '8px', 
        cursor: 'pointer'
      },
      videoContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      },
      touchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: 'flex'
      },
      navigationButton: {
        position: 'absolute',
        right: isMobile ? '8px' : '16px', 
        zIndex: 40,
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '50%',
        padding: isMobile ? '6px' : '12px', 
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      },
      videoWrapper: {
        height: '100%',
        width: isMobile ? '100%' : '50%',
        maxWidth: isMobile ? 'none' : '500px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      },
      video: {
        height: '100%',
        width: '100%',
        objectFit: 'contain'
      },
      indicator: {
        height: '4px',
        width: isMobile ? '12px' : '24px',
        borderRadius: '9999px'
      },
      muteButton: {
        position: 'absolute',
        bottom: isMobile ? '40px' : '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        padding: isMobile ? '4px 8px' : '8px 16px', 
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '4px' : '8px', 
        color: '#fff',
        zIndex: 40,
        cursor: 'pointer',
        fontSize: isMobile ? '12px' : '16px', 
        fontFamily: '"Louvette Semi Bold", sans-serif'
      },
      caption: {
        position: 'absolute',
        bottom: isMobile ? '80px' : '128px', 
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontSize: isMobile ? '14px' : '24px', 
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '80%',
        zIndex: 40,
        fontFamily: '"Abril Extra Bold", sans-serif'
      }
    };
  };

  const styles = getStyles();

  return (
    <div style={styles.fullScreenContainer}>
      <button 
        onClick={onClose}
        style={styles.closeButton}
      >
        <X size={isMobile ? 16 : 24} /> 
      </button>
      
      <div style={styles.videoContainer}>
        <div style={styles.touchOverlay}>
          <div style={{
            width: '50%',
            height: '100%',
            cursor: 'pointer'
          }} onClick={handlePrevVideo}></div>
          <div style={{
            width: '50%',
            height: '100%',
            cursor: 'pointer'
          }} onClick={handleNextVideo}></div>
        </div>
        
        {allVideos.length > 1 && (
          <>
            <button 
              onClick={handlePrevVideo}
              disabled={currentVideoIndex === 0}
              style={{
                ...styles.navigationButton,
                top: '33%',
                opacity: currentVideoIndex === 0 ? 0.5 : 1,
                cursor: currentVideoIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronUp size={isMobile ? 14 : 24} style={{ transition: 'transform 0.2s ease' }} /> 
            </button>
            
            <button 
              onClick={handleNextVideo}
              disabled={currentVideoIndex === allVideos.length - 1}
              style={{
                ...styles.navigationButton,
                bottom: '33%',
                opacity: currentVideoIndex === allVideos.length - 1 ? 0.5 : 1,
                cursor: currentVideoIndex === allVideos.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronDown size={isMobile ? 14 : 24} style={{ transition: 'transform 0.2s ease' }} />
            </button>
          </>
        )}
        
        <div style={styles.videoWrapper}>
          <video
            ref={videoRef}
            src={allVideos[currentVideoIndex].media_url}
            style={styles.video}
            autoPlay
            muted={isMuted}
            loop
            onClick={togglePlayPause}
          />
        </div>

        {allVideos.length > 1 && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '36px' : '56px', 
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            zIndex: 40
          }}>
            {allVideos.map((_, idx) => (
              <div 
                key={idx} 
                style={{
                  ...styles.indicator,
                  backgroundColor: idx === currentVideoIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)'
                }}
              ></div>
            ))}
          </div>
        )}
        
        <div 
          style={styles.muteButton}
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX size={isMobile ? 12 : 16} /> : <Volume2 size={isMobile ? 12 : 16} />} 
          <span>Tap to {isMuted ? 'unmute' : 'mute'}</span>
        </div>
        
        {allVideos[currentVideoIndex].caption && (
          <div style={styles.caption}>
            {allVideos[currentVideoIndex].caption}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Reels Section Component
const ReelsSection = ({ singleLine = true, isMobile = false }) => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [clickedCardIndex, setClickedCardIndex] = useState(null);
  const windowWidth = useWindowWidth();
  const videoRefs = useRef([]);
  const carouselRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  // Define mobile breakpoint
  const mobileView = isMobile || windowWidth < 768;

  // Calculate card width based on mobile/desktop view
  const cardWidth = mobileView ? 160 : 280; // Reduced card width for mobile
  // Add gap between cards
  const gapWidth = mobileView ? 8 : 20; // Reduced gap for mobile
  // Total width of one card including its gap
  const totalCardWidth = cardWidth + gapWidth;

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch videos directly from the 'videos' table with updated columns
      const { data, error } = await supabase
        .from('videos')
        .select('id, media_url, title, description, category, tags, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Database error: ${error.message}`);

      const videoData = data.map((video, index) => ({
        internalId: index,
        media_url: video.media_url,
        title: video.title || "",
        description: video.description || "",
        category: video.category || "",
        tags: video.tags || "",
        caption: video.description || "",
        created_at: video.created_at || new Date().toISOString(),
        updated_at: video.updated_at || new Date().toISOString(),
      }));

      setVideos(videoData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Scroll to specific index/card smoothly
  const scrollToIndex = (index) => {
    if (carouselRef.current) {
      const position = index * totalCardWidth;
      
      carouselRef.current.scrollTo({
        left: position,
        behavior: 'smooth'
      });
    }
  };

  // Handle manual navigation via previous button
  const handlePrev = () => {
    if (currentIndex > 0) {
      clearAutoScrollInterval();
      
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      
      restartAutoScrollInterval();
    }
  };

  // Handle manual navigation via next button
  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      clearAutoScrollInterval();
      
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      
      restartAutoScrollInterval();
    }
  };

  // Clear the auto-scroll interval
  const clearAutoScrollInterval = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // Restart auto-scrolling after manual navigation
  const restartAutoScrollInterval = () => {
    setTimeout(() => {
      startAutoScrollInterval();
    }, 5000);
  };

  const startAutoScrollInterval = () => {
    clearAutoScrollInterval();
    
    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex >= videos.length) {
          const newIndex = 0;
          scrollToIndex(newIndex);
          return newIndex;
        }
        
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 3000);
  };

  useEffect(() => {
    if (videos.length <= 1) return;
    
    startAutoScrollInterval();
    
    return () => clearAutoScrollInterval();
  }, [videos.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const videoElement = entry.target;
          if (entry.isIntersecting) {
            videoElement.play().catch(error => console.log('Autoplay prevented:', error));
          } else {
            videoElement.pause();
            videoElement.currentTime = 0;
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach(ref => {
      if (ref) {
        observer.observe(ref);
        ref.addEventListener('timeupdate', () => {
          if (ref.currentTime >= 3) {
            ref.currentTime = 0;
          }
        });
      }
    });

    return () => {
      videoRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [videos]);

  const handleScroll = useCallback(() => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const calculatedIndex = Math.round(scrollPosition / totalCardWidth);
      
      if (calculatedIndex !== currentIndex && calculatedIndex >= 0 && calculatedIndex < videos.length) {
        setCurrentIndex(calculatedIndex);
      }
    }
  }, [currentIndex, videos.length, totalCardWidth]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll, { passive: true });
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleCardClick = (video, index) => {
    clearAutoScrollInterval();
    
    setClickedCardIndex(index);
    setTimeout(() => {
      setSelectedVideo(video);
      setClickedCardIndex(null);
    }, 300);
  };

  const handleDotClick = (index) => {
    clearAutoScrollInterval();
    
    setCurrentIndex(index);
    scrollToIndex(index);
    
    restartAutoScrollInterval();
  };

  const getStyles = () => {
    return {
      loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: mobileView ? '20px 0' : '40px 0' 
      },
      loadingSpinner: {
        width: mobileView ? '28px' : '48px',
        height: mobileView ? '28px' : '48px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        borderTopColor: '#Ffa500',
        animation: 'spin 1s linear infinite'
      },
      loadingText: {
        marginTop: '12px',
        color: '#Ffa500',
        fontSize: mobileView ? '0.9rem' : '1.2rem', 
        fontFamily: '"Louvette Semi Bold", sans-serif'
      },
      errorText: {
        textAlign: 'center',
        color: '#Ffa500',
        fontSize: mobileView ? '1rem' : '1.5rem',
        padding: mobileView ? '20px 0' : '40px 0', 
        fontFamily: '"Louvette Semi Bold", sans-serif'
      },
      sectionContainer: {
        position: 'relative',
        width: '100%',
        padding: mobileView ? '0 5px' : '0 20px' 
      },
      navButton: {
        position: 'absolute',
        top: '50%',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
        borderRadius: '50%',
        width: mobileView ? '28px' : '40px', 
        height: mobileView ? '28px' : '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        transform: 'translateY(-50%)',
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      },
      carousel: {
        overflowX: 'auto',
        margin: '0 auto',
        maxWidth: '1400px',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      },
      carouselInner: {
        display: 'flex',
        flexWrap: 'nowrap',
        gap: `${gapWidth}px`,
        padding: '8px 0', 
      },
      videoCard: {
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        height: mobileView ? '240px' : '410px', 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '3px', 
        cursor: 'pointer',
        flexShrink: 0,
        scrollSnapAlign: 'center',
        transition: 'transform 0.3s ease-out',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      videoElement: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '8px'
      },
      playIcon: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '50%',
        padding: mobileView ? '4px' : '10px', 
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      },
      caption: {
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '4px 8px', 
        borderRadius: '4px',
        color: '#Ffa500',
        fontWeight: 500,
        maxWidth: '90%',
        textAlign: 'center',
        fontSize: mobileView ? '10px' : '14px',
        fontFamily: '"Abril Extra Bold", sans-serif'
      },
      paginationDot: {
        height: mobileView ? '5px' : '8px', 
        borderRadius: '9999px',
        transition: 'all 0.3s ease-out',
        cursor: 'pointer'
      },
      sectionTitle: {
        fontSize: mobileView ? "1.5rem" : "2.8rem",
        fontWeight: "700",
        textAlign: 'center',
        color: "#Ffa500",
        fontFamily: '"Abril Extra Bold", sans-serif',
        marginBottom: mobileView ? "10px" : "20px",
        letterSpacing: "1px"
      }
    };
  };

  const styles = getStyles();

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading videos...</p>
        </div>
      );
    }

    if (error) {
      return <p style={styles.errorText}>Error: {error}</p>;
    }

    if (videos.length === 0) {
      return <p style={styles.errorText}>No videos found</p>;
    }

    return (
      <div style={styles.sectionContainer}>
        {videos.length > 1 && (
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              ...styles.navButton,
              left: mobileView ? '2px' : '8px', 
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={mobileView ? 14 : 20} style={{ transition: 'transform 0.2s ease' }} />
          </button>
        )}
        
        <div 
          ref={carouselRef} 
          style={{
            ...styles.carousel,
            scrollSnapType: 'x mandatory',
          }}
        >
          <div 
            style={{
              ...styles.carouselInner,
              paddingLeft: mobileView ? '5px' : '20px', 
              paddingRight: mobileView ? '5px' : '20px'
            }}
          >
            {videos.map((video, index) => (
              <div 
                key={video.internalId} 
                style={{
                  ...styles.videoCard,
                  transform: clickedCardIndex === index ? 'scale(1.1)' : 'scale(1)',
                  zIndex: clickedCardIndex === index ? 5 : 1
                }}
                onClick={() => handleCardClick(video, index)}
              >
                <video
                  ref={el => videoRefs.current[index] = el}
                  src={video.media_url}
                  style={styles.videoElement}
                  muted
                  loop
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: '0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2,
                }}>
                  <Play 
                    size={mobileView ? 28 : 48} 
                    color="#fff" 
                    style={styles.playIcon}
                  />
                </div>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}></div>
                {video.caption && (
                  <div style={styles.caption}>
                    {video.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {videos.length > 1 && (
          <button
            onClick={handleNext}
            disabled={currentIndex >= videos.length - 1}
            style={{
              ...styles.navButton,
              right: mobileView ? '2px' : '8px', 
              cursor: currentIndex >= videos.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex >= videos.length - 1 ? 0.5 : 1
            }}
          >
            <ChevronRight size={mobileView ? 14 : 20} style={{ transition: 'transform 0.2s ease' }} />
          </button>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: mobileView ? '8px' : '20px', 
          gap: mobileView ? '4px' : '8px' 
        }}>
          {(() => {
            const dots = [];
            const startIndex = Math.max(0, currentIndex - 1);
            const endIndex = Math.min(videos.length - 1, currentIndex + 1);

            for (let idx = startIndex; idx <= endIndex; idx++) {
              dots.push(
                <div 
                  key={idx} 
                  style={{
                    ...styles.paginationDot,
                    width: idx === currentIndex ? (mobileView ? '20px' : '32px') : (mobileView ? '5px' : '8px'), // Smaller dots
                    backgroundColor: idx === currentIndex ? '#Ffa500' : 'rgba(255, 165, 0, 0.5)'
                  }}
                  onClick={() => handleDotClick(idx)}
                ></div>
              );
            }
            return dots;
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          div::-webkit-scrollbar {
            display: none;
          }

          button:hover:not(:disabled) svg {
            transform: scale(1.2);
          }

          div:hover svg[data-testid="PlayIcon"] {
            transform: scale(1.2);
            opacity: 0.8;
          }
        `}
      </style>
      <section style={{
        padding: mobileView ? "20px 0" : "40px 0", 
        background: "#000",
        overflow: "hidden"
      }}>
        <h2 style={styles.sectionTitle}>Trending Reels</h2>
        {renderContent()}
      </section>
      {selectedVideo && (
        <VideoPage 
          video={selectedVideo} 
          onClose={() => {
            setSelectedVideo(null);
            restartAutoScrollInterval();
          }}
          allVideos={videos}
        />
      )}
    </>
  );
};

export default ReelsSection;