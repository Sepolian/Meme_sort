export interface Image {
    id: string;
    url: string;
    tags: string[];
    createdAt: string;
    ocrText: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface SimilarImagePair {
    imageA: Image;
    imageB: Image;
    similarity: number;
}