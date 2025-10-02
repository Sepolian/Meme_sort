import React from 'react';
import { Image } from '../types';

interface ImagePreviewModalProps {
    image: Image;
    onClose: () => void;
    onEdit?: (image: Image) => void;
    onDelete?: (image: Image) => Promise<void> | void;
    isDeleting?: boolean;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose, onEdit, onDelete, isDeleting }) => {
    const formatDate = (date: string) => {
        try {
            return new Date(date).toLocaleString();
        } catch (error) {
            return date;
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="modal-close" onClick={onClose}>
                    ✕
                </button>
                <div className="modal-body">
                    <img src={image.url} alt="Selected" className="modal-image" />
                    <div className="modal-details">
                        <h3>Details</h3>
                        <p>
                            <strong>Created:</strong> {formatDate(image.createdAt)}
                        </p>
                        <div className="modal-tags">
                            <h4>Tags</h4>
                            {image.tags.length > 0 ? (
                                <div className="tags-display">
                                    {image.tags.map((tag) => (
                                        <span key={tag} className="tag-chip">
                                            🏷️ {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-tags">No tags assigned.</p>
                            )}
                        </div>
                        <div className="modal-ocr">
                            <h4>OCR Text</h4>
                            <p>{image.ocrText ? image.ocrText : 'No OCR text stored.'}</p>
                        </div>
                        {(onEdit || onDelete) && (
                            <div className="modal-footer">
                                {onEdit && (
                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() => onEdit(image)}
                                    >
                                        ✏️ Edit Image
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => onDelete(image)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting…' : '🗑️ Delete Image'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
