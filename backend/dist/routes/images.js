"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setImageRoutes;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const imageController_1 = require("../controllers/imageController");
const upload_1 = __importStar(require("../middleware/upload"));
const router = (0, express_1.Router)();
const imageController = new imageController_1.ImageController();
const ocrUpload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/upload', upload_1.default.single('image'), imageController.uploadImage.bind(imageController));
const batchUpload = (0, multer_1.default)({ storage: upload_1.storage }).fields([
    { name: 'images', maxCount: 20 },
    { name: 'metadata' }
]);
router.post('/batch_upload', batchUpload, imageController.uploadBatchImages.bind(imageController));
router.post('/ocr', ocrUpload.single('image'), imageController.extractText.bind(imageController));
router.post('/ocr-llm', ocrUpload.single('image'), imageController.extractTextLLM.bind(imageController));
router.get('/', imageController.getImages.bind(imageController));
router.get('/search', imageController.searchImages.bind(imageController));
router.get('/llm-config', imageController.getLLMConfig.bind(imageController));
router.post('/llm-config', imageController.updateLLMConfig.bind(imageController));
router.get('/similarity/scan', imageController.scanSimilarImages.bind(imageController));
router.get('/:id', imageController.getImageById.bind(imageController));
router.put('/:id', imageController.updateImage.bind(imageController));
router.delete('/:id', imageController.deleteImage.bind(imageController));
function setImageRoutes(app) {
    app.use('/api/images', router);
}
