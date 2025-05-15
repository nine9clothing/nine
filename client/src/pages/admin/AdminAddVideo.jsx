import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const AddVideo = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newVideo, setNewVideo] = useState(() => {
    const savedVideo = localStorage.getItem('addVideoForm');
    if (savedVideo) {
      return JSON.parse(savedVideo);
    }
    return {
      title: '',
      description: '',
    };
  });

  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  useEffect(() => {
    const savedVideoFile = localStorage.getItem('addVideoFile');
    if (savedVideoFile) {
      setToast({
        message: 'Video file was not persisted due to page refresh. Please re-upload the file.',
        type: 'warning',
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('addVideoForm', JSON.stringify(newVideo));
    if (videoFile) {
      const videoFileMetadata = {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type,
      };
      localStorage.setItem('addVideoFile', JSON.stringify(videoFileMetadata));
    } else {
      localStorage.removeItem('addVideoFile');
    }
  }, [newVideo, videoFile]);

  const handleAddVideo = async () => {
    if (isSubmitting) return;

    const { title, description } = newVideo;

    if (!title || !videoFile) {
      setToast({ message: 'Please fill all required fields and upload a video.', type: 'error' });
      return;
    }

    if (videoFile.size > MAX_FILE_SIZE) {
      setToast({ message: `Video file size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setToast(null);

    try {
      const ext = videoFile.name.split('.').pop();
      const bucketName = 'home-video';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 3;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 500);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, videoFile, {
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload Error:', uploadError.message || uploadError);
        if (uploadError.message.includes('The bucket does not exist')) {
          throw new Error('The "' + bucketName + '" bucket does not exist. Please create it in the Supabase Storage dashboard.');
        }
        throw new Error('Failed to upload the video: ' + (uploadError.message || 'Unknown error'));
      }

      setUploadProgress(95);
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.error('Error getting public URL for:', fileName);
        throw new Error('Failed to get public URL for the uploaded video.');
      }

      const mediaUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('videos').insert([
        {
          title,
          description,
          media_url: mediaUrl,
        },
      ]);

      if (insertError) {
        console.error('Insert Error:', insertError.message || insertError);
        throw new Error('Failed to add video to database: ' + (insertError.message || 'Unknown error'));
      }

      setUploadProgress(100);
      setToast({ message: 'Video added successfully!', type: 'success' });
      setNewVideo({ title: '', description: '' });
      setVideoFile(null);
      const fileInput = document.getElementById('video-input');
      if (fileInput) fileInput.value = '';

      localStorage.removeItem('addVideoForm');
      localStorage.removeItem('addVideoFile');
    } catch (error) {
      console.error('Error in handleAddVideo:', error);
      setToast({ message: error.message || 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2
        style={{
          marginBottom: '20px',
          fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
          fontWeight: 500,
          fontFamily: "'Oswald', sans-serif",
        }}
      >
        Add New Video for Home Page
      </h2>

      <div style={formBox}>
        <label style={labelStyle}>
          Title <span style={asterisk}>*</span>
        </label>
        <input
          required
          value={newVideo.title}
          onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>Description</label>
        <textarea
          value={newVideo.description}
          onChange={e => setNewVideo({ ...newVideo, description: e.target.value })}
          style={{ ...inputStyle, height: '80px' }}
        />

        <label style={labelStyle}>
          Video File (Recommended: MP4, max 80MB) <span style={asterisk}>*</span>
        </label>
        <input
          id="video-input"
          type="file"
          required
          accept="video/*"
          onChange={e => setVideoFile(e.target.files[0])}
          style={inputStyle}
        />
        {videoFile && (
          <div style={{ fontSize: '0.9em', marginBottom: '10px', color: '#555' }}>
            Selected file: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)}MB)
          </div>
        )}

        {isSubmitting && (
          <div style={{ marginBottom: '15px' }}>
            <div style={progressBarContainer}>
              <div style={{ ...progressBarFill, width: `${uploadProgress}%` }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.9em', marginTop: '5px' }}>
              {uploadProgress < 100 ? `Uploading: ${Math.round(uploadProgress)}%` : 'Upload complete!'}
            </div>
          </div>
        )}

        <button
          onClick={handleAddVideo}
          style={isSubmitting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div style={spinnerContainer}>
              <div style={spinner}></div>
              <span style={{ marginLeft: '10px' }}>Uploading...</span>
            </div>
          ) : (
            'Add Video'
          )}
        </button>
      </div>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const buttonStyle = {
  padding: '10px 15px',
  backgroundColor: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginRight: '6px',
  fontSize: '0.95rem',
  opacity: 1,
  transition: 'opacity 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
};

const formBox = {
  background: '#f5f5f5',
  padding: '25px',
  marginBottom: '30px',
  borderRadius: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
};

const labelStyle = {
  fontWeight: '500',
  marginBottom: '5px',
  display: 'block',
};

const asterisk = {
  color: 'red',
  marginLeft: '2px',
};

const progressBarContainer = {
  width: '100%',
  height: '10px',
  backgroundColor: '#e0e0e0',
  borderRadius: '5px',
  overflow: 'hidden',
};

const progressBarFill = {
  height: '100%',
  backgroundColor: '#4CAF50',
  transition: 'width 0.3s ease',
};

const spinnerContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const spinner = {
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '50%',
  borderTop: '2px solid #ffffff',
  width: '16px',
  height: '16px',
  animation: 'spin 1s linear infinite',
};

const spinnerKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const injectStyle = (style) => {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = style;
  document.head.appendChild(styleElement);
};

if (typeof window !== 'undefined') {
  injectStyle(spinnerKeyframes);
}

export default AddVideo;