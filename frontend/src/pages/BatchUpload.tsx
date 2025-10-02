import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetchTags, uploadBatchImages, extractOcrTextLLM } from '../services/api';
import { Tag } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import './BatchUpload.css';

interface FileWithPreview {
    file: File;
    preview: string;
    tags: string[];
    ocrText: string;
    suggestedTags: string[];
    ocrStatus: 'idle' | 'running' | 'done' | 'error';
}

const BatchUpload: React.FC = () => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTag, setNewTag] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: FileWithPreview[] = acceptedFiles.map(file => ({
            file: file,
            preview: URL.createObjectURL(file),
            tags: [],
            ocrText: '',
            suggestedTags: [],
            ocrStatus: 'running' as const
        }));

        const startingIndex = files.length;
        setFiles(prevFiles => [...prevFiles, ...newFiles]);

        newFiles.forEach((file, index) => {
            extractOcrTextLLM(file.file)
                .then(response => {
                    setFiles(prevFiles => {
                        const updatedFiles = [...prevFiles];
                        const fileIndex = startingIndex + index;
                        if (updatedFiles[fileIndex]) {
                            updatedFiles[fileIndex] = {
                                ...updatedFiles[fileIndex],
                                ocrText: response.text,
                                suggestedTags: response.suggestedTags || [],
                                ocrStatus: 'done'
                            };
                        }
                        return updatedFiles;
                    });
                })
                .catch(() => {
                    setFiles(prevFiles => {
                        const updatedFiles = [...prevFiles];
                        const fileIndex = startingIndex + index;
                        if (updatedFiles[fileIndex]) {
                            updatedFiles[fileIndex] = {
                                ...updatedFiles[fileIndex],
                                ocrStatus: 'error'
                            };
                        }
                        return updatedFiles;
                    });
                });
        });
    }, [files.length]);

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

    useEffect(() => {
        const getTags = async () => {
            const fetchedTags = await fetchTags();
            setTags(fetchedTags);
        };
        getTags();
    }, []);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;

        if (source.droppableId === 'available-tags' && destination.droppableId.startsWith('image-tags-')) {
            const tag = tags[source.index];
            const fileIndex = parseInt(destination.droppableId.split('-')[2], 10);

            if (tag && !isNaN(fileIndex) && files[fileIndex]) {
                const file = files[fileIndex];
                if (!file.tags.includes(tag.name)) {
                    const newFiles = [...files];
                    newFiles[fileIndex] = {
                        ...file,
                        tags: [...file.tags, tag.name],
                    };
                    setFiles(newFiles);
                }
            }
        }
    };

    const addTagToAll = () => {
        if (newTag.trim() === '') return;
        const newFiles = files.map(file => {
            if (!file.tags.includes(newTag)) {
                return { ...file, tags: [...file.tags, newTag] };
            }
            return file;
        });
        setFiles(newFiles);
        setNewTag('');
    };

    const removeTagFromFile = (fileIndex: number, tag: string) => {
        const newFiles = [...files];
        newFiles[fileIndex].tags = newFiles[fileIndex].tags.filter(t => t !== tag);
        setFiles(newFiles);
    };

    const handleOcrTextChange = (fileIndex: number, text: string) => {
        const newFiles = [...files];
        newFiles[fileIndex].ocrText = text;
        setFiles(newFiles);
    };

    const handleAddSuggestedTag = (fileIndex: number, tag: string) => {
        const newFiles = [...files];
        if (!newFiles[fileIndex].tags.includes(tag)) {
            newFiles[fileIndex].tags.push(tag);
            setFiles(newFiles);
        }
    };

    const handleUpload = async () => {
        const formData = new FormData();
        const metadata: { [key: string]: { tags: string[], ocrText: string } } = {};

        files.forEach(file => {
            formData.append('images', file.file);
            const normalizedOriginalName = file.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            metadata[normalizedOriginalName] = {
                tags: file.tags,
                ocrText: file.ocrText
            };
        });

        formData.append('metadata', JSON.stringify(metadata));

        try {
            await uploadBatchImages(formData);
            setFiles([]);
            alert('Upload successful!');
        } catch (error) {
            console.error(error);
            alert('Upload failed.');
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="batch-upload-container">
                <h1>Batch Upload</h1>
                <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <p>Drag 'n' drop some files here, or click to select files</p>
                </div>

                <div className="tag-management">
                    <div className="add-tag-to-all">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="New tag for all"
                        />
                        <button onClick={addTagToAll}>Add to All</button>
                    </div>

                    <Droppable droppableId="available-tags" direction="horizontal">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="tag-selection"
                            >
                                <h2>Available Tags (drag to add)</h2>
                                <div className="tags">
                                    {tags.map((tag, index) => (
                                        <Draggable key={tag.id} draggableId={tag.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="tag-draggable"
                                                >
                                                    {tag.name}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                </div>

                <button onClick={handleUpload} disabled={files.length === 0}>
                    Upload {files.length} files
                </button>

                <div className="image-preview-grid">
                    {files.map((file, index) => (
                        <Droppable key={file.file.name} droppableId={`image-tags-${index}`}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="image-preview"
                                >
                                    <img src={file.preview} alt={file.file.name} />
                                    <div className="image-tags">
                                        {file.tags.map(tag => (
                                            <span key={tag} className="tag">
                                                {tag}
                                                <button onClick={() => removeTagFromFile(index, tag)}>x</button>
                                            </span>
                                        ))}
                                    </div>
                                    {provided.placeholder}
                                    <div className="ocr-section">
                                        {file.ocrStatus === 'running' && <div className="ocr-status">OCR running...</div>}
                                        {file.ocrStatus === 'error' && <div className="ocr-status ocr-error">OCR failed</div>}
                                        {file.ocrStatus === 'done' && (
                                            <>
                                                <textarea
                                                    className="ocr-textarea"
                                                    value={file.ocrText}
                                                    onChange={(e) => handleOcrTextChange(index, e.target.value)}
                                                />
                                                <div className="suggested-tags">
                                                    <h4>Suggested Tags:</h4>
                                                    <div className="tags-display">
                                                        {file.suggestedTags.map(tag => (
                                                            <button key={tag} className="suggested-tag" onClick={() => handleAddSuggestedTag(index, tag)}>
                                                                + {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </div>
        </DragDropContext>
    );
};

export default BatchUpload;