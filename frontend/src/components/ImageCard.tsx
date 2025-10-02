import React from 'react';
import { Image } from '../types';

interface ImageCardProps {
    image: Image;
    onView?: (image: Image) => void;
    onEdit?: (image: Image) => void;
    onDelete?: (image: Image) => Promise<void> | void;
    isDeleting?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onView, onEdit, onDelete, isDeleting }) => {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const ocrContent = image.ocrText?.trim();

    return (
        <div className="image-card">
            <div className="image-container">
                <img src={image.url} alt="Uploaded" className="card-image" />
                {(onView || onEdit || onDelete) && (
                    <div className="image-overlay">
                        <div className="overlay-actions">
                            {onView && (
                                <button
                                    className="overlay-button"
                                    type="button"
                                    onClick={() => onView(image)}
                                >
                                    👁️ View
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    className="overlay-button"
                                    type="button"
                                    onClick={() => onEdit(image)}
                                >
                                    ✏️ Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="overlay-button danger"
                                    type="button"
                                    onClick={() => onDelete(image)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting…' : '🗑️ Delete'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="card-content">
                <div className="card-meta">
                    <span className="upload-date">📅 {formatDate(image.createdAt)}</span>
                </div>
                <div className="tags-container">
                    {image.tags.length > 0 ? (
                        image.tags.map((tag, index) => (
                            <span key={index} className="tag-chip">
                                🏷️ {tag}
                            </span>
                        ))
                    ) : (
                        <span className="no-tags">No tags</span>
                    )}
                </div>
                {ocrContent && (
                    <div className="ocr-content">
                        <h4>📝 Extracted Text</h4>
                        <p>{ocrContent}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageCard;