import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Volume2, VolumeX, X, Play } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Constants
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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

  // Get styles based on device size
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
        top: isMobile ? '12px' : '16px',
        left: isMobile ? '12px' : '16px',
        zIndex: 1001,
        color: '#fff',
        background: 'none',
        border: 'none',
        padding: isMobile ? '6px' : '8px',
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
        right: isMobile ? '12px' : '16px',
        zIndex: 40,
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '50%',
        padding: isMobile ? '8px' : '12px',
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
        width: isMobile ? '16px' : '24px',
        borderRadius: '9999px'
      },
      muteButton: {
        position: 'absolute',
        bottom: isMobile ? '60px' : '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        padding: isMobile ? '6px 12px' : '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '8px',
        color: '#fff',
        zIndex: 40,
        cursor: 'pointer',
        fontSize: isMobile ? '14px' : '16px',
        fontFamily: '"Louvette Semi Bold", sans-serif' // Applied to descriptions
      },
      caption: {
        position: 'absolute',
        bottom: isMobile ? '100px' : '128px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontSize: isMobile ? '18px' : '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '80%',
        zIndex: 40,
        fontFamily: '"Abril Extra Bold", sans-serif' // Applied to headings
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
        <X size={isMobile ? 20 : 24} />
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
              <ChevronUp size={isMobile ? 18 : 24} style={{ transition: 'transform 0.2s ease' }} />
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
              <ChevronDown size={isMobile ? 18 : 24} style={{ transition: 'transform 0.2s ease' }} />
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
            top: isMobile ? '46px' : '56px',
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
          {isMuted ? <VolumeX size={isMobile ? 14 : 16} /> : <Volume2 size={isMobile ? 14 : 16} />}
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
  const cardWidth = mobileView ? 200 : 280;
  // Add gap between cards
  const gapWidth = mobileView ? 12 : 20;
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
        internalId: index, // Assign a unique internal ID for tracking
        media_url: video.media_url,
        title: video.title || "", // Optional field
        description: video.description || "", // Optional field
        category: video.category || "", // Optional field
        tags: video.tags || "", // Optional field
        caption: video.description || "", // Use description as caption (adjust if needed)
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
      // Calculate the exact position to scroll to
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
      // Clear auto-scrolling interval to prevent conflicts
      clearAutoScrollInterval();
      
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      
      // Restart auto-scrolling after a delay
      restartAutoScrollInterval();
    }
  };

  // Handle manual navigation via next button
  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      // Clear auto-scrolling interval to prevent conflicts
      clearAutoScrollInterval();
      
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      
      // Restart auto-scrolling after a delay
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
    // Wait a bit before restarting the auto-scroll
    setTimeout(() => {
      startAutoScrollInterval();
    }, 5000); // Wait 5 seconds before auto-scrolling resumes
  };

  // Start auto-scrolling
  const startAutoScrollInterval = () => {
    // Clear any existing interval first
    clearAutoScrollInterval();
    
    // Set up the new interval for auto-scrolling
    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        // Calculate next index
        const nextIndex = prevIndex + 1;
        
        // If we've reached the end, loop back to the beginning
        if (nextIndex >= videos.length) {
          const newIndex = 0;
          scrollToIndex(newIndex);
          return newIndex;
        }
        
        // Otherwise, scroll to the next video
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 3000); // Scroll every 3 seconds
  };

  // Set up auto-scrolling when videos are loaded
  useEffect(() => {
    if (videos.length <= 1) return;
    
    // Start the auto-scrolling
    startAutoScrollInterval();
    
    // Clean up on unmount
    return () => clearAutoScrollInterval();
  }, [videos.length]);

  // Handle intersection observer for video playback
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

  // Update current index based on scroll position
  const handleScroll = useCallback(() => {
    if (carouselRef.current) {
      // Calculate the current index based on scroll position
      const scrollPosition = carouselRef.current.scrollLeft;
      const calculatedIndex = Math.round(scrollPosition / totalCardWidth);
      
      // Update the current index if it has changed
      if (calculatedIndex !== currentIndex && calculatedIndex >= 0 && calculatedIndex < videos.length) {
        setCurrentIndex(calculatedIndex);
      }
    }
  }, [currentIndex, videos.length, totalCardWidth]);

  // Add scroll event listener
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      // Use passive listener for better performance
      carousel.addEventListener('scroll', handleScroll, { passive: true });
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle click on video card
  const handleCardClick = (video, index) => {
    // Clear auto-scrolling when a video is selected
    clearAutoScrollInterval();
    
    setClickedCardIndex(index);
    setTimeout(() => {
      setSelectedVideo(video);
      setClickedCardIndex(null);
    }, 300);
  };

  // Handle pagination dot click
  const handleDotClick = (index) => {
    // Clear auto-scrolling interval to prevent conflicts
    clearAutoScrollInterval();
    
    setCurrentIndex(index);
    scrollToIndex(index);
    
    // Restart auto-scrolling after a delay
    restartAutoScrollInterval();
  };

  // Get styles based on device size
  const getStyles = () => {
    return {
      loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: mobileView ? '30px 0' : '40px 0'
      },
      loadingSpinner: {
        width: mobileView ? '36px' : '48px',
        height: mobileView ? '36px' : '48px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        borderTopColor: '#Ffa500',
        animation: 'spin 1s linear infinite'
      },
      loadingText: {
        marginTop: '16px',
        color: '#Ffa500',
        fontSize: mobileView ? '1rem' : '1.2rem',
        fontFamily: '"Louvette Semi Bold", sans-serif' // Applied to descriptions
      },
      errorText: {
        textAlign: 'center',
        color: '#Ffa500',
        fontSize: mobileView ? '1.2rem' : '1.5rem',
        padding: mobileView ? '30px 0' : '40px 0',
        fontFamily: '"Louvette Semi Bold", sans-serif' // Applied to descriptions
      },
      sectionContainer: {
        position: 'relative',
        width: '100%',
        padding: mobileView ? '0 10px' : '0 20px'
      },
      navButton: {
        position: 'absolute',
        top: '50%',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
        borderRadius: '50%',
        width: mobileView ? '32px' : '40px',
        height: mobileView ? '32px' : '40px',
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
        padding: '10px 0',
      },
      videoCard: {
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        height: mobileView ? '300px' : '410px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '10px',
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
        borderRadius: '10px'
      },
      playIcon: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '50%',
        padding: mobileView ? '6px' : '10px',
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      },
      caption: {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '5px 10px',
        borderRadius: '4px',
        color: '#Ffa500',
        fontWeight: 500,
        maxWidth: '90%',
        textAlign: 'center',
        fontSize: mobileView ? '12px' : '14px',
        fontFamily: '"Abril Extra Bold", sans-serif' // Applied to headings
      },
      paginationDot: {
        height: mobileView ? '6px' : '8px',
        borderRadius: '9999px',
        transition: 'all 0.3s ease-out',
        cursor: 'pointer'
      },
      sectionTitle: {
        fontSize: mobileView ? "2rem" : "2.8rem",
        fontWeight: "700",
        textAlign: 'center',
        color: "#Ffa500",
        fontFamily: '"Abril Extra Bold", sans-serif', // Applied to headings (replacing Oswald)
        marginBottom: mobileView ? "15px" : "20px",
        letterSpacing: "2px"
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
              left: mobileView ? '4px' : '8px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={mobileView ? 16 : 20} style={{ transition: 'transform 0.2s ease' }} />
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
              // Add padding at the start to center first card
              paddingLeft: mobileView ? '10px' : '20px',
              // Add padding at the end for the last card
              paddingRight: mobileView ? '10px' : '20px'
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
                    size={mobileView ? 36 : 48} 
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
              right: mobileView ? '4px' : '8px',
              cursor: currentIndex >= videos.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex >= videos.length - 1 ? 0.5 : 1
            }}
          >
            <ChevronRight size={mobileView ? 16 : 20} style={{ transition: 'transform 0.2s ease' }} />
          </button>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: mobileView ? '12px' : '20px',
          gap: mobileView ? '6px' : '8px'
        }}>
          {videos.map((_, idx) => (
            <div 
              key={idx} 
              style={{
                ...styles.paginationDot,
                width: idx === currentIndex ? (mobileView ? '24px' : '32px') : (mobileView ? '6px' : '8px'),
                backgroundColor: idx === currentIndex ? '#Ffa500' : 'rgba(255, 165, 0, 0.5)'
              }}
              onClick={() => handleDotClick(idx)}
            ></div>
          ))}
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
        padding: mobileView ? "30px 0" : "40px 0",
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