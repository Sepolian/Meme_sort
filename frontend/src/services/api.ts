import axios from 'axios';
import { Image, Tag, SimilarImagePair } from '../types';

const API_URL = 'http://localhost:5000/api';

export interface LlmOcrResponse {
    text: string;
    method: string;
    model: string;
    suggestedTags?: string[];
}

export const uploadImage = async (formData: FormData) => {
    try {
        const response = await axios.post(`${API_URL}/images/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error uploading image: ' + message);
    }
};

export const uploadBatchImages = async (formData: FormData) => {
    try {
        const response = await axios.post(`${API_URL}/images/batch_upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error uploading batch images: ' + message);
    }
};

export const extractOcrText = async (file: File, language: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);

    try {
        const response = await axios.post(`${API_URL}/images/ocr`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error extracting text: ' + message);
    }
};

export const fetchImages = async () => {
    try {
        const response = await axios.get(`${API_URL}/images`);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error fetching images: ' + message);
    }
};

export const fetchImageById = async (id: string): Promise<Image> => {
    try {
        const response = await axios.get(`${API_URL}/images/${id}`);
        return response.data as Image;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error fetching image: ' + message);
    }
};

export const searchImagesByTag = async (tag: string) => {
    try {
        const response = await axios.get(`${API_URL}/images/search?tag=${tag}`);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error searching images by tag: ' + message);
    }
};

export const searchImages = async (query: string) => {
    try {
        const response = await axios.get(`${API_URL}/images/search?q=${query}`);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error searching images: ' + message);
    }
};

export const updateImage = async (
    id: string,
    payload: { tags?: string[]; ocrText?: string }
): Promise<Image> => {
    try {
        const response = await axios.put(`${API_URL}/images/${id}`, payload);
        return response.data as Image;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error updating image: ' + message);
    }
};

export const deleteImage = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/images/${id}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error deleting image: ' + message);
    }
};

export const scanImageSimilarity = async (threshold?: number): Promise<SimilarImagePair[]> => {
    try {
        const params = typeof threshold === 'number' ? { threshold } : undefined;
        const response = await axios.get(`${API_URL}/images/similarity/scan`, { params });
        return (response.data?.results ?? []) as SimilarImagePair[];
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error scanning image similarity: ' + message);
    }
};

export const createTag = async (tagName: string): Promise<Tag> => {
    try {
        const response = await axios.post(`${API_URL}/tags`, { name: tagName });
        return response.data as Tag;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error creating tag: ' + message);
    }
};

export const fetchTags = async (): Promise<Tag[]> => {
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data as Tag[];
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error fetching tags: ' + message);
    }
};

export const extractOcrTextLLM = async (file: File): Promise<LlmOcrResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await axios.post<LlmOcrResponse>(`${API_URL}/images/ocr-llm`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error extracting text with LLM: ' + message);
    }
};

export const getLLMConfig = async () => {
    try {
        const response = await axios.get(`${API_URL}/images/llm-config`);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error fetching LLM config: ' + message);
    }
};

export const updateLLMConfig = async (config: { baseUrl?: string; apiKey?: string; model?: string; systemPrompt?: string }) => {
    try {
        const response = await axios.post(`${API_URL}/images/llm-config`, config);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error updating LLM config: ' + message);
    }
};