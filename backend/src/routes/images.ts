import { Router } from 'express';
import multer from 'multer';
import { ImageController } from '../controllers/imageController';
import upload, { storage } from '../middleware/upload';

const router = Router();
const imageController = new ImageController();
const ocrUpload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), imageController.uploadImage.bind(imageController));

// Update batch upload to parse both 'images' (array) and 'metadata' (field)
const batchUpload = multer({ storage }).fields([
  { name: 'images', maxCount: 20 },  // Adjust maxCount as needed for batch size
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

export default function setImageRoutes(app: any) {
    app.use('/api/images', router);
}