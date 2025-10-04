import { spawn } from 'child_process';
import path from 'path';
import Image from '../models/Image';
import { resolveImageFilePath } from './fileHandler';
import { getPythonExecutable } from './pythonSetup';

type SanitizedImage = {
    id: string;
    url: string;
    tags: string[];
    ocrText: string;
    createdAt: string;
};

export interface SimilarImagePair {
    imageA: SanitizedImage;
    imageB: SanitizedImage;
    similarity: number;
}

const sanitizeImage = (image: Image): SanitizedImage => ({
    id: image.id,
    url: image.url,
    tags: Array.isArray(image.tags) ? image.tags : [],
    ocrText: typeof image.ocrText === 'string' ? image.ocrText : '',
    createdAt: image.createdAt instanceof Date ? image.createdAt.toISOString() : String(image.createdAt),
});

export const calculateImageVector = (imagePath: string): Promise<number[] | null> => {
    return new Promise((resolve, reject) => {
        const pythonExec = getPythonExecutable();
        const scriptPath = path.join(__dirname, '../scripts/extract_vector.py');
        const pythonProcess = spawn(pythonExec, [scriptPath, imagePath]);

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
            } catch (e) {
                console.error('Failed to parse vector from python script output', e);
                resolve(null);
            }
        });
    });
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
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

export const scanImageSimilarity = async (threshold: number = 0.7): Promise<SimilarImagePair[]> => {
    const images = await Image.findAll();
    const imagesWithVectors = images.filter(image => image.vector && image.vector.length > 0);

    const results: SimilarImagePair[] = [];

    for (let i = 0; i < imagesWithVectors.length; i += 1) {
        for (let j = i + 1; j < imagesWithVectors.length; j += 1) {
            const imageA = imagesWithVectors[i];
            const imageB = imagesWithVectors[j];

            const similarity = cosineSimilarity(imageA.vector!, imageB.vector!);

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