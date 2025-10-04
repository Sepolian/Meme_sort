"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageController = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const Image_1 = __importDefault(require("../models/Image"));
const fileHandler_1 = require("../utils/fileHandler");
const llm_1 = require("../config/llm");
const imageSimilarity_1 = require("../utils/imageSimilarity");
const triggerVectorCalculation = async (image) => {
    console.log(`Triggering vector calculation for image ${image.id}`);
    const imagePath = (0, fileHandler_1.resolveImageFilePath)(image.url);
    if (!imagePath) {
        console.error(`Could not resolve file path for image ${image.id}`);
        return;
    }
    const vector = await (0, imageSimilarity_1.calculateImageVector)(imagePath);
    if (vector) {
        await Image_1.default.update(image.id, { vector });
        console.log(`Successfully calculated and saved vector for image ${image.id}`);
    }
    else {
        console.error(`Failed to calculate vector for image ${image.id}`);
    }
};
class ImageController {
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            const tagsRaw = req.body.tags;
            const ocrTextRaw = req.body.ocrText;
            const fileName = (0, fileHandler_1.saveImage)(req.file);
            const imageUrl = (0, fileHandler_1.getImageUrl)(fileName);
            const tagArray = typeof tagsRaw === 'string'
                ? tagsRaw.split(',').map((tag) => tag.trim()).filter((tag) => !!tag)
                : Array.isArray(tagsRaw)
                    ? tagsRaw.map((tag) => tag.trim()).filter((tag) => !!tag)
                    : [];
            const newImage = await Image_1.default.create({
                url: imageUrl,
                tags: tagArray,
                ocrText: typeof ocrTextRaw === 'string' ? ocrTextRaw.trim() : ''
            });
            triggerVectorCalculation(newImage);
            res.status(201).json(newImage);
        }
        catch (error) {
            console.error('Error uploading image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error uploading image', error: errorMessage });
        }
    }
    async uploadBatchImages(req, res) {
        try {
            const files = req.files;
            const images = files['images'];
            if (!images || !Array.isArray(images) || images.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }
            const metadataJson = req.body.metadata;
            let metadata = {};
            if (metadataJson) {
                try {
                    metadata = JSON.parse(metadataJson);
                }
                catch (e) {
                    return res.status(400).json({ message: 'Invalid metadata format. Expected a JSON string.' });
                }
            }
            const createdImages = [];
            for (const file of images) {
                const fileName = (0, fileHandler_1.saveImage)(file);
                const imageUrl = (0, fileHandler_1.getImageUrl)(fileName);
                const normalizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileMetadata = metadata[normalizedOriginalName];
                const tags = fileMetadata ? fileMetadata.tags : [];
                const ocrText = fileMetadata ? fileMetadata.ocrText : '';
                const newImage = await Image_1.default.create({
                    url: imageUrl,
                    tags: tags,
                    ocrText: ocrText
                });
                createdImages.push(newImage);
                triggerVectorCalculation(newImage);
            }
            res.status(201).json(createdImages);
        }
        catch (error) {
            console.error('Error batch uploading images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error batch uploading images', error: errorMessage });
        }
    }
    async getImages(req, res) {
        try {
            const images = await Image_1.default.findAll();
            res.status(200).json(images);
        }
        catch (error) {
            console.error('Error fetching images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching images', error: errorMessage });
        }
    }
    async getImageById(req, res) {
        try {
            const { id } = req.params;
            const image = await Image_1.default.findById(id);
            if (!image) {
                return res.status(404).json({ message: 'Image not found' });
            }
            res.status(200).json(image);
        }
        catch (error) {
            console.error('Error fetching image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching image', error: errorMessage });
        }
    }
    async updateImage(req, res) {
        try {
            const { id } = req.params;
            const updatePayload = {};
            if (Object.prototype.hasOwnProperty.call(req.body, 'ocrText')) {
                const ocrTextRaw = req.body.ocrText;
                if (ocrTextRaw !== undefined && ocrTextRaw !== null && typeof ocrTextRaw !== 'string') {
                    return res.status(400).json({ message: 'OCR text must be a string' });
                }
                updatePayload.ocrText = typeof ocrTextRaw === 'string' ? ocrTextRaw : '';
            }
            if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
                const tagsRaw = req.body.tags;
                let parsedTags;
                if (typeof tagsRaw === 'string') {
                    parsedTags = tagsRaw
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0);
                }
                else if (Array.isArray(tagsRaw)) {
                    parsedTags = tagsRaw
                        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag) => tag.length > 0);
                }
                else if (tagsRaw === null) {
                    parsedTags = [];
                }
                else {
                    return res.status(400).json({ message: 'Tags must be a string or array of strings' });
                }
                updatePayload.tags = parsedTags ?? [];
            }
            if (!Object.keys(updatePayload).length) {
                return res.status(400).json({ message: 'No valid fields provided for update' });
            }
            const updatedImage = await Image_1.default.update(id, updatePayload);
            if (!updatedImage) {
                return res.status(404).json({ message: 'Image not found' });
            }
            res.status(200).json(updatedImage);
        }
        catch (error) {
            console.error('Error updating image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating image', error: errorMessage });
        }
    }
    async deleteImage(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Image_1.default.delete(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Image not found' });
            }
            res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting image', error: errorMessage });
        }
    }
    async getImagesByTag(req, res) {
        try {
            const { tag } = req.query;
            if (!tag || typeof tag !== 'string') {
                return res.status(400).json({ message: 'Tag query parameter is required' });
            }
            const images = await Image_1.default.findByTag(tag);
            res.status(200).json(images);
        }
        catch (error) {
            console.error('Error fetching images by tag:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching images by tag', error: errorMessage });
        }
    }
    async searchImages(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).json({ message: 'Query parameter q is required' });
            }
            const images = await Image_1.default.findByQuery(q);
            res.status(200).json(images);
        }
        catch (error) {
            console.error('Error searching images:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error searching images', error: errorMessage });
        }
    }
    async extractText(req, res) {
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
            const result = await tesseract_js_1.default.recognize(req.file.buffer, language);
            const text = typeof result.data?.text === 'string' ? result.data.text.trim() : '';
            res.status(200).json({ text, language });
        }
        catch (error) {
            console.error('Error extracting text from image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error extracting text', error: errorMessage });
        }
    }
    async extractTextLLM(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            if (!req.file.buffer) {
                return res.status(400).json({ message: 'Uploaded file data is unavailable for LLM OCR' });
            }
            const config = (0, llm_1.getLLMConfig)();
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
            const base64Image = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype || 'image/jpeg';
            console.log(`LLM OCR Request - Base URL: ${config.baseUrl}, Model: ${config.model}, API Key Length: ${config.apiKey.length}`);
            const systemPrompt = config.systemPrompt && config.systemPrompt.trim().length > 0
                ? config.systemPrompt
                : llm_1.DEFAULT_LLM_SYSTEM_PROMPT;
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
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch (parseError) {
                console.error('Failed to parse LLM API response as JSON:', responseText);
                throw new Error('Invalid JSON response from LLM API');
            }
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No response from LLM');
            }
            const rawContent = typeof content === 'string' ? content : String(content);
            const sanitizedContent = stripMarkdownFence(rawContent);
            let extractedText = '';
            let suggestedTags = [];
            try {
                const jsonResponse = JSON.parse(sanitizedContent);
                if (typeof jsonResponse.ocr_text === 'string') {
                    extractedText = jsonResponse.ocr_text;
                }
                else if (typeof jsonResponse.text === 'string') {
                    extractedText = jsonResponse.text;
                }
                if (Array.isArray(jsonResponse.suggested_tags)) {
                    suggestedTags = jsonResponse.suggested_tags
                        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag) => tag.length > 0);
                }
                else if (Array.isArray(jsonResponse.tags)) {
                    suggestedTags = jsonResponse.tags
                        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
                        .filter((tag) => tag.length > 0);
                }
                if (!extractedText && typeof sanitizedContent === 'string') {
                    extractedText = sanitizedContent;
                }
            }
            catch (parseError) {
                console.warn('LLM did not return JSON, falling back to raw content.');
                extractedText = sanitizedContent;
                suggestedTags = [];
            }
            const text = typeof extractedText === 'string' ? extractedText.trim() : '';
            const uniqueSuggestedTags = Array.from(new Set(suggestedTags.map((tag) => tag.toLowerCase())))
                .map((lowerTag, index, array) => {
                const originalTag = suggestedTags.find((tag) => tag.toLowerCase() === lowerTag);
                return originalTag ?? lowerTag;
            })
                .filter((tag) => tag.length > 0)
                .slice(0, 5);
            res.status(200).json({
                text,
                suggestedTags: uniqueSuggestedTags,
                method: 'llm',
                model: config.model
            });
        }
        catch (error) {
            console.error('Error extracting text with LLM:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error extracting text with LLM', error: errorMessage });
        }
    }
    async getLLMConfig(req, res) {
        try {
            const config = (0, llm_1.getLLMConfig)();
            res.json({
                baseUrl: config.baseUrl,
                model: config.model,
                systemPrompt: config.systemPrompt,
                hasApiKey: !!config.apiKey
            });
        }
        catch (error) {
            console.error('Error getting LLM config:', error);
            res.status(500).json({ message: 'Error getting LLM configuration' });
        }
    }
    async updateLLMConfig(req, res) {
        try {
            const { baseUrl, model, apiKey, systemPrompt } = req.body;
            (0, llm_1.updateLLMConfig)({ baseUrl, model, apiKey, systemPrompt });
            const updatedConfig = (0, llm_1.getLLMConfig)();
            res.status(200).json(updatedConfig);
        }
        catch (error) {
            console.error('Error updating LLM config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating LLM configuration', error: errorMessage });
        }
    }
    async scanSimilarImages(req, res) {
        try {
            const thresholdParam = typeof req.query.threshold === 'string' ? parseFloat(req.query.threshold) : undefined;
            const threshold = Number.isFinite(thresholdParam)
                ? Math.min(Math.max(thresholdParam, 0), 1)
                : 0.92;
            const results = await (0, imageSimilarity_1.scanImageSimilarity)(threshold);
            res.status(200).json({ results, threshold });
        }
        catch (error) {
            console.error('Error scanning image similarity:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error scanning image similarity', error: errorMessage });
        }
    }
    async generateMissingVectors(req, res) {
        res.status(202).json({ message: 'Started generating missing vectors in the background.' });
        (async () => {
            try {
                const images = await Image_1.default.findAll();
                const imagesWithoutVectors = images.filter(image => !image.vector || image.vector.length === 0);
                console.log(`Found ${imagesWithoutVectors.length} images without vectors. Starting generation.`);
                for (const image of imagesWithoutVectors) {
                    await triggerVectorCalculation(image);
                }
                console.log('Finished generating missing vectors.');
            }
            catch (error) {
                console.error('Error generating missing vectors:', error);
            }
        })();
    }
}
exports.ImageController = ImageController;
const stripMarkdownFence = (payload) => {
    const trimmed = payload.trim();
    const lines = trimmed.split(/\r?\n/);
    if (lines.length >= 2 && lines[0].startsWith('```') && lines[lines.length - 1].startsWith('```')) {
        return lines.slice(1, -1).join('\n').trim();
    }
    return trimmed;
};
