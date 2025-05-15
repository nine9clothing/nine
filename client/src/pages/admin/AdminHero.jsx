import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage'; 

const AdminHeroImages = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [heroImages, setHeroImages] = useState([]);
  const [toast, setToast] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_images')
        .select('id, image_url')
        .order('id', { ascending: true });

      if (error) throw error;
      setHeroImages(data);
    } catch (error) {
      console.error('Error fetching hero images:', error);
      setToast({ message: 'Failed to load hero images.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fitImageToFrame = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const targetWidth = 1800;
        const targetHeight = 1080; // 1800 / (5/3) = 1080
        const targetRatio = 5 / 3;
        const currentRatio = img.width / img.height;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.fillStyle = 'black'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let scaleFactor;
        if (currentRatio > targetRatio) {
          scaleFactor = targetWidth / img.width;
        } else {
          scaleFactor = targetHeight / img.height;
        }

        const drawWidth = img.width * scaleFactor;
        const drawHeight = img.height * scaleFactor;

        const offsetX = (targetWidth - drawWidth) / 2;
        const offsetY = (targetHeight - drawHeight) / 2;

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to fit image into 5:3 frame.'));
            return;
          }

          const fittedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          URL.revokeObjectURL(img.src);
          resolve(fittedFile);
        }, file.type, 0.9); 
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for processing.'));
      };
    });
  };

  const handleAddHeroImage = async () => {
    if (isSubmitting) return;

    if (imageFiles.length === 0) {
      setToast({ message: 'Please upload at least one image.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const fittedFiles = [];
      for (const file of imageFiles) {
        const fittedFile = await fitImageToFrame(file);
        fittedFiles.push(fittedFile);
      }

      const imageUrls = [];
      for (const file of fittedFiles) {
        const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = `hero/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('hero-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Detailed Upload Error:', uploadError);
          throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('hero-images')
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
          console.error('Error getting public URL for:', fileName);
          throw new Error('Failed to get public URL for an uploaded file.');
        }
        imageUrls.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase.from('hero_images').insert(
        imageUrls.map(url => ({ image_url: url }))
      );

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw new Error('Failed to add hero image to database.');
      }

      setToast({ message: 'Hero image(s) added successfully!', type: 'success' });
      setImageFiles([]);
      const fileInput = document.getElementById('hero-image-input');
      if (fileInput) fileInput.value = '';
      await fetchHeroImages();
    } catch (error) {
      console.error('Error adding hero image:', error);
      setToast({ message: error.message || 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHeroImage = async (id) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setToast(null);

    try {
      const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToast({ message: 'Hero image deleted successfully!', type: 'success' });
      await fetchHeroImages();
    } catch (error) {
      console.error('Error deleting hero image:', error);
      setToast({ message: 'Failed to delete hero image.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        marginBottom: '20px',
        fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
        fontWeight: 500,
        fontFamily: "'Oswald', sans-serif",
      }}>Manage Hero Images</h2>

      <div style={formBox}>
        <label style={labelStyle}>Upload Hero Image(s) (Ensure the image is of 6000 x 3320 px) <span style={asterisk}>*</span></label>
        <input
          id="hero-image-input"
          type="file"
          required
          multiple
          accept="image/*"
          onChange={e => setImageFiles(Array.from(e.target.files))}
          style={inputStyle}
        />
        {imageFiles.length > 0 && (
          <div style={{ fontSize: '0.9em', marginBottom: '10px', color: '#555' }}>
            Selected files: {imageFiles.map(f => f.name).join(', ')}
          </div>
        )}

        <button
          onClick={handleAddHeroImage}
          style={isSubmitting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Hero Image(s)'}
        </button>
      </div>

      <div style={formBox}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '10px', 
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 500 
        }}>Current Hero Images</h3>
        {isLoading && <p>Loading...</p>}
        {!isLoading && heroImages.length === 0 && <p>No hero images found.</p>}
        {!isLoading && heroImages.length > 0 && (
          <div style={gridStyle}>
            {heroImages.map(image => (
              <div
                key={image.id}
                style={productBox}
              >
                <div style={mediaContainerStyle}>
                  <img
                    src={image.image_url}
                    alt="Hero Image"
                    style={imageStyle}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ wordBreak: 'break-all', flex: 1, marginRight: '10px', fontSize: '0.85rem' }}>
                    {/* {image.image_url.split('/').pop()} */}
                  </span>
                  <button
                    onClick={() => handleDeleteHeroImage(image.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1,
                      fontSize: '0.85rem',
                    }}
                    disabled={isSubmitting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '25px',
  marginTop: '20px'
};

const productBox = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.2s ease-in-out',
  maxWidth: '400px',
};

const mediaContainerStyle = {
  position: 'relative',
  marginBottom: '12px',
};

const imageStyle = {
  display: 'block',
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  backgroundColor: '#f0f0f0',
};

export default AdminHeroImages;