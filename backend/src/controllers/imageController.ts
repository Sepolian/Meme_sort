import { Request, Response } from 'express';
import Tesseract from 'tesseract.js';
import Image from '../models/Image';
import { saveImage, getImageUrl } from '../utils/fileHandler';
import { DEFAULT_LLM_SYSTEM_PROMPT, getLLMConfig, updateLLMConfig } from '../config/llm';
import { scanImageSimilarity } from '../utils/imageSimilarity';

export class ImageController {
    async uploadImage(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const tagsRaw = req.body.tags;
            const ocrTextRaw = req.body.ocrText;
            const fileName = saveImage(req.file);
            const imageUrl = getImageUrl(fileName);
            
            const tagArray = typeof tagsRaw === 'string'
                ? tagsRaw.split(',').map((tag: string) => tag.trim()).filter((tag: string) => !!tag)
                : Array.isArray(tagsRaw)
                    ? tagsRaw.map((tag: string) => tag.trim()).filter((tag: string) => !!tag)
                    : [];

            const newImage = await Image.create({
                url: imageUrl,
                tags: tagArray,
                ocrText: typeof ocrTextRaw === 'string' ? ocrTextRaw.trim() : ''
            });
            
            res.status(201).json(newImage);
        } catch (error) {
            console.error('Error uploading image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error uploading image', error: errorMessage });
        }
    }

    async uploadBatchImages(req: Request, res: Response) {
        try {
            // Access files from the 'images' field
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const images = files['images'];
            if (!images || !Array.isArray(images) || images.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }

            // Access metadata from the 'metadata' field
            const metadataJson = req.body.metadata;
            let metadata: { [key: string]: { tags: string[], ocrText: string } } = {};
            if (metadataJson) {
                try {
                    metadata = JSON.parse(metadataJson);
                } catch (e) {
                    return res.status(400).json({ message: 'Invalid metadata format. Expected a JSON string.' });
                }
            }

            const createdImages = [];

            for (const file of images) {
                const fileName = saveImage(file);
                const imageUrl = getImageUrl(fileName);
                
                const normalizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileMetadata = metadata[normalizedOriginalName];
                
                const tags = fileMetadata ? fileMetadata.tags : [];
                const ocrText = fileMetadata ? fileMetadata.ocrText : '';

                const newImage = await Image.create({
                    url: imageUrl,
                    tags: tags,
                    ocrText: ocrText
                });
                createdImages.push(newImage);
            }

            res.status(201).json(createdImages);
        } catch (error) {
            console.error('Error batch uploading images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error batch uploading images', error: errorMessage });
        }
    }

    async getImages(req: Request, res: Response) {
        try {
            const images = await Image.findAll();
            res.status(200).json(images);
        } catch (error) {
            console.error('Error fetching images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching images', error: errorMessage });
        }
    }

    async getImageById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const image = await Image.findById(id);

            if (!image) {
                return res.status(404).json({ message: 'Image not found' });
            }

            res.status(200).json(image);
        } catch (error) {
            console.error('Error fetching image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching image', error: errorMessage });
        }
    }

    async updateImage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updatePayload: { tags?: string[]; ocrText?: string } = {};

            if (Object.prototype.hasOwnProperty.call(req.body, 'ocrText')) {
                const ocrTextRaw = req.body.ocrText;
                if (ocrTextRaw !== undefined && ocrTextRaw !== null && typeof ocrTextRaw !== 'string') {
                    return res.status(400).json({ message: 'OCR text must be a string' });
                }
                updatePayload.ocrText = typeof ocrTextRaw === 'string' ? ocrTextRaw : '';
            }

            if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
                const tagsRaw = req.body.tags;

                let parsedTags: string[] | undefined;

                if (typeof tagsRaw === 'string') {
                    parsedTags = tagsRaw
                        .split(',')
                        .map((tag: string) => tag.trim())
                        .filter((tag: string) => tag.length > 0);
                } else if (Array.isArray(tagsRaw)) {
                    parsedTags = tagsRaw
                        .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag: string) => tag.length > 0);
                } else if (tagsRaw === null) {
                    parsedTags = [];
                } else {
                    return res.status(400).json({ message: 'Tags must be a string or array of strings' });
                }

                updatePayload.tags = parsedTags ?? [];
            }

            if (!Object.keys(updatePayload).length) {
                return res.status(400).json({ message: 'No valid fields provided for update' });
            }

            const updatedImage = await Image.update(id, updatePayload);

            if (!updatedImage) {
                return res.status(404).json({ message: 'Image not found' });
            }

            res.status(200).json(updatedImage);
        } catch (error) {
            console.error('Error updating image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating image', error: errorMessage });
        }
    }

    async deleteImage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await Image.delete(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Image not found' });
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting image', error: errorMessage });
        }
    }

    async getImagesByTag(req: Request, res: Response) {
        try {
            const { tag } = req.query;
            if (!tag || typeof tag !== 'string') {
                return res.status(400).json({ message: 'Tag query parameter is required' });
            }
            const images = await Image.findByTag(tag);
            res.status(200).json(images);
        } catch (error) {
            console.error('Error fetching images by tag:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching images by tag', error: errorMessage });
        }
    }

    async searchImages(req: Request, res: Response) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).json({ message: 'Query parameter q is required' });
            }
            const images = await Image.findByQuery(q);
            res.status(200).json(images);
        } catch (error) {
            console.error('Error searching images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error searching images', error: errorMessage });
        }
    }

    async extractText(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            if (!req.file.buffer) {
                return res.status(400).json({ message: 'Uploaded file data is unavailable for OCR' });
            }

            const languageRaw = req.body.language;
            const language = typeof languageRaw === 'string' && languageRaw.trim().length > 0
                ? languageRaw.trim()
                : 'eng';

            const result = await Tesseract.recognize(req.file.buffer, language);
            const text = typeof result.data?.text === 'string' ? result.data.text.trim() : '';

            res.status(200).json({ text, language });
        } catch (error) {
            console.error('Error extracting text from image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error extracting text', error: errorMessage });
        }
    }

    async extractTextLLM(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            if (!req.file.buffer) {
                return res.status(400).json({ message: 'Uploaded file data is unavailable for LLM OCR' });
            }

            const config = getLLMConfig();
            if (!config.apiKey || config.apiKey.trim() === '') {
                return res.status(400).json({ 
                    message: 'LLM API key not configured. Please set your API key in Settings or the .env file.' 
                });
            }

            if (!config.baseUrl || config.baseUrl.trim() === '') {
                return res.status(400).json({ 
                    message: 'LLM Base URL not configured. Please set your base URL in Settings or the .env file.' 
                });
            }

            // Convert image to base64
            const base64Image = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype || 'image/jpeg';
            
            console.log(`LLM OCR Request - Base URL: ${config.baseUrl}, Model: ${config.model}, API Key Length: ${config.apiKey.length}`);

            const systemPrompt =
                config.systemPrompt && config.systemPrompt.trim().length > 0
                    ? config.systemPrompt
                    : DEFAULT_LLM_SYSTEM_PROMPT;

            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Extract all visible text from this image. Return only the text content, no JSON formatting.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`LLM API Response: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            let data: any;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse LLM API response as JSON:', responseText);
                throw new Error('Invalid JSON response from LLM API');
            }
            
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No response from LLM');
            }

            const rawContent = typeof content === 'string' ? content : String(content);
            const sanitizedContent = stripMarkdownFence(rawContent);

            // Extract text content, handle both JSON and plain text responses
            let extractedText = '';
            let suggestedTags: string[] = [];

            try {
                const jsonResponse = JSON.parse(sanitizedContent);

                if (typeof jsonResponse.ocr_text === 'string') {
                    extractedText = jsonResponse.ocr_text;
                } else if (typeof jsonResponse.text === 'string') {
                    extractedText = jsonResponse.text;
                }

                if (Array.isArray(jsonResponse.suggested_tags)) {
                    suggestedTags = jsonResponse.suggested_tags
                        .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag: string) => tag.length > 0);
                } else if (Array.isArray(jsonResponse.tags)) {
                    suggestedTags = jsonResponse.tags
                        .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag: string) => tag.length > 0);
                }

                if (!extractedText && typeof sanitizedContent === 'string') {
                    extractedText = sanitizedContent;
                }
            } catch (parseError) {
                console.warn('LLM did not return JSON, falling back to raw content.');
                extractedText = sanitizedContent;
                suggestedTags = [];
            }

            // Clean up the extracted text and deduplicate suggested tags
            const text = typeof extractedText === 'string' ? extractedText.trim() : '';
            const uniqueSuggestedTags = Array.from(
                new Set(suggestedTags.map((tag: string) => tag.toLowerCase()))
            )
                .map((lowerTag: string, index: number, array: string[]) => {
                    const originalTag = suggestedTags.find(
                        (tag: string) => tag.toLowerCase() === lowerTag
                    );
                    return originalTag ?? lowerTag;
                })
                .filter((tag: string) => tag.length > 0)
                .slice(0, 5);

            res.status(200).json({ 
                text,
                suggestedTags: uniqueSuggestedTags,
                method: 'llm',
                model: config.model 
            });
        } catch (error) {
            console.error('Error extracting text with LLM:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error extracting text with LLM', error: errorMessage });
        }
    }

    async getLLMConfig(req: Request, res: Response) {
        try {
            const config = getLLMConfig();
            // Don't send API key in response for security
            res.json({
                baseUrl: config.baseUrl,
                model: config.model,
                systemPrompt: config.systemPrompt,
                hasApiKey: !!config.apiKey
            });
        } catch (error) {
            console.error('Error getting LLM config:', error);
            res.status(500).json({ message: 'Error getting LLM configuration' });
        }
    }

    async updateLLMConfig(req: Request, res: Response) {
        try {
            const { baseUrl, model, apiKey, systemPrompt } = req.body;
            updateLLMConfig({ baseUrl, model, apiKey, systemPrompt });
            const updatedConfig = getLLMConfig();
            res.status(200).json(updatedConfig);
        } catch (error) {
            console.error('Error updating LLM config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating LLM configuration', error: errorMessage });
        }
    }

    async scanSimilarImages(req: Request, res: Response) {
        try {
            const thresholdParam = typeof req.query.threshold === 'string' ? parseFloat(req.query.threshold) : undefined;
            const threshold = Number.isFinite(thresholdParam)
                ? Math.min(Math.max(thresholdParam as number, 0), 1)
                : 0.92;

            const results = await scanImageSimilarity(threshold);
            res.status(200).json({ results, threshold });
        } catch (error) {
            console.error('Error scanning image similarity:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error scanning image similarity', error: errorMessage });
        }
    }
}

const stripMarkdownFence = (payload: string): string => {
    const trimmed = payload.trim();
    const lines = trimmed.split(/\r?\n/);
    if (lines.length >= 2 && lines[0].startsWith('```') && lines[lines.length - 1].startsWith('```')) {
        return lines.slice(1, -1).join('\n').trim();
    }
    return trimmed;
};