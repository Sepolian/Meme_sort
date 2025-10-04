import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteImage, scanImageSimilarity } from '../services/api';
import { SimilarImagePair } from '../types';

const ImageSimilarity: React.FC = () => {
    const navigate = useNavigate();
    const [pairs, setPairs] = useState<SimilarImagePair[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showAll, setShowAll] = useState<boolean>(false);

    const loadPairs = useCallback(async (fetchAll: boolean) => {
        try {
            setLoading(true);
            setError(null);
            setMessage(null);
            const results = await scanImageSimilarity(fetchAll ? 0 : undefined);
            setPairs(results);
        } catch (err) {
            console.error('Error scanning similarity:', err);
            const msg = err instanceof Error ? err.message : 'Failed to scan image similarity.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPairs(showAll);
    }, [loadPairs, showAll]);

    const handleDelete = async (imageId: string) => {
        const confirmed = window.confirm('Delete this image from the library? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(imageId);
            await deleteImage(imageId);
            setPairs((prev) => prev.filter((pair) => pair.imageA.id !== imageId && pair.imageB.id !== imageId));
            setMessage('Image deleted successfully.');
        } catch (err) {
            console.error('Error deleting image:', err);
            const msg = err instanceof Error ? err.message : 'Failed to delete image.';
            setError(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDismissPair = (imageAId: string, imageBId: string) => {
        setPairs((prev) => prev.filter((pair) => !(pair.imageA.id === imageAId && pair.imageB.id === imageBId)));
    };

    const handleToggleShowAll = () => {
        setShowAll((prev) => !prev);
    };

    const content = useMemo(() => {
        if (loading) {
            return (
                <div className="loading-container">
                    <div className="spinner" />
                    <p>Scanning images for similarity…</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="message error">
                    {error}
                    <button type="button" className="retry-button" onClick={() => loadPairs(showAll)}>
                        Try again
                    </button>
                </div>
            );
        }

        if (pairs.length === 0) {
            return (
                <div className="gallery-empty">
                    <div className="empty-icon">✅</div>
                    <h3>No similar images detected</h3>
                    <p>All images appear to be unique based on the current scan.</p>
                </div>
            );
        }

        return (
            <div className="similarity-grid">
                {pairs.map((pair) => (
                    <div key={`${pair.imageA.id}-${pair.imageB.id}`} className="similarity-card">
                        <div className="similarity-score">
                            Similarity: <strong>{pair.similarity.toFixed(2)}%</strong>
                        </div>
                        <div className="similarity-images">
                            <div className="similarity-image">
                                <img src={pair.imageA.url} alt="Potential duplicate A" />
                                <div className="similarity-meta">
                                    <span>ID: {pair.imageA.id}</span>
                                    <span>
                                        Tags: {pair.imageA.tags.length ? pair.imageA.tags.join(', ') : '—'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() => handleDelete(pair.imageA.id)}
                                    disabled={processingId === pair.imageA.id}
                                >
                                    {processingId === pair.imageA.id ? 'Deleting…' : '🗑️ Delete'}
                                </button>
                            </div>
                            <div className="similarity-image">
                                <img src={pair.imageB.url} alt="Potential duplicate B" />
                                <div className="similarity-meta">
                                    <span>ID: {pair.imageB.id}</span>
                                    <span>
                                        Tags: {pair.imageB.tags.length ? pair.imageB.tags.join(', ') : '—'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() => handleDelete(pair.imageB.id)}
                                    disabled={processingId === pair.imageB.id}
                                >
                                    {processingId === pair.imageB.id ? 'Deleting…' : '🗑️ Delete'}
                                </button>
                            </div>
                        </div>
                        <div className="similarity-actions">
                            <button
                                type="button"
                                className="refresh-tags-button"
                                onClick={() => handleDismissPair(pair.imageA.id, pair.imageB.id)}
                            >
                                Keep both
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [loading, error, pairs, processingId, showAll, loadPairs]);

    return (
        <div className="similarity-page">
            <div className="similarity-header">
                <div>
                    <h1 className="page-title">🔍 Image Similarity Review</h1>
                    <p className="page-subtitle">
                        {showAll
                            ? 'Showing all similarity results.'
                            : 'Review and resolve potential duplicate images detected above a 85% similarity match.'}
                    </p>
                </div>
                <div className="similarity-actions-bar">
                    <button
                        type="button"
                        className="refresh-tags-button"
                        onClick={() => loadPairs(showAll)}
                        disabled={loading}
                    >
                        {loading ? 'Scanning…' : '🔄 Re-run Scan'}
                    </button>
                    <button
                        type="button"
                        className="refresh-tags-button"
                        onClick={handleToggleShowAll}
                        disabled={loading}
                    >
                        {showAll ? 'Show High-Similarity Only' : 'Show All Results'}
                    </button>
                    <button type="button" className="manage-tags-link" onClick={() => navigate('/gallery')}>
                        ← Back to Gallery
                    </button>
                </div>
            </div>

            {message && !error && (
                <div className="message success">
                    {message}
                    <button type="button" className="retry-button" onClick={() => setMessage(null)}>
                        Dismiss
                    </button>
                </div>
            )}

            {content}
        </div>
    );
};

export default ImageSimilarity;
