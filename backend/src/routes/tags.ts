import { Router } from 'express';
import TagController from '../controllers/tagController';

const router = Router();

router.post('/', TagController.createTag.bind(TagController));
router.get('/', TagController.getTags.bind(TagController));

export default function setTagRoutes(app: any) {
    app.use('/api/tags', router);
}