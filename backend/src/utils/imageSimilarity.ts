import Jimp from 'jimp';
import Image from '../models/Image';
import { resolveImageFilePath } from './fileHandler';

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

const bitCount = (value: number): number => {
    let count = 0;
    let current = value;
    while (current) {
        count += current & 1;
        current >>= 1;
    }
    return count;
};

const hammingDistance = (hashA: string, hashB: string): number => {
    const length = Math.min(hashA.length, hashB.length);
    let distance = 0;

    for (let index = 0; index < length; index += 1) {
        const digitA = parseInt(hashA[index], 16);
        const digitB = parseInt(hashB[index], 16);

        if (Number.isNaN(digitA) || Number.isNaN(digitB)) {
            continue;
        }

        distance += bitCount(digitA ^ digitB);
    }

    if (hashA.length > length) {
        distance += (hashA.length - length) * 4;
    } else if (hashB.length > length) {
        distance += (hashB.length - length) * 4;
    }

    return distance;
};

const sanitizeImage = (image: Image): SanitizedImage => ({
    id: image.id,
    url: image.url,
    tags: Array.isArray(image.tags) ? image.tags : [],
    ocrText: typeof image.ocrText === 'string' ? image.ocrText : '',
    createdAt: image.createdAt instanceof Date ? image.createdAt.toISOString() : String(image.createdAt),
});

const computeImageHash = async (imagePath: string): Promise<string | null> => {
    try {
        const image = await Jimp.read(imagePath);
        return image.grayscale().resize(16, 16).hash();
    } catch (error) {
        console.warn(`Failed to hash image at ${imagePath}:`, error);
        return null;
    }
};

export const scanImageSimilarity = async (threshold: number = 0.92): Promise<SimilarImagePair[]> => {
    const images = await Image.findAll();
    const hashedImages: { hash: string; data: SanitizedImage }[] = [];

    for (const image of images) {
        const filePath = resolveImageFilePath(image.url);
        if (!filePath) {
            continue;
        }

        const hash = await computeImageHash(filePath);
        if (!hash) {
            continue;
        }

        hashedImages.push({ hash, data: sanitizeImage(image) });
    }

    const results: SimilarImagePair[] = [];
    const defaultBits = hashedImages.length > 0 ? hashedImages[0].hash.length * 4 : 0;

    for (let i = 0; i < hashedImages.length; i += 1) {
        for (let j = i + 1; j < hashedImages.length; j += 1) {
            const distance = hammingDistance(hashedImages[i].hash, hashedImages[j].hash);
            const totalBits = defaultBits || Math.max(hashedImages[i].hash.length, hashedImages[j].hash.length) * 4;
            const similarity = totalBits === 0 ? 0 : 1 - distance / totalBits;

            if (similarity >= threshold) {
                results.push({
                    imageA: hashedImages[i].data,
                    imageB: hashedImages[j].data,
                    similarity: Math.round(similarity * 10000) / 100,
                });
            }
        }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results;
};
