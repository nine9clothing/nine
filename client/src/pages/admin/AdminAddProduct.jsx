import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage'; 

const categories = ['T-Shirts'];
const genders = ['Men', 'Women', 'Unisex'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const AddProduct = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [toast, setToast] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [uploadProgress, setUploadProgress] = useState(0); 

  const [newProduct, setNewProduct] = useState(() => {
    const savedProduct = localStorage.getItem('addProductForm');
    const initialSizes = sizes.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
    if (savedProduct) {
      const parsed = JSON.parse(savedProduct);
      return {
        name: parsed.name || '',
        description: parsed.description || '',
        price: parsed.price || '',
        strike_price: parsed.strike_price || '',
        category: parsed.category || '',
        gender: parsed.gender || '',
        size: parsed.size || initialSizes,
        care_guide: parsed.care_guide || '',
        composition_fabric: parsed.composition_fabric || '',
        shipping_info: parsed.shipping_info || '',
        exchange: parsed.exchange || '',
      };
    }
    return {
      name: '',
      description: '',
      price: '',
      strike_price: '',
      category: '',
      gender: '',
      size: initialSizes,
      care_guide: '',
      composition_fabric: '',
      shipping_info: '',
      exchange: '',
    };
  });

  useEffect(() => {
    const savedCustomCategory = localStorage.getItem('addProductCustomCategory');
    if (savedCustomCategory) {
      setCustomCategory(savedCustomCategory);
    }

    const savedImageFiles = localStorage.getItem('addProductImageFiles');
    if (savedImageFiles) {
      setToast({
        message: 'Image files were not persisted due to page refresh. Please re-upload the files.',
        type: 'warning',
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('addProductForm', JSON.stringify(newProduct));
    localStorage.setItem('addProductCustomCategory', customCategory);
    if (imageFiles.length > 0) {
      const imageFileNames = imageFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      localStorage.setItem('addProductImageFiles', JSON.stringify(imageFileNames));
    } else {
      localStorage.removeItem('addProductImageFiles');
    }
  }, [newProduct, customCategory, imageFiles]);

  const handleSizeStockChange = (size, value) => {
    const stockValue = Math.max(0, parseInt(value) || 0);
    setNewProduct({
      ...newProduct,
      size: { ...newProduct.size, [size]: stockValue },
    });
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setNewProduct({ ...newProduct, category: selectedCategory });
    if (selectedCategory !== 'Other') {
      setCustomCategory('');
    }
  };

  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
  };

  const handleAddProduct = async () => {
    if (isSubmitting) {
      return;
    }

    const finalCategory = newProduct.category === 'Other' ? customCategory.trim() : newProduct.category;
    const { name, description, price, strike_price, gender, size, care_guide, composition_fabric, shipping_info, exchange } = newProduct;

    // console.log('Validation inputs:', {
    //   name,
    //   description,
    //   price,
    //   strike_price,
    //   imageFiles: imageFiles.length,
    //   finalCategory,
    //   gender,
    //   size,
    //   care_guide,
    //   composition_fabric,
    //   shipping_info,
    //   exchange,
    // });

    const hasStock = Object.values(size).some(stock => stock > 0);

    if (!name || !description || !price || !strike_price || imageFiles.length === 0 || !finalCategory || !gender || !hasStock || !care_guide || !composition_fabric || !shipping_info || !exchange) {
      let errorMessage = 'Please fill all required fields, upload at least one image, specify stock for at least one size, and provide a strike price.';
      if (newProduct.category === 'Other' && !finalCategory) {
        errorMessage = 'Please enter a name for the custom category.';
      } else if (!newProduct.category) {
        errorMessage = 'Please select or enter a category.';
      }
      setToast({ message: errorMessage, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);
    setUploadProgress(0);

    const timeout = setTimeout(() => {
      setIsSubmitting(false);
      setToast({
        message: 'Operation timed out. Please check your connection and try again.',
        type: 'error',
      });
    }, 60000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // console.error('No active session');
        throw new Error('User not authenticated. Please log in again.');
      }

      const mediaUrls = [];
      const totalFiles = imageFiles.length;
      let filesUploaded = 0;

      const uploadWithTimeout = async (file, fileName) => {
        const timeout = 30000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), timeout)
        );
        const uploadPromise = supabase.storage.from('product-images').upload(fileName, file);
        return Promise.race([uploadPromise, timeoutPromise]);
      };

      for (const file of imageFiles) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10MB limit`);
        }
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          throw new Error(`File ${file.name} is not a valid image or video`);
        }
        const ext = file.name.split('.').pop();
        const fileName = `product-media/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: uploadError } = await uploadWithTimeout(file, fileName);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
          console.error('No public URL for:', fileName);
          throw new Error(`Failed to get public URL for ${file.name}`);
        }
        mediaUrls.push(urlData.publicUrl);
        filesUploaded += 1;
        setUploadProgress((prev) => {
          const newProgress = (filesUploaded / totalFiles) * 100;
          return newProgress;
        });
      }

      const { error: insertError } = await supabase.from('products').insert([
        {
          name,
          description,
          price: parseFloat(price),
          strike_price: parseFloat(strike_price),
          media_urls: mediaUrls,
          category: finalCategory,
          gender,
          size: JSON.stringify(size),
          care_guide,
          composition_fabric,
          shipping_info,
          exchange,
        },
      ]);

      if (insertError) {
        console.error('Insert Error:', insertError.message);
        throw new Error('Failed to add product to database.');
      }

      setToast({ message: 'Product added successfully!', type: 'success' });
      setNewProduct({
        name: '',
        description: '',
        price: '',
        strike_price: '',
        category: '',
        gender: '',
        size: sizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {}),
        care_guide: '',
        composition_fabric: '',
        shipping_info: '',
        exchange: '',
      });
      setImageFiles([]);
      setCustomCategory('');
      const fileInput = document.getElementById('product-image-input');
      if (fileInput) fileInput.value = '';
      
      localStorage.removeItem('addProductForm');
      localStorage.removeItem('addProductCustomCategory');
      localStorage.removeItem('addProductImageFiles');
    } catch (error) {
      console.error('Error adding product:', error.message, error.stack);
      setToast({
        message: error.message || 'Failed to add product. Please try again.',
        type: 'error',
      });
    } finally {
      clearTimeout(timeout);
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        marginBottom: '20px',
        fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
        fontWeight: 500,
        fontFamily: "'Oswald', sans-serif",
      }}>Add New Product</h2>

      <div style={formBox}>
        <label style={labelStyle}>Name <span style={asterisk}>*</span></label>
        <input 
          required 
          value={newProduct.name} 
          onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
          style={inputStyle} 
        />

        <label style={labelStyle}>Description <span style={asterisk}>*</span></label>
        <textarea 
          required 
          value={newProduct.description} 
          onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} 
          style={{ ...inputStyle, height: '80px' }} 
        />

        <label style={labelStyle}>Care Guide <span style={asterisk}>*</span></label>
        <textarea
          required
          value={newProduct.care_guide}
          onChange={e => setNewProduct({ ...newProduct, care_guide: e.target.value })}
          style={{ ...inputStyle, height: '80px' }}
          placeholder="Enter care instructions (e.g., wash instructions)"
        />

        <label style={labelStyle}>Composition/Fabric <span style={asterisk}>*</span></label>
        <textarea
          required
          value={newProduct.composition_fabric}
          onChange={e => setNewProduct({ ...newProduct, composition_fabric: e.target.value })}
          style={{ ...inputStyle, height: '80px' }}
          placeholder="Enter fabric composition (e.g., 100% Cotton, Cotton Blend)"
        />

        <label style={labelStyle}>Shipping Information <span style={asterisk}>*</span></label>
        <textarea
          required
          value={newProduct.shipping_info}
          onChange={e => setNewProduct({ ...newProduct, shipping_info: e.target.value })}
          style={{ ...inputStyle, height: '80px' }}
          placeholder="Enter shipping details (e.g., shipping methods)"
        />

        <label style={labelStyle}>Exchange Policy <span style={asterisk}>*</span></label>
        <textarea
          required
          value={newProduct.exchange}
          onChange={e => setNewProduct({ ...newProduct, exchange: e.target.value })}
          style={{ ...inputStyle, height: '80px' }}
          placeholder="Enter exchange policy (e.g., conditions for exchange)"
        />

        <label style={labelStyle}>Price <span style={asterisk}>*</span></label>
        <input 
          type="number" 
          required 
          min="0" 
          step="0.01" 
          value={newProduct.price} 
          onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} 
          style={inputStyle} 
        />

        <label style={labelStyle}>Strike Price <span style={asterisk}>*</span></label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={newProduct.strike_price}
          onChange={e => setNewProduct({ ...newProduct, strike_price: e.target.value })}
          style={inputStyle}
          placeholder="Enter original price"
        />

        <label style={labelStyle}>Images and Video (Recommended: h 600, w 400) <span style={asterisk}>*</span></label>
        <input
          id="product-image-input"
          type="file"
          required
          multiple
          accept="image/*,video/*"
          onChange={e => setImageFiles(Array.from(e.target.files))}
          style={inputStyle}
        />
        {imageFiles.length > 0 && (
          <div style={{ fontSize: '0.9em', marginBottom: '10px', color: '#555' }}>
            Selected files: {imageFiles.map(f => f.name).join(', ')}
          </div>
        )}

        <label style={labelStyle}>Category <span style={asterisk}>*</span></label>
        <select
          required
          value={newProduct.category}
          onChange={handleCategoryChange}
          style={inputStyle}
        >
          <option value="">Select Category</option>
          {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
          <option value="Other">Other (Specify Below)</option>
        </select>

        {newProduct.category === 'Other' && (
          <input
            type="text"
            placeholder="Enter custom category name"
            value={customCategory}
            onChange={handleCustomCategoryChange}
            required
            style={{ ...inputStyle, marginTop: '5px', marginBottom: '10px' }}
          />
        )}

        <label style={labelStyle}>Gender <span style={asterisk}>*</span></label>
        <select 
          required 
          value={newProduct.gender} 
          onChange={e => setNewProduct({ ...newProduct, gender: e.target.value })} 
          style={inputStyle}
        >
          <option value="">Select Gender</option>
          {genders.map((g, i) => <option key={i} value={g}>{g}</option>)}
        </select>

        <label style={labelStyle}>Size Availability <span style={asterisk}>*</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {sizes.map((size) => (
            <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', minWidth: '30px' }}>{size}</label>
              <input
                type="number"
                min="0"
                value={newProduct.size[size] || 0}
                onChange={(e) => handleSizeStockChange(size, e.target.value)}
                style={{
                  ...inputStyle,
                  width: '80px',
                  padding: '6px',
                  marginBottom: '0',
                }}
                placeholder="Stock"
              />
            </div>
          ))}
        </div>

        {isSubmitting ? (
          <div style={{ marginTop: '10px' }}>
            <div style={{
              width: '100%',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              height: '8px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: '#000',
                  height: '100%',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '0.9rem' }}>
              Uploading: {Math.round(uploadProgress)}%
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddProduct}
            style={buttonStyle}
          >
            Add Product
          </button>
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

// Styles
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
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
};

const labelStyle = {
  fontWeight: '500',
  marginBottom: '5px',
  display: 'block'
};

const asterisk = {
  color: 'red',
  marginLeft: '2px'
};

export default AddProduct;