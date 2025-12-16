import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import TagSelector from '../components/TagSelector';

import { Link } from 'react-router-dom';

const Upload: React.FC = () => {
    const [tags, setTags] = useState<string[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [ocrMethod, setOcrMethod] = useState<'tesseract' | 'llm'>('llm');

    const handleTagsChange = (newTags: string[]) => {
        setTags(
            newTags
                .map((tag) => tag.trim())
                .filter((tag, index, array) => tag.length > 0 && array.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index)
        );
    };

    const handleAddTag = (tag: string) => {
        const normalized = tag.trim();
        if (!normalized) return;
        setTags((prev) => {
            if (prev.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
                return prev;
            }
            return [...prev, normalized];
        });
    };

    const handleSuggestedTagsChange = (incoming: string[]) => {
        const seen = new Set<string>();
        const unique: string[] = [];
        incoming.forEach((tag) => {
            const normalized = tag.trim();
            if (!normalized) {
                return;
            }
            const key = normalized.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(normalized);
            }
        });
        setSuggestedTags(unique);
    };

    return (
        <div className="upload-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">Upload Image</h1>
                <Link to="/batch_upload" className="batch-upload-button">Batch Upload</Link>
            </div>
            <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
                Add new images to your collection with custom tags
            </p>
            <TagSelector selectedTags={tags} onChange={handleTagsChange} />
            {suggestedTags.length > 0 && (
                <div className="suggested-tags-section">
                    <h4>Suggested Tags:</h4>
                    <div className="tags-display">
                        {suggestedTags.map((tag) => {
                            const alreadySelected = tags.some(
                                (existing) => existing.toLowerCase() === tag.toLowerCase()
                            );
                            return (
                                <button
                                    type="button"
                                    key={tag}
                                    className={`suggested-tag ${alreadySelected ? 'selected' : ''}`}
                                    onClick={() => handleAddTag(tag)}
                                    disabled={alreadySelected}
                                >
                                    {alreadySelected ? 'Added' : 'Add'} {tag}
                                </button>
                            );
                        })}
                    </div>
                    <small className="suggested-tags-note">
                        Tap a suggested tag to include it before uploading.
                    </small>
                </div>
            )}
            <ImageUpload
                tags={tags}
                onSuggestedTagsChange={handleSuggestedTagsChange}
            />
        </div>
    );
};

export default Upload;