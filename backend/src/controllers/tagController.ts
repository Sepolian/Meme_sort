import { Request, Response } from 'express';
import Tag from '../models/Tag';

class TagController {
    async createTag(req: Request, res: Response) {
        try {
            const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

            if (!name) {
                return res.status(400).json({ message: 'Tag name is required' });
            }

            const existingTag = await Tag.findByName(name);
            
            if (existingTag) {
                return res.status(400).json({ message: 'Tag already exists' });
            }
            
            const tag = await Tag.create(name);
            res.status(201).json(tag);
        } catch (error) {
            console.error('Error creating tag:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error creating tag', error: errorMessage });
        }
    }

    async getTags(req: Request, res: Response) {
        try {
            const tags = await Tag.getAll();
            res.status(200).json(tags);
        } catch (error) {
            console.error('Error retrieving tags:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error retrieving tags', error: errorMessage });
        }
    }
}

export default new TagController();