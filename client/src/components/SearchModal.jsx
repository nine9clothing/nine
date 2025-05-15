import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import ToastMessage from '../ToastMessage.jsx';

const SearchModal = ({ isOpen, onClose, initialQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (isOpen && initialQuery.trim()) {
      handleSearch({ preventDefault: () => {} }); 
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ show: false, message: '', type: '' });

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(
          `name.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%,` +
          `gender.ilike.%${searchQuery}%`
        );

      if (error) {
        console.error('Error searching products:', error);
        setToast({ show: true, message: `Failed to search products: ${error.message}`, type: 'error' });
        setProducts([]);
        return;
      }

      if (data.length === 0) {
        setToast({ show: true, message: 'No products found matching your search.', type: 'info' });
        setProducts([]);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Unexpected error during search:', error);
      setToast({ show: true, message: `Unexpected error: ${error.message}`, type: 'error' });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: '1.5rem',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#000000',
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontFamily: '"Abril Extra Bold", sans-serif' 
        }}>Search Products</h2>

        {toast.show && (
          <ToastMessage
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: '' })}
          />
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords (e.g., colors, product names, description, gender)..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '1rem',
              color: '#000000',
              backgroundColor: '#ffffff',
              transition: 'border-color 0.2s',
              fontFamily: '"Louvette Semi Bold", sans-serif'
            }}
            onFocus={(e) => e.target.style.borderColor = '#80bdff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery}
            style={{
              marginTop: '1rem',
              width: '100%',
              backgroundColor: loading || !searchQuery ? '#cccccc' : '#000000',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '20px',
              border: 'none',
              cursor: loading || !searchQuery ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              fontFamily: '"Abril Extra Bold", sans-serif'
            }}
            onMouseOver={(e) => {
              if (!loading && searchQuery) e.target.style.backgroundColor = '#333333';
            }}
            onMouseOut={(e) => {
              if (!loading && searchQuery) e.target.style.backgroundColor = '#000000';
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {products.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '1rem',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '1rem',
              fontFamily: '"Abril Extra Bold", sans-serif' 
            }}>Results</h3>
            <div style={{
              display: 'grid',
              gap: '1rem',
              maxHeight: '40vh',
              overflowY: 'auto',
            }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #dee2e6',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500', color: '#6c757d', fontFamily: '"Louvette Semi Bold", sans-serif' }}>Name: </span>
                    <span style={{ color: '#000000', fontFamily: '"Abril Extra Bold", sans-serif' }}>{product.name}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500', color: '#6c757d', fontFamily: '"Louvette Semi Bold", sans-serif' }}>Category: </span>
                    <span style={{ color: '#000000', fontFamily: '"Louvette Semi Bold", sans-serif' }}>{product.category}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500', color: '#6c757d', fontFamily: '"Louvette Semi Bold", sans-serif' }}>Description: </span>
                    <span style={{ color: '#000000', fontFamily: '"Louvette Semi Bold", sans-serif' }}>{product.description}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500', color: '#6c757d', fontFamily: '"Louvette Semi Bold", sans-serif' }}>Gender: </span>
                    <span style={{ color: '#000000', fontFamily: '"Louvette Semi Bold", sans-serif' }}>{product.gender}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;