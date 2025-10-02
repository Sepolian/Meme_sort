import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const saveImage = (file: Express.Multer.File): string => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // If file is already saved by multer, just return the filename
    // Otherwise, save the buffer to file
    if (file.path) {
        return path.basename(file.path);
    } else if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
        return fileName;
    }
    
    throw new Error('No file data available');
};

export const getImagePath = (fileName: string): string => {
    return `/uploads/${fileName}`;
};

export const getImageUrl = (fileName: string, baseUrl: string = 'http://localhost:5000'): string => {
    return `${baseUrl}/uploads/${fileName}`;
};

export const resolveImageFilePath = (imageUrlOrPath: string): string | null => {
    if (!imageUrlOrPath) {
        return null;
    }

    try {
        if (fs.existsSync(imageUrlOrPath)) {
            return imageUrlOrPath;
        }
    } catch {
        // ignore direct path errors
    }

    let fileName = '';
    try {
        const parsedUrl = new URL(imageUrlOrPath);
        fileName = path.basename(parsedUrl.pathname);
    } catch {
        fileName = path.basename(imageUrlOrPath);
    }

    if (!fileName) {
        return null;
    }

    const filePath = path.join(UPLOAD_DIR, fileName);
    return fs.existsSync(filePath) ? filePath : null;
};

export const deleteImageFile = (imageUrlOrPath: string): boolean => {
    try {
        if (!imageUrlOrPath) {
            return false;
        }

        const filePath = resolveImageFilePath(imageUrlOrPath);
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (error) {
        console.warn('Failed to delete image file:', error);
    }

    return false;
};