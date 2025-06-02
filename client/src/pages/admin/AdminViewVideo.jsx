import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import ToastMessage from '../../ToastMessage'; 

const ViewVideos = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVideos = async () => {
    setLoading(true);
    setConfirmingDeleteId(null); 
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        setToast({ message: 'Failed to load videos.', type: 'error' });
        setVideos([]);
        setFilteredVideos([]);
    } else {
        setVideos(data || []);
        setFilteredVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const filtered = videos.filter(video => 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.id.toString().includes(searchTerm)
    );
    setFilteredVideos(filtered);
  }, [searchTerm, videos]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteRequest = (id, title) => {
    setToast(null); 
    setConfirmingDeleteId(id); 
    setToast({ message: `Please confirm deletion for "${title}".`, type: 'info', duration: 5000 });
    if (editingVideoId === id) {
        handleEditCancel();
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null); 
    setToast({ message: 'Deletion cancelled.', type: 'info', duration: 3000 }); 
  };

  const executeDelete = async (id, mediaUrl) => {
    if (isDeleting) return;
    setIsDeleting(true);
    setToast(null);

    try {
        const { error: deleteError } = await supabase.from('videos').delete().eq('id', id);
        if (deleteError) {
            throw new Error('Failed to delete video from database.');
        }

        if (mediaUrl) {
            try {
                const urlParts = new URL(mediaUrl);
                const pathSegments = urlParts.pathname.split('/');
                const bucketNameIndex = pathSegments.indexOf('home-video');
                if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathSegments.length) {
                    const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');
                    
                    const { error: storageError } = await supabase.storage
                        .from('home-video')
                        .remove([filePath]);

                    if (storageError) {
                        setToast({ message: 'Video record deleted, but failed to delete the media file.', type: 'warning' });
                    } else {
                        setToast({ message: 'Video and associated media deleted successfully!', type: 'success' });
                    }
                } else {
                    setToast({ message: 'Video record deleted, but media file may remain in storage.', type: 'warning' });
                }
            } catch (e) {
                setToast({ message: 'Video record deleted, but media file could not be processed.', type: 'warning' });
            }
        } else {
            setToast({ message: 'Video record deleted successfully!', type: 'success' });
        }

        fetchVideos();
    } catch (error) {
        setToast({ message: error.message || 'An error occurred during deletion.', type: 'error' });
    } finally {
        setIsDeleting(false); 
        setConfirmingDeleteId(null); 
    }
  };

  const handleEditStart = (video) => {
    setConfirmingDeleteId(null); 
    setEditingVideoId(video.id);
    setEditFormData({ ...video });
  };

  const handleEditCancel = () => {
    setEditingVideoId(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setToast(null);

    const { id, title, description } = editFormData;

    if (!title) {
        setToast({ message: 'Title is required for update.', type: 'error' });
        setIsUpdating(false);
        return;
    }

    try {
        const { error } = await supabase.from('videos').update({
            title,
            description: description || ''
        }).eq('id', id);

        if (error) {
            throw new Error('Failed to update video.');
        }

        setToast({ message: 'Video updated successfully!', type: 'success' });
        setEditingVideoId(null);
        setEditFormData({});
        fetchVideos();

    } catch (error) {
        setToast({ message: error.message || 'An unexpected error occurred during update.', type: 'error' });
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: window.innerWidth <= 768 ? '2.0rem' : '2.2rem', fontWeight: 500,
        fontFamily: "'Oswald', sans-serif", marginBottom: '20px' }}>
        View & Manage Videos
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by video title..."
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

      {loading ? <p>Loading videos...</p> : (
        filteredVideos.length === 0 ? <p>No videos found.</p> : (
          <div style={gridStyle}>
            {filteredVideos.map(video => (
              <div key={video.id} style={videoBox}>
                {video.media_url && (
                  <div style={mediaContainerStyle}>
                    <video 
                      controls
                      style={videoPlayerStyle}
                      poster={video.thumbnail_url || undefined}
                    >
                      <source src={video.media_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {editingVideoId === video.id ? (
                  <>
                    <label style={labelStyleSmall}>Video ID</label>
                    <input 
                      value={editFormData.id || ''} 
                      style={{...inputStyleSmall, backgroundColor: '#f0f0f0'}} 
                      disabled 
                    />

                    <label style={labelStyleSmall}>Title</label>
                    <input value={editFormData.title || ''} onChange={e => handleEditChange('title', e.target.value)} style={inputStyleSmall} />

                    <label style={labelStyleSmall}>Description</label>
                    <textarea 
                      value={editFormData.description || ''} 
                      onChange={e => handleEditChange('description', e.target.value)} 
                      style={{...inputStyleSmall, height: '60px'}} 
                    />

                    <div style={{ marginTop: '15px' }}>
                      <button onClick={handleUpdate} style={buttonStyle} disabled={isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={handleEditCancel} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                      ID: {video.id}
                    </p> */}
                    <h4 style={{marginTop: '10px', marginBottom: '5px'}}>{video.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                      {video.description || 'No description provided'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>
                      Added: {new Date(video.created_at).toLocaleDateString()}
                    </p>

                    <div style={{ marginTop: 'auto' }}>
                      {confirmingDeleteId === video.id ? (
                        <>
                          <span style={{ marginRight: '10px', fontSize: '0.9em', fontWeight: 'bold', color: '#dc3545' }}>
                            Confirm delete?
                          </span>
                          <button
                            onClick={() => executeDelete(video.id, video.media_url)}
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
                            onClick={() => handleEditStart(video)}
                            style={buttonStyle}
                            disabled={isDeleting} 
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(video.id, video.title)}
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

// Styles
const inputStyleSmall = {
  width: '100%',
  padding: '8px',
  marginBottom: '8px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
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
    gridTemplateColumns: 'repeat(auto-fill,minmax(280px, 1fr))',
    gap: '25px',
    marginTop: '20px',
    justifyContent: 'center'
};
  
const videoBox = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.2s ease-in-out',
};

const mediaContainerStyle = {
  position: 'relative',
  marginBottom: '12px',
  backgroundColor: '#000',
  borderRadius: '8px',
  overflow: 'hidden',
};

const videoPlayerStyle = {
  display: 'block',
  width: '100%',
  height: '200px',
  borderRadius: '8px',
  backgroundColor: '#000',
};

export default ViewVideos;