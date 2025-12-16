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
                                    title="View"
                                >
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    className="overlay-button"
                                    type="button"
                                    onClick={() => onEdit(image)}
                                    title="Edit"
                                >
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="overlay-button danger"
                                    type="button"
                                    onClick={() => onDelete(image)}
                                    disabled={isDeleting}
                                    title="Delete"
                                >
                                    {isDeleting ? (
                                        <svg className="animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="card-content">
                <div className="card-meta">
                    <span className="upload-date">{formatDate(image.createdAt)}</span>
                </div>
                <div className="tags-container">
                    {image.tags.length > 0 ? (
                        image.tags.map((tag, index) => (
                            <span key={index} className="tag-chip">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="no-tags">No tags</span>
                    )}
                </div>
                {ocrContent && (
                    <div className="ocr-content">
                        <h4>Extracted Text</h4>
                        <p>{ocrContent}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageCard;