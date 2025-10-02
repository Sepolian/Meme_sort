"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFile = exports.resolveImageFilePath = exports.getImageUrl = exports.getImagePath = exports.saveImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const saveImage = (file) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    if (file.path) {
        return path_1.default.basename(file.path);
    }
    else if (file.buffer) {
        fs_1.default.writeFileSync(filePath, file.buffer);
        return fileName;
    }
    throw new Error('No file data available');
};
exports.saveImage = saveImage;
const getImagePath = (fileName) => {
    return `/uploads/${fileName}`;
};
exports.getImagePath = getImagePath;
const getImageUrl = (fileName, baseUrl = 'http://localhost:5000') => {
    return `${baseUrl}/uploads/${fileName}`;
};
exports.getImageUrl = getImageUrl;
const resolveImageFilePath = (imageUrlOrPath) => {
    if (!imageUrlOrPath) {
        return null;
    }
    try {
        if (fs_1.default.existsSync(imageUrlOrPath)) {
            return imageUrlOrPath;
        }
    }
    catch {
    }
    let fileName = '';
    try {
        const parsedUrl = new URL(imageUrlOrPath);
        fileName = path_1.default.basename(parsedUrl.pathname);
    }
    catch {
        fileName = path_1.default.basename(imageUrlOrPath);
    }
    if (!fileName) {
        return null;
    }
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    return fs_1.default.existsSync(filePath) ? filePath : null;
};
exports.resolveImageFilePath = resolveImageFilePath;
const deleteImageFile = (imageUrlOrPath) => {
    try {
        if (!imageUrlOrPath) {
            return false;
        }
        const filePath = (0, exports.resolveImageFilePath)(imageUrlOrPath);
        if (filePath && fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
    }
    catch (error) {
        console.warn('Failed to delete image file:', error);
    }
    return false;
};
exports.deleteImageFile = deleteImageFile;
