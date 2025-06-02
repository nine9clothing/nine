import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ToastMessage from '../../ToastMessage';

const categories = ['T-Shirts'];
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
      // console.error('Error loading products:', error.message);
      setToast({ message: 'Failed to load products.', type: 'error' });
      setProducts([]);
      setFilteredProducts([]);
    } else {
      const parsedData = data.map(product => ({
        ...product,
        size: typeof product.size === 'string' ? JSON.parse(product.size) : product.size || {},
        strike_price: product.strike_price || null, 
      }));
      setProducts(parsedData || []);
      setFilteredProducts(parsedData || []);
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
        // console.error('Error deleting product record:', deleteError);
        throw new Error('Failed to delete product from database.');
      }

      if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
        const filePaths = mediaUrls
          .map(url => {
            try {
              const urlParts = new URL(url);
              const pathSegments = urlParts.pathname.split('/');
              const bucketNameIndex = pathSegments.indexOf('product-images');
              if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathSegments.length) {
                return pathSegments.slice(bucketNameIndex + 1).join('/');
              }
              // console.warn('Could not parse file path from URL:', url);
              return null;
            } catch (e) {
              // console.error('Error parsing media URL:', url, e);
              return null;
            }
          })
          .filter(path => path !== null);

        if (filePaths.length > 0) {
          const { data: deleteData, error: storageError } = await supabase.storage
            .from('product-images')
            .remove(filePaths);

          if (storageError) {
            // console.error('Error deleting product media from storage:', storageError);
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
    setEditFormData({
      ...product,
      size: product.size || sizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {}),
      care_guide: product.care_guide || '',
      composition_fabric: product.composition_fabric || '',
      shipping_info: product.shipping_info || '',
      exchange: product.exchange || '',
      strike_price: product.strike_price || '', // NEW: Initialize strike_price
    });
  };

  const handleEditCancel = () => {
    setEditingProductId(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeStockChange = (size, value) => {
    const stockValue = Math.max(0, parseInt(value) || 0);
    setEditFormData(prev => ({
      ...prev,
      size: { ...prev.size, [size]: stockValue },
    }));
  };

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setToast(null);

    const {
      id,
      name,
      description,
      price,
      category,
      gender,
      size,
      care_guide,
      composition_fabric,
      shipping_info,
      exchange,
      strike_price, // NEW: Destructure strike_price
    } = editFormData;

    const hasStock = Object.values(size).some(stock => stock > 0);

    // NEW: Validate strike_price (optional, can be null or a number)
    if (!name || !description || !price || !category || !gender || !hasStock || !care_guide || !composition_fabric || !shipping_info || !exchange) {
      setToast({ message: 'All required fields must be filled, and at least one size must have stock.', type: 'error' });
      setIsUpdating(false);
      return;
    }

    // NEW: Ensure strike_price is either a number or null
    const formattedStrikePrice = strike_price ? parseFloat(strike_price) : null;

    try {
      const { error } = await supabase.from('products').update({
        name,
        description,
        price: parseFloat(price),
        category,
        gender,
        size: JSON.stringify(size),
        care_guide,
        composition_fabric,
        shipping_info,
        exchange,
        strike_price: formattedStrikePrice, 
      }).eq('id', id);

      if (error) {
        // console.error('Update Error:', error);
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
    return <p style={{ fontSize: '0.8em', color: 'grey' }}>Unsupported media type</p>;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2
        style={{
          fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem',
          fontWeight: 500,
          fontFamily: "'Oswald', sans-serif",
          marginBottom: '20px',
        }}
      >
        View & Manage Products
      </h2>

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

      {loading ? (
        <p>Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
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
                    style={{ ...inputStyleSmall, backgroundColor: '#f0f0f0' }}
                    disabled
                  />

                  <label style={labelStyleSmall}>Name</label>
                  <input
                    value={editFormData.name || ''}
                    onChange={e => handleEditChange('name', e.target.value)}
                    style={inputStyleSmall}
                  />

                  <label style={labelStyleSmall}>Price</label>
                  <input
                    value={editFormData.price || ''}
                    type="number"
                    min="0"
                    step="0.01"
                    onChange={e => handleEditChange('price', e.target.value)}
                    style={inputStyleSmall}
                  />

                  <label style={labelStyleSmall}>Strike Price</label>
                  <input
                    value={editFormData.strike_price || ''}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter strike price"
                    onChange={e => handleEditChange('strike_price', e.target.value)}
                    style={inputStyleSmall}
                  />

                  <label style={labelStyleSmall}>Category</label>
                  <select
                    value={editFormData.category || ''}
                    onChange={e => handleEditChange('category', e.target.value)}
                    style={inputStyleSmall}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                    {!categories.includes(editFormData.category) && editFormData.category && (
                      <option value={editFormData.category}>{editFormData.category} (Custom)</option>
                    )}
                  </select>

                  <label style={labelStyleSmall}>Gender</label>
                  <select
                    value={editFormData.gender || ''}
                    onChange={e => handleEditChange('gender', e.target.value)}
                    style={inputStyleSmall}
                  >
                    <option value="">Select Gender</option>
                    {genders.map((g, i) => (
                      <option key={i} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  <label style={labelStyleSmall}>Size Availability</label>
                  <div style={sizeContainerStyle}>
                    <div style={checkboxRowStyle}>
                      {sizes.map((size, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '0.9rem', minWidth: '30px' }}>{size}</label>
                          <input
                            type="number"
                            min="0"
                            value={editFormData.size[size] || 0}
                            onChange={e => handleSizeStockChange(size, e.target.value)}
                            style={{
                              ...inputStyleSmall,
                              width: '80px',
                              padding: '6px',
                              marginBottom: '0',
                            }}
                            placeholder="Stock"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <label style={labelStyleSmall}>Description</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={e => handleEditChange('description', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPosition = e.target.selectionStart;
                        const textBeforeCursor = editFormData.description.slice(0, cursorPosition);
                        const textAfterCursor = editFormData.description.slice(cursorPosition);
                        const newValue = `${textBeforeCursor}\n• ${textAfterCursor}`;
                        handleEditChange('description', newValue);
                        setTimeout(() => {
                          e.target.selectionStart = cursorPosition + 3;
                          e.target.selectionEnd = cursorPosition + 3;
                        }, 0);
                      }
                    }}
                    style={{ ...inputStyleSmall, height: '60px' }}
                  />

                  <label style={labelStyleSmall}>Care Guide</label>
                  <textarea
                    value={editFormData.care_guide || ''}
                    onChange={e => handleEditChange('care_guide', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPosition = e.target.selectionStart;
                        const textBeforeCursor = editFormData.care_guide.slice(0, cursorPosition);
                        const textAfterCursor = editFormData.care_guide.slice(cursorPosition);
                        const newValue = `${textBeforeCursor}\n• ${textAfterCursor}`;
                        handleEditChange('care_guide', newValue);
                        setTimeout(() => {
                          e.target.selectionStart = cursorPosition + 3;
                          e.target.selectionEnd = cursorPosition + 3;
                        }, 0);
                      }
                    }}
                    style={{ ...inputStyleSmall, height: '60px' }}
                  />

                  <label style={labelStyleSmall}>Composition Fabric</label>
                  <textarea
                    value={editFormData.composition_fabric || ''}
                    onChange={e => handleEditChange('composition_fabric', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPosition = e.target.selectionStart;
                        const textBeforeCursor = editFormData.composition_fabric.slice(0, cursorPosition);
                        const textAfterCursor = editFormData.composition_fabric.slice(cursorPosition);
                        const newValue = `${textBeforeCursor}\n• ${textAfterCursor}`;
                        handleEditChange('composition_fabric', newValue);
                        setTimeout(() => {
                          e.target.selectionStart = cursorPosition + 3;
                          e.target.selectionEnd = cursorPosition + 3;
                        }, 0);
                      }
                    }}
                    style={{ ...inputStyleSmall, height: '60px' }}
                  />

                  <label style={labelStyleSmall}>Shipping Information</label>
                  <textarea
                    value={editFormData.shipping_info || ''}
                    onChange={e => handleEditChange('shipping_info', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPosition = e.target.selectionStart;
                        const textBeforeCursor = editFormData.shipping_info.slice(0, cursorPosition);
                        const textAfterCursor = editFormData.shipping_info.slice(cursorPosition);
                        const newValue = `${textBeforeCursor}\n• ${textAfterCursor}`;
                        handleEditChange('shipping_info', newValue);
                        setTimeout(() => {
                          e.target.selectionStart = cursorPosition + 3;
                          e.target.selectionEnd = cursorPosition + 3;
                        }, 0);
                      }
                    }}
                    style={{ ...inputStyleSmall, height: '60px' }}
                  />

                  <label style={labelStyleSmall}>Exchange Policy</label>
                  <textarea
                    value={editFormData.exchange || ''}
                    onChange={e => handleEditChange('exchange', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPosition = e.target.selectionStart;
                        const textBeforeCursor = editFormData.exchange.slice(0, cursorPosition);
                        const textAfterCursor = editFormData.exchange.slice(cursorPosition);
                        const newValue = `${textBeforeCursor}\n• ${textAfterCursor}`;
                        handleEditChange('exchange', newValue);
                        setTimeout(() => {
                          e.target.selectionStart = cursorPosition + 3;
                          e.target.selectionEnd = cursorPosition + 3;
                        }, 0);
                      }
                    }}
                    style={{ ...inputStyleSmall, height: '60px' }}
                  />

                  <div style={{ marginTop: '15px' }}>
                    <button onClick={handleUpdate} style={buttonStyle} disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                    ID: {product.id}
                  </p>
                  <h4>{product.name}</h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>₹{product.price}</p>
                    {/* NEW: Display strike_price if it exists */}
                    {product.strike_price && (
                      <p
                        style={{
                          margin: '5px 0',
                          fontWeight: 'normal',
                          color: '#888',
                          textDecoration: 'line-through',
                        }}
                      >
                        ₹{product.strike_price}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '5px' }}>
                    {product.category} | {product.gender} | Sizes:{' '}
                    {Object.entries(product.size)
                      .filter(([_, stock]) => stock > 0)
                      .map(([size, stock]) => `${size} (${stock})`)
                      .join(', ') || 'None'}
                  </p>
                  {product.care_guide && (
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                      Care Guide: {product.care_guide}
                    </p>
                  )}
                  {product.composition_fabric && (
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                      Composition: {product.composition_fabric}
                    </p>
                  )}
                  {product.shipping_info && (
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                      Shipping: {product.shipping_info}
                    </p>
                  )}
                  {product.exchange && (
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
                      Exchange: {product.exchange}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '15px',
                    }}
                  >
                    {product.description}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    {confirmingDeleteId === product.id ? (
                      <>
                        <span
                          style={{ marginRight: '10px', fontSize: '0.9em', fontWeight: 'bold', color: '#dc3545' }}
                        >
                          Confirm delete?
                        </span>
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

// Styles remain unchanged
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
  fontWeight: 'bold',
  marginBottom: '3px',
  fontSize: '0.85rem',
  display: 'block',
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
  opacity: '1',
  transition: 'opacity 0.2s ease, background-color 0.2s ease',
};
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '25px',
  marginTop: '20px',
};
const productBox = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: 'white',
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

export default ViewProducts;