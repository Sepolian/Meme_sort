import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchImageById, fetchTags, updateImage } from '../services/api';
import { Image, Tag } from '../types';

const normalize = (value: string) => value.trim();

const EditImage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [image, setImage] = useState<Image | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [ocrText, setOcrText] = useState<string>('');
    const [tagInput, setTagInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!id) {
            setError('No image id provided.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [imageData, tagsData] = await Promise.all([
                fetchImageById(id),
                fetchTags(),
            ]);
            setImage(imageData);
            setSelectedTags(imageData.tags ?? []);
            setOcrText(imageData.ocrText ?? '');
            setAllTags(tagsData);
        } catch (err) {
            console.error('Error loading image details:', err);
            const message = err instanceof Error ? err.message : 'Failed to load image details.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const availableTags = useMemo(() => {
        const selectedSet = new Set(selectedTags.map((tag) => tag.toLowerCase()));
        return allTags.filter((tag) => !selectedSet.has(tag.name.toLowerCase()));
    }, [allTags, selectedTags]);

    const handleToggleTag = (tagName: string) => {
        const normalized = normalize(tagName);
        if (!normalized) {
            return;
        }

        const lower = normalized.toLowerCase();
        setSelectedTags((prev) => {
            if (prev.some((tag) => tag.toLowerCase() === lower)) {
                return prev.filter((tag) => tag.toLowerCase() !== lower);
            }
            return [...prev, normalized];
        });
    };

    const handleAddTag = (event: React.FormEvent | React.MouseEvent) => {
        event.preventDefault();
        const normalized = normalize(tagInput);
        if (!normalized) {
            return;
        }

        setSelectedTags((prev) => {
            if (prev.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
                return prev;
            }
            return [...prev, normalized];
        });
        setTagInput('');
    };

    const handleRemoveTag = (tagName: string) => {
        setSelectedTags((prev) => prev.filter((tag) => tag.toLowerCase() !== tagName.toLowerCase()));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id) {
            setError('No image id provided.');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const updated = await updateImage(id, {
                ocrText,
                tags: selectedTags,
            });
            setImage(updated);
            setSelectedTags(updated.tags ?? []);
            setOcrText(updated.ocrText ?? '');
            setSuccess('Image updated successfully.');
        } catch (err) {
            console.error('Error updating image:', err);
            const message = err instanceof Error ? err.message : 'Failed to update image.';
            setError(message);
            setSuccess(null);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Loading image…</p>
            </div>
        );
    }

    if (error && !image) {
        return (
            <div className="gallery-error">
                <div className="error-icon">❌</div>
                <p>{error}</p>
                <Link to="/gallery" className="manage-tags-link">
                    ← Back to Gallery
                </Link>
            </div>
        );
    }

    if (!image) {
        return (
            <div className="gallery-empty">
                <div className="empty-icon">📷</div>
                <h3>Image not found</h3>
                <Link to="/gallery" className="manage-tags-link">
                    ← Back to Gallery
                </Link>
            </div>
        );
    }

    return (
        <div className="edit-image-page">
            <div className="breadcrumb">
                <button type="button" className="manage-tags-link" onClick={() => navigate('/gallery')}>
                    ← Back to Gallery
                </button>
            </div>
            <div className="edit-image-card">
                <div className="edit-image-header">
                    <h1 className="page-title">✏️ Edit Image</h1>
                    <p className="page-subtitle">
                        Update tags or OCR text for this image.
                    </p>
                </div>
                <div className="edit-image-content">
                    <div className="edit-image-preview">
                        <img src={image.url} alt="Selected" className="edit-image" />
                        <p className="preview-meta">
                            Uploaded on{' '}
                            <strong>{new Date(image.createdAt).toLocaleString()}</strong>
                        </p>
                    </div>
                    <form className="edit-image-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="ocrText">OCR Text</label>
                            <textarea
                                id="ocrText"
                                className="ocr-textarea"
                                rows={10}
                                value={ocrText}
                                onChange={(event) => setOcrText(event.target.value)}
                                placeholder="Edit the OCR text captured for this image"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tags</label>
                            <div className="selected-tags">
                                {selectedTags.length === 0 ? (
                                    <div className="no-tags-message">No tags assigned yet.</div>
                                ) : (
                                    <div className="tags-display">
                                        {selectedTags.map((tag) => (
                                            <button
                                                type="button"
                                                key={tag}
                                                className="selected-tag"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                                                🏷️ {tag} <span>✕</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group add-tag-group">
                            <label htmlFor="tagInput">Add Tag</label>
                            <div className="add-tag-row">
                                <input
                                    id="tagInput"
                                    type="text"
                                    value={tagInput}
                                    onChange={(event) => {
                                        setTagInput(event.target.value);
                                        if (error) {
                                            setError(null);
                                        }
                                        if (success) {
                                            setSuccess(null);
                                        }
                                    }}
                                    placeholder="Type a tag name"
                                    className="form-input"
                                />
                                <button type="button" className="add-tag-button" onClick={handleAddTag}>
                                    ➕ Add
                                </button>
                            </div>
                            {availableTags.length > 0 && (
                                <div className="available-tags-list">
                                    <h4>Available Tags</h4>
                                    <div className="tags-display">
                                        {availableTags.map((tag) => (
                                            <button
                                                type="button"
                                                key={tag.id}
                                                className="available-tag"
                                                onClick={() => handleToggleTag(tag.name)}
                                            >
                                                + {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="message error">{error}</div>
                        )}

                        {success && (
                            <div className="message success">{success}</div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="save-button" disabled={saving}>
                                {saving ? 'Saving…' : '💾 Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditImage;
