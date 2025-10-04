"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanImageSimilarity = exports.calculateImageVector = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const Image_1 = __importDefault(require("../models/Image"));
const pythonSetup_1 = require("./pythonSetup");
const sanitizeImage = (image) => ({
    id: image.id,
    url: image.url,
    tags: Array.isArray(image.tags) ? image.tags : [],
    ocrText: typeof image.ocrText === 'string' ? image.ocrText : '',
    createdAt: image.createdAt instanceof Date ? image.createdAt.toISOString() : String(image.createdAt),
});
const calculateImageVector = (imagePath) => {
    return new Promise((resolve, reject) => {
        const pythonExec = (0, pythonSetup_1.getPythonExecutable)();
        const scriptPath = path_1.default.join(__dirname, '../scripts/extract_vector.py');
        const pythonProcess = (0, child_process_1.spawn)(pythonExec, [scriptPath, imagePath]);
        let stdout = '';
        let stderr = '';
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(stderr);
                return resolve(null);
            }
            try {
                const vector = JSON.parse(stdout);
                resolve(vector);
            }
            catch (e) {
                console.error('Failed to parse vector from python script output', e);
                resolve(null);
            }
        });
    });
};
exports.calculateImageVector = calculateImageVector;
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
    }
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magA === 0 || magB === 0) {
        return 0;
    }
    return dotProduct / (magA * magB);
};
const scanImageSimilarity = async (threshold = 0.7) => {
    const images = await Image_1.default.findAll();
    const imagesWithVectors = images.filter(image => image.vector && image.vector.length > 0);
    const results = [];
    for (let i = 0; i < imagesWithVectors.length; i += 1) {
        for (let j = i + 1; j < imagesWithVectors.length; j += 1) {
            const imageA = imagesWithVectors[i];
            const imageB = imagesWithVectors[j];
            const similarity = cosineSimilarity(imageA.vector, imageB.vector);
            if (similarity >= threshold) {
                results.push({
                    imageA: sanitizeImage(imageA),
                    imageB: sanitizeImage(imageB),
                    similarity: Math.round(similarity * 10000) / 100,
                });
            }
        }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results;
};
exports.scanImageSimilarity = scanImageSimilarity;
