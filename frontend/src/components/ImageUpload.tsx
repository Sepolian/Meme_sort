import React, { useState, useRef } from 'react';
import { uploadImage, extractOcrText, extractOcrTextLLM, LlmOcrResponse } from '../services/api';

interface ImageUploadProps {
    tags: string[];
    onSuggestedTagsChange: (tags: string[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ tags, onSuggestedTagsChange }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [ocrLanguage, setOcrLanguage] = useState('eng');
    const [ocrMethod, setOcrMethod] = useState<'tesseract' | 'llm'>('llm');
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const requestOcrText = async (file: File, language: string, method: 'tesseract' | 'llm' = ocrMethod) => {
        try {
            setOcrLoading(true);
            setOcrError(null);
            if (method === 'tesseract') {
                onSuggestedTagsChange([]);
            }

            let response;
            if (method === 'llm') {
                response = await extractOcrTextLLM(file);
                const suggestions = (response as LlmOcrResponse).suggestedTags ?? [];
                const normalized = Array.isArray(suggestions)
                    ? suggestions
                        .map((tag: string) => tag.trim())
                        .filter((tag: string) => tag.length > 0)
                    : [];
                onSuggestedTagsChange(normalized);
            } else {
                response = await extractOcrText(file, language);
                onSuggestedTagsChange([]);
            }

            setOcrText(response.text ?? '');
        } catch (error) {
            console.error('Error extracting text:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from image.';
            setOcrError(errorMessage);
            setOcrText('');
            onSuggestedTagsChange([]);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleFileChange = (file: File) => {
        setSelectedFile(file);
        setOcrText('');
        setOcrError(null);
        onSuggestedTagsChange([]);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && e.target.result) {
                setPreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        requestOcrText(file, ocrLanguage, ocrMethod);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleFileChange(event.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileChange(files[0]);
        }
    };

    const handleReextract = () => {
        if (selectedFile) {
            setOcrError(null);
            requestOcrText(selectedFile, ocrLanguage, ocrMethod);
        }
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const language = event.target.value;
        setOcrLanguage(language);
        if (selectedFile && ocrMethod === 'tesseract') {
            requestOcrText(selectedFile, language, 'tesseract');
        }
    };

    const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const method = event.target.value as 'tesseract' | 'llm';
        setOcrMethod(method);
        if (method === 'tesseract') {
            onSuggestedTagsChange([]);
        }
        if (selectedFile) {
            requestOcrText(selectedFile, ocrLanguage, method);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreview(null);
        setOcrText('');
        setOcrLanguage('eng');
        setOcrMethod('llm');
        setOcrError(null);
        setOcrLoading(false);
        setDragOver(false);
        onSuggestedTagsChange([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('tags', tags.join(','));
        formData.append('ocrText', ocrText);
        formData.append('ocrLanguage', ocrLanguage);

        try {
            setUploading(true);
            await uploadImage(formData);
            alert('Image uploaded successfully! 🎉');
            resetForm();
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload">
            <h2>Upload Image</h2>

            <div className="file-input-section">
                <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="file-input"
                />
                <label
                    htmlFor="file-input"
                    className={`file-input-label ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {selectedFile ?
                        `Selected: ${selectedFile.name}` :
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Click to upload or drag and drop</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>SVG, PNG, JPG (max. 10MB)</span>
                        </div>
                    }
                </label>
            </div>

            {preview && (
                <div className="preview-section">
                    <h4>Preview:</h4>
                    <img
                        src={preview}
                        alt="Preview"
                        className="preview-image"
                    />
                </div>
            )}

            <div className="ocr-section">
                <div className="ocr-header">
                    <h4>OCR Text</h4>
                    <div className="ocr-controls">
                        <div className="ocr-method-picker">
                            <label htmlFor="ocr-method">Method:</label>
                            <select
                                id="ocr-method"
                                value={ocrMethod}
                                onChange={handleMethodChange}
                                className="ocr-method-select"
                                disabled={ocrLoading}
                            >
                                <option value="tesseract">Tesseract</option>
                                <option value="llm">LLM Vision</option>
                            </select>
                        </div>
                        {ocrMethod === 'tesseract' && (
                            <div className="ocr-language-picker">
                                <label htmlFor="ocr-language">Language:</label>
                                <select
                                    id="ocr-language"
                                    value={ocrLanguage}
                                    onChange={handleLanguageChange}
                                    className="ocr-language-select"
                                    disabled={ocrLoading}
                                >
                                    <option value="eng">English</option>
                                    <option value="chi_sim">Chinese (Simplified)</option>
                                    <option value="chi_tra">Chinese (Traditional)</option>
                                </select>
                            </div>
                        )}
                        <button
                            type="button"
                            className="ocr-refresh-button"
                            onClick={handleReextract}
                            disabled={!selectedFile || ocrLoading}
                        >
                            {ocrLoading ? 'Extracting...' : 'Re-run OCR'}
                        </button>
                    </div>
                </div>
                {ocrError && (
                    <div className="ocr-error">
                        {ocrError}
                    </div>
                )}
                <textarea
                    className="ocr-textarea"
                    placeholder="Extracted text will appear here..."
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    disabled={!selectedFile || ocrLoading}
                />
                {!selectedFile && (
                    <div className="ocr-status">
                        Select an image to extract text automatically.
                    </div>
                )}
            </div>

            <div className="selected-tags-section">
                <h4>Selected Tags:</h4>
                <div className="tags-display">
                    {tags.length > 0 ? (
                        tags.map((tag, index) => (
                            <span key={index} className="selected-tag">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <div className="no-tags-message">
                            No tags selected. Please select tags above before uploading.
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || ocrLoading}
                className="upload-button"
            >
                {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
        </div>
    );
};

export default ImageUpload;