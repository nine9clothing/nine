import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust path
import ToastMessage from '../../ToastMessage'; // Adjust path

const categories = ['T-Shirts', 'Hoodies', 'Jeans', 'Accessories'];
const genders = ['Men', 'Women', 'Unisex'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const AddProduct = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [toast, setToast] = useState(null); // Toast message state for this component
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submits

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '', // This will hold the selected value ('T-Shirts', 'Hoodies', 'Other', etc.)
    gender: '',
    size: [],
    care_guide: '', // New field for care guide (text input)
    composition_fabric: '', // New field for fabric composition (text input)
  });

  const toggleSize = (selected) => {
    const updated = newProduct.size.includes(selected)
      ? newProduct.size.filter(s => s !== selected)
      : [...newProduct.size, selected];
    setNewProduct({ ...newProduct, size: updated });
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setNewProduct({ ...newProduct, category: selectedCategory });
    if (selectedCategory !== 'Other') {
      setCustomCategory('');
    }
  };

  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value); // Only update the customCategory state
  };

  const handleAddProduct = async () => {
    if (isSubmitting) return;

    const finalCategory = newProduct.category === 'Other' ? customCategory.trim() : newProduct.category;
    const { name, description, price, gender, size, care_guide, composition_fabric } = newProduct;

    if (!name || !description || !price || imageFiles.length === 0 || !finalCategory || !gender || size.length === 0 || !care_guide || !composition_fabric) {
      let errorMessage = 'Please fill all required fields and upload at least one image.';
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

    try {
      const mediaUrls = [];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const fileName = `product-media/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          throw new Error('Failed to upload one of the files.');
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
            console.error('Error getting public URL for:', fileName);
            throw new Error('Failed to get public URL for an uploaded file.');
        }
        mediaUrls.push(urlData.publicUrl);
      }

      // Insert product data
      const { error: insertError } = await supabase.from('products').insert([{
        name,
        description,
        price: parseFloat(price),
        media_urls: mediaUrls,
        category: finalCategory,
        gender,
        size: size.join(','),
        care_guide, // Save new field
        composition_fabric, // Save new field
      }]);

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw new Error('Failed to add product to database.');
      }

      setToast({ message: 'Product added successfully!', type: 'success' });
      // Reset form
      setNewProduct({ name: '', description: '', price: '', category: '', gender: '', size: [], care_guide: '', composition_fabric: '' });
      setImageFiles([]);
      setCustomCategory(''); // Reset custom category state
      const fileInput = document.getElementById('product-image-input');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error adding product:', error);
      setToast({ message: error.message || 'An unexpected error occurred.', type: 'error' });
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
      }}>Add New Product</h2>

      <div style={formBox}>
        <label style={labelStyle}>Name <span style={asterisk}>*</span></label>
        <input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={inputStyle} />

        <label style={labelStyle}>Description <span style={asterisk}>*</span></label>
        <textarea required value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ ...inputStyle, height: '80px' }} />

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

        <label style={labelStyle}>Price <span style={asterisk}>*</span></label>
        <input type="number" required min="0" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} />

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
        <select required value={newProduct.gender} onChange={e => setNewProduct({ ...newProduct, gender: e.target.value })} style={inputStyle}>
          <option value="">Select Gender</option>
          {genders.map((g, i) => <option key={i} value={g}>{g}</option>)}
        </select>

        <label style={labelStyle}>Size <span style={asterisk}>*</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                backgroundColor: newProduct.size.includes(size) ? '#000' : '#fff',
                color: newProduct.size.includes(size) ? '#fff' : '#000',
                cursor: 'pointer'
              }}
              type="button" 
            >
              {size}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddProduct}
          style={isSubmitting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Product'}
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

// Styles (Keep relevant styles or import from a shared file)
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