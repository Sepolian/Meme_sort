import React, { useState, useEffect, useCallback } from 'react';
import { createTag, fetchTags } from '../services/api';
import { Tag } from '../types';

const sortTags = (tags: Tag[]) => [...tags].sort((a, b) => a.name.localeCompare(b.name));

const normalize = (value: string) => value.trim();

const TagManager: React.FC = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newTag, setNewTag] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadTags = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedTags = await fetchTags();
            setTags(sortTags(fetchedTags));
        } catch (err) {
            console.error('Error loading tags:', err);
            const message = err instanceof Error ? err.message : 'Failed to load tags.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    const handleCreateTag = async (event: React.FormEvent) => {
        event.preventDefault();
        const normalized = normalize(newTag);
        if (!normalized) {
            return;
        }

        if (tags.some((tag) => tag.name.toLowerCase() === normalized.toLowerCase())) {
            setSuccessMessage(null);
            setError(`Tag "${normalized}" already exists.`);
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const created = await createTag(normalized);
            setTags((prev) => sortTags([...prev, created]));
            setSuccessMessage(`Added tag "${created.name}".`);
            setNewTag('');
        } catch (err) {
            console.error('Error creating tag:', err);
            const message = err instanceof Error ? err.message : 'Failed to create tag.';
            setError(message);
            setSuccessMessage(null);
        } finally {
            setSaving(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        loadTags();
    };

    return (
        <div className="tag-manager">
            <form className="tag-input-section" onSubmit={handleCreateTag}>
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => {
                        setNewTag(e.target.value);
                        if (error) {
                            setError(null);
                        }
                        if (successMessage) {
                            setSuccessMessage(null);
                        }
                    }}
                    placeholder="Create a new tag"
                    className="tag-input"
                    disabled={saving}
                />
                <button
                    type="submit"
                    className="add-tag-button"
                    disabled={saving || !normalize(newTag)}
                >
                    {saving ? 'Saving...' : 'Add Tag'}
                </button>
                <button
                    type="button"
                    className="refresh-tags-button"
                    onClick={loadTags}
                    disabled={loading || saving}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </form>

            {error && (
                <div className="message error">
                    {error}
                    {!loading && (
                        <button
                            type="button"
                            className="retry-button"
                            onClick={handleRetry}
                        >
                            Try again
                        </button>
                    )}
                </div>
            )}

            {successMessage && (
                <div className="message success">{successMessage}</div>
            )}

            <div className="tags-section">
                <h4>Available Tags ({tags.length})</h4>
                <div className="tags-display">
                    {loading && tags.length === 0 && (
                        <div className="loading-container">
                            <div className="spinner" />
                            <span>Loading tags…</span>
                        </div>
                    )}

                    {!loading && tags.length === 0 && !error && (
                        <div className="no-tags-message">
                            No tags yet. Create your first tag above!
                        </div>
                    )}

                    {tags.map((tag) => (
                        <span key={tag.id} className="available-tag">
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TagManager;