import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage'; 

const categories = ['T-Shirts', 'Hoodies', 'Jeans', 'Accessories']; 
const genders = ['Men', 'Women', 'Unisex']; 
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']; 

const ViewProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setConfirmingDeleteId(null); 
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading products:', error.message);
        setToast({ message: 'Failed to load products.', type: 'error' });
        setProducts([]);
        setFilteredProducts([]);
    } else {
        setProducts(data || []);
        setFilteredProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toString().includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteRequest = (id, name) => {
    setToast(null); 
    setConfirmingDeleteId(id); 
    setToast({ message: `Please confirm deletion for "${name}".`, type: 'info', duration: 5000 });
    if (editingProductId === id) {
        handleEditCancel();
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null); 
    setToast({ message: 'Deletion cancelled.', type: 'info', duration: 3000 }); 
  };

  const executeDelete = async (id, mediaUrls) => {
    if (isDeleting) return;
    setIsDeleting(true);
    setToast(null);

    try {
        const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
        if (deleteError) {
            console.error('Error deleting product record:', deleteError);
            throw new Error('Failed to delete product from database.');
        }

        if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
            const filePaths = mediaUrls.map(url => {
                try {
                    const urlParts = new URL(url);
                    const pathSegments = urlParts.pathname.split('/');
                    const bucketNameIndex = pathSegments.indexOf('product-images');
                    if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathSegments.length) {
                        return pathSegments.slice(bucketNameIndex + 1).join('/');
                    }
                    console.warn('Could not parse file path from URL:', url);
                    return null;
                } catch (e) {
                    console.error('Error parsing media URL:', url, e);
                    return null;
                }
            }).filter(path => path !== null);

            if (filePaths.length > 0) {
                const { data: deleteData, error: storageError } = await supabase.storage
                    .from('product-images')
                    .remove(filePaths);

                if (storageError) {
                    console.error('Error deleting product media from storage:', storageError);
                    setToast({ message: 'Product record deleted, but failed to delete some media files.', type: 'warning' });
                } else {
                    setToast({ message: 'Product and associated media deleted successfully!', type: 'success' });
                }
            } else {
                 setToast({ message: 'Product record deleted successfully!', type: 'success' });
            }
        } else {
             setToast({ message: 'Product record deleted successfully!', type: 'success' });
        }

        fetchProducts();
    } catch (error) {
        setToast({ message: error.message || 'An error occurred during deletion.', type: 'error' });
    } finally {
        setIsDeleting(false); 
        setConfirmingDeleteId(null); 
    }
  };

  const handleEditStart = (product) => {
    setConfirmingDeleteId(null); 
    setEditingProductId(product.id);
    setEditFormData({ ...product, size: product.size ? product.size.split(',').map(s => s.trim()) : [] });
  };

  const handleEditCancel = () => {
    setEditingProductId(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeChange = (size) => {
    setEditFormData(prev => {
      const currentSizes = prev.size || [];
      if (currentSizes.includes(size)) {
        return { ...prev, size: currentSizes.filter(s => s !== size) };
      } else {
        return { ...prev, size: [...currentSizes, size] };
      }
    });
  };

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setToast(null);

    const { id, name, description, price, category, gender, size } = editFormData;

    if (!name || !description || !price || !category || !gender || !size || size.length === 0) {
        setToast({ message: 'All fields must be filled, including at least one size, for update.', type: 'error' });
        setIsUpdating(false);
        return;
    }

    try {
        const { error } = await supabase.from('products').update({
            name,
            description,
            price: parseFloat(price),
            category,
            gender,
            size: Array.isArray(size) ? size.join(',') : size
        }).eq('id', id);

        if (error) {
            console.error('Update Error:', error);
            throw new Error('Failed to update product.');
        }

        setToast({ message: 'Product updated successfully!', type: 'success' });
        setEditingProductId(null);
        setEditFormData({});
        fetchProducts();

    } catch (error) {
        setToast({ message: error.message || 'An unexpected error occurred during update.', type: 'error' });
    } finally {
        setIsUpdating(false);
    }
  };

  const renderMedia = (url, altText) => {
      if (!url) return null;
      if (url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
          return <img src={url} alt={altText} style={imageStyle} />;
      } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
          return (
              <video width="100%" height="180" controls style={videoStyle}>
                  <source src={url} type={`video/${url.split('.').pop()}`} />
                  Your browser does not support the video tag.
              </video>
          );
      }
      return <p style={{fontSize: '0.8em', color: 'grey'}}>Unsupported media type</p>;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', fontWeight: 500,
    fontFamily: "'Oswald', sans-serif", marginBottom: '20px' }}>View & Manage Products</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
        
          type="text"
          placeholder="Search by product name or ID..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
            color: '#1f2937',
            minWidth: '150px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            width: '100%',
            maxWidth: '400px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading ? <p>Loading products...</p> : (
        filteredProducts.length === 0 ? <p>No products found.</p> : (
          <div style={gridStyle}>
            {filteredProducts.map(product => (
              <div key={product.id} style={productBox}>
                 {Array.isArray(product.media_urls) && product.media_urls.length > 0 && (
                  <div style={mediaContainerStyle}>
                    {renderMedia(product.media_urls[0], product.name)}
                    {product.media_urls.length > 1 && (
                        <span style={mediaCountStyle}>+{product.media_urls.length - 1} more</span>
                    )}
                  </div>
                )}

                {editingProductId === product.id ? (
                  <>
                    <label style={labelStyleSmall}>Product ID</label>
                    <input 
                      value={editFormData.id || ''} 
                      style={{...inputStyleSmall, backgroundColor: '#f0f0f0'}} 
                      disabled 
                    />

                    <label style={labelStyleSmall}>Name</label>
                    <input value={editFormData.name || ''} onChange={e => handleEditChange('name', e.target.value)} style={inputStyleSmall} />

                    <label style={labelStyleSmall}>Description</label>
                    <textarea value={editFormData.description || ''} onChange={e => handleEditChange('description', e.target.value)} style={{...inputStyleSmall, height: '60px'}} />

                    <label style={labelStyleSmall}>Price</label>
                    <input value={editFormData.price || ''} type="number" min="0" step="0.01" onChange={e => handleEditChange('price', e.target.value)} style={inputStyleSmall} />

                    <label style={labelStyleSmall}>Category</label>
                    <select value={editFormData.category || ''} onChange={e => handleEditChange('category', e.target.value)} style={inputStyleSmall}>
                      <option value="">Select Category</option>
                      {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                      {!categories.includes(editFormData.category) && editFormData.category && (
                          <option value={editFormData.category}>{editFormData.category} (Custom)</option>
                      )}
                    </select>

                    <label style={labelStyleSmall}>Gender</label>
                    <select value={editFormData.gender || ''} onChange={e => handleEditChange('gender', e.target.value)} style={inputStyleSmall}>
                      <option value="">Select Gender</option>
                      {genders.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>

                    <label style={labelStyleSmall}>Sizes</label>
                    <div style={sizeContainerStyle}>
                      <div style={checkboxRowStyle}>
                        {sizes.map((size, index) => (
                          <label key={index} style={checkboxLabelStyle}>
                            <input
                              type="checkbox"
                              checked={editFormData.size?.includes(size) || false}
                              onChange={() => handleSizeChange(size)}
                              style={checkboxStyle}
                            />
                            {size}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <button onClick={handleUpdate} style={buttonStyle} disabled={isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={handleEditCancel} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                      ID: {product.id}
                    </p>
                    <h4>{product.name}</h4>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>₹{product.price}</p>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '10px' }}>
                        {product.category} | {product.gender} | Sizes: {product.size}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#666', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '15px' }}>
                        {product.description}
                    </p>

                    <div style={{ marginTop: 'auto' }}>
                        {confirmingDeleteId === product.id ? (
                             <>
                                <span style={{ marginRight: '10px', fontSize: '0.9em', fontWeight: 'bold', color: '#dc3545' }}>Confirm delete?</span>
                                <button
                                    onClick={() => executeDelete(product.id, product.media_urls)}
                                    style={{ ...buttonStyle, backgroundColor: '#c82333' }} 
                                    disabled={isDeleting} 
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={handleCancelDelete}
                                    style={{ ...buttonStyle, backgroundColor: '#6c757d' }} 
                                    disabled={isDeleting} 
                                >
                                    Cancel
                                </button>
                             </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleEditStart(product)}
                                    style={buttonStyle}
                                    disabled={isDeleting} 
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteRequest(product.id, product.name)}
                                    style={{ ...buttonStyle, backgroundColor: '#dc3545' }}
                                    disabled={isDeleting} 
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          duration={toast.duration} 
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
const inputStyleSmall = {
    ...inputStyle,
    padding: '8px',
    fontSize: '0.9rem',
    marginBottom: '8px',
};
const labelStyleSmall = {
    fontWeight: '500',
    marginBottom: '3px',
    fontSize: '0.85rem',
    display: 'block'
};
const buttonStyle = {
  padding: '8px 12px',
  backgroundColor: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginRight: '6px',
  fontSize: '0.9rem',
  opacity: 1,
  transition: 'opacity 0.2s ease, background-color 0.2s ease',
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
  maxWidth: '400px', // Added to cap the stretching
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
const videoStyle = {
    display: 'block',
    width: '100%',
    height: '200px',
    borderRadius: '8px',
    backgroundColor: '#000',
    marginBottom: '12px',
};
const mediaCountStyle = {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.8em',
    fontWeight: 'bold',
};
const sizeContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '15px',
  padding: '10px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
};
const checkboxRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '15px',
};
const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '0.9rem',
};
const checkboxStyle = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
};

export default ViewProducts;