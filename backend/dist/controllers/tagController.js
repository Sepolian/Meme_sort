"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tag_1 = __importDefault(require("../models/Tag"));
class TagController {
    async createTag(req, res) {
        try {
            const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
            if (!name) {
                return res.status(400).json({ message: 'Tag name is required' });
            }
            const existingTag = await Tag_1.default.findByName(name);
            if (existingTag) {
                return res.status(400).json({ message: 'Tag already exists' });
            }
            const tag = await Tag_1.default.create(name);
            res.status(201).json(tag);
        }
        catch (error) {
            console.error('Error creating tag:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error creating tag', error: errorMessage });
        }
    }
    async getTags(req, res) {
        try {
            const tags = await Tag_1.default.getAll();
            res.status(200).json(tags);
        }
        catch (error) {
            console.error('Error retrieving tags:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error retrieving tags', error: errorMessage });
        }
    }
}
exports.default = new TagController();
