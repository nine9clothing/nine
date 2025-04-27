import React, { useEffect, useState } from 'react';

const ToastMessage = ({ message, type = 'error', onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(false);

  // Trigger fade in on mount.
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for fade out to complete (300ms) before closing.
      setTimeout(() => onClose(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  let backgroundColor;
  if (type === 'success') {
    backgroundColor = '#52c41a'; 
  } else if (type === 'error') {
    backgroundColor = '#ff4d4f';
  } else {
    backgroundColor = '#444'; 
  }

  const containerStyles = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    minWidth: '250px',
    backgroundColor,
    color: '#fff',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    cursor: 'pointer',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const messageStyles = {
    margin: 0,
    paddingRight: '8px',
    flex: 1
  };

  const closeButtonStyles = {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    lineHeight: 1,
    cursor: 'pointer'
  };

  return (
    <div style={containerStyles} onClick={onClose}>
      <p style={messageStyles}>{message}</p>
      <button
        style={closeButtonStyles}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export default ToastMessage;
