import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageGallery from '../components/ImageGallery';
import ImagePreviewModal from '../components/ImagePreviewModal';
import SearchBar from '../components/SearchBar';
import { deleteImage, fetchImages, searchImages } from '../services/api';
import { Image } from '../types';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadImages = useCallback(
    async ({ preserveSearch = false, search = '' } = {}) => {
      try {
        if (preserveSearch) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setSearchQuery('');
        }
        setErrorMessage(null);
        const data = await fetchImages();
        setAllImages(data);

        const activeQuery = preserveSearch ? search.trim() : '';
        if (activeQuery) {
          try {
            const searchResults = await searchImages(activeQuery);
            setImages(searchResults);
          } catch (searchError) {
            console.error('Error searching images:', searchError);
            setImages(data);
            const message =
              searchError instanceof Error ? searchError.message : 'Failed to refine images.';
            setErrorMessage(message);
          }
        } else {
          setImages(data);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        const message = error instanceof Error ? error.message : 'Failed to load images.';
        setErrorMessage(message);
        setImages([]);
      } finally {
        if (preserveSearch) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleSearch = useCallback(
    async (query: string) => {
      setStatusMessage(null);
      setErrorMessage(null);
      setSearchQuery(query);

      if (!query.trim()) {
        setImages(allImages);
        return;
      }

      try {
        setLoading(true);
        const searchResults = await searchImages(query);
        setImages(searchResults);
      } catch (error) {
        console.error('Error searching images:', error);
        const message = error instanceof Error ? error.message : 'Failed to search images.';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    },
    [allImages]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setImages(allImages);
    setStatusMessage(null);
    setErrorMessage(null);
  }, [allImages]);

  const handleViewImage = (image: Image) => {
    setSelectedImage(image);
  };

  const handleEditImage = (image: Image) => {
    setSelectedImage(null);
    navigate(`/gallery/${image.id}`);
  };

  const handleDeleteImage = async (image: Image) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this image? This action cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(image.id);
      setStatusMessage(null);
      setErrorMessage(null);
      await deleteImage(image.id);
      setImages((prev) => prev.filter((item) => item.id !== image.id));
      setAllImages((prev) => prev.filter((item) => item.id !== image.id));
      if (selectedImage?.id === image.id) {
        setSelectedImage(null);
      }
      setStatusMessage('Image deleted successfully.');
    } catch (error) {
      console.error('Error deleting image:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete image.';
      setErrorMessage(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleRefresh = () => {
    setStatusMessage(null);
    loadImages({ preserveSearch: Boolean(searchQuery.trim()), search: searchQuery });
  };

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <div className="gallery-header-top">
          <h1 className="page-title">Image Library</h1>
          <div className="gallery-actions">
            <button
              type="button"
              className="refresh-tags-button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              {refreshing || loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="refresh-tags-button"
              onClick={() => navigate('/similarity')}
            >
              Scan Duplicates
            </button>
          </div>
        </div>
        <div className="search-section">
          <SearchBar onSearch={handleSearch} />
          {searchQuery && (
            <div className="search-info">
              <span>
                Showing results for: "<strong>{searchQuery}</strong>"
              </span>
              <button className="clear-search" onClick={clearSearch}>
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMessage && !errorMessage && (
        <div className="message success">
          {statusMessage}
          <button type="button" className="retry-button" onClick={() => setStatusMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="message error">
          {errorMessage}
          <button type="button" className="retry-button" onClick={() => setErrorMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading images...</p>
        </div>
      ) : (
        <>
          <div className="gallery-stats">
            <span className="image-count">
              {images.length} image{images.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <ImageGallery
            images={images}
            onViewImage={handleViewImage}
            onEditImage={handleEditImage}
            onDeleteImage={handleDeleteImage}
            deletingImageId={deletingId}
          />
        </>
      )}

      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={handleCloseModal}
          onEdit={handleEditImage}
          onDelete={handleDeleteImage}
          isDeleting={deletingId === selectedImage.id}
        />
      )}
    </div>
  );
};

export default Gallery;