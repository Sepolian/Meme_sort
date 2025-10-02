import React, { useEffect, useState } from 'react';
import { fetchImages } from '../services/api';
import { Image } from '../types';
import ImageCard from './ImageCard';

interface ImageGalleryProps {
    images?: Image[];
    onViewImage?: (image: Image) => void;
    onEditImage?: (image: Image) => void;
    onDeleteImage?: (image: Image) => Promise<void> | void;
    deletingImageId?: string | null;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images: propImages,
    onViewImage,
    onEditImage,
    onDeleteImage,
    deletingImageId,
}) => {
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (propImages) {
            setImages(propImages);
            setLoading(false);
        } else {
            const loadImages = async () => {
                try {
                    setLoading(true);
                    const fetchedImages = await fetchImages();
                    setImages(fetchedImages);
                } catch (err) {
                    setError('Failed to load images');
                    console.error('Error loading images:', err);
                } finally {
                    setLoading(false);
                }
            };

            loadImages();
        }
    }, [propImages]);

    if (loading) {
        return (
            <div className="gallery-loading">
                <div className="spinner"></div>
                <p>Loading images...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gallery-error">
                <div className="error-icon">❌</div>
                <p>Error: {error}</p>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="gallery-empty">
                <div className="empty-icon">📷</div>
                <h3>No images found</h3>
                <p>Try uploading some images or adjusting your search criteria.</p>
            </div>
        );
    }

    return (
        <div className="image-gallery">
            {images.map((image) => (
                <ImageCard
                    key={image.id}
                    image={image}
                    onView={onViewImage}
                    onEdit={onEditImage}
                    onDelete={onDeleteImage}
                    isDeleting={deletingImageId === image.id}
                />
            ))}
        </div>
    );
};

export default ImageGallery;