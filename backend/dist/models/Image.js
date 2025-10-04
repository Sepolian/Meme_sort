"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const database_1 = require("../config/database");
const Tag_1 = __importDefault(require("./Tag"));
const fileHandler_1 = require("../utils/fileHandler");
class Image {
    constructor(data) {
        this.id = (0, crypto_1.randomUUID)();
        this.url = data.url;
        this.tags = data.tags;
        this.ocrText = data.ocrText ?? '';
        this.createdAt = new Date();
        this.vector = data.vector ?? null;
    }
    static async create(imageData) {
        const db = (0, database_1.getDb)();
        const image = new Image(imageData);
        const insertImage = db.prepare('INSERT INTO images (id, url, ocr_text, created_at, vector) VALUES (?, ?, ?, ?, ?)');
        insertImage.run(image.id, image.url, image.ocrText, image.createdAt.toISOString(), image.vector ? JSON.stringify(image.vector) : null);
        const uniqueTags = this.normalizeTags(image.tags);
        if (uniqueTags.length > 0) {
            const insertMapping = db.prepare('INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)');
            for (const normalized of uniqueTags) {
                const tag = await Tag_1.default.findOrCreateByName(normalized);
                insertMapping.run(image.id, tag.id);
            }
        }
        image.tags = this.getTagsForImage(image.id);
        return image;
    }
    static async findByTag(tag) {
        const db = (0, database_1.getDb)();
        const rows = db.prepare(`
            SELECT i.id, i.url, i.ocr_text AS ocrText, i.created_at AS createdAt, i.vector
            FROM images i
            INNER JOIN image_tags it ON it.image_id = i.id
            INNER JOIN tags t ON t.id = it.tag_id
            WHERE t.name = ?
            ORDER BY datetime(i.created_at) DESC
        `).all(tag.trim());
        return rows.map((row) => this.mapRowToImage(row));
    }
    static async findByQuery(query) {
        const db = (0, database_1.getDb)();
        const searchTerm = `%${query.trim()}%`;
        const rows = db.prepare(`
            SELECT DISTINCT i.id, i.url, i.ocr_text AS ocrText, i.created_at AS createdAt, i.vector
            FROM images i
            LEFT JOIN image_tags it ON it.image_id = i.id
            LEFT JOIN tags t ON t.id = it.tag_id
            WHERE t.name LIKE ? OR i.ocr_text LIKE ?
            ORDER BY datetime(i.created_at) DESC
        `).all(searchTerm, searchTerm);
        return rows.map((row) => this.mapRowToImage(row));
    }
    static async findAll() {
        const db = (0, database_1.getDb)();
        const rows = db.prepare(`
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt, vector
            FROM images
            ORDER BY datetime(created_at) DESC
        `).all();
        return rows.map((row) => this.mapRowToImage(row));
    }
    static async findById(id) {
        const db = (0, database_1.getDb)();
        const row = db.prepare(`
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt, vector
            FROM images
            WHERE id = ?
        `).get(id);
        if (!row) {
            return null;
        }
        return this.mapRowToImage(row);
    }
    static async update(id, updateData) {
        const db = (0, database_1.getDb)();
        const existing = db.prepare(`
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt, vector
            FROM images
            WHERE id = ?
        `).get(id);
        if (!existing) {
            return null;
        }
        if (updateData.ocrText !== undefined) {
            const normalizedText = typeof updateData.ocrText === 'string' ? updateData.ocrText : '';
            db.prepare('UPDATE images SET ocr_text = ? WHERE id = ?').run(normalizedText, id);
        }
        if (updateData.vector !== undefined) {
            db.prepare('UPDATE images SET vector = ? WHERE id = ?').run(updateData.vector ? JSON.stringify(updateData.vector) : null, id);
        }
        if (updateData.tags !== undefined) {
            const normalizedTags = this.normalizeTags(updateData.tags);
            const deleteMappings = db.prepare('DELETE FROM image_tags WHERE image_id = ?');
            deleteMappings.run(id);
            if (normalizedTags.length > 0) {
                const insertMapping = db.prepare('INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)');
                for (const tagName of normalizedTags) {
                    const tag = await Tag_1.default.findOrCreateByName(tagName);
                    insertMapping.run(id, tag.id);
                }
            }
        }
        return this.findById(id);
    }
    static async delete(id) {
        const db = (0, database_1.getDb)();
        const row = db.prepare('SELECT url FROM images WHERE id = ?').get(id);
        if (!row) {
            return false;
        }
        const result = db.prepare('DELETE FROM images WHERE id = ?').run(id);
        if (result.changes && result.changes > 0) {
            (0, fileHandler_1.deleteImageFile)(row.url);
            return true;
        }
        return false;
    }
    static mapRowToImage(row) {
        const tags = this.getTagsForImage(row.id);
        let vector = null;
        if (row.vector) {
            try {
                vector = JSON.parse(row.vector);
            }
            catch (e) {
                console.error('Failed to parse vector for image', row.id, e);
            }
        }
        const image = new Image({ url: row.url, tags, ocrText: row.ocrText ?? '', vector });
        image.id = row.id;
        image.createdAt = new Date(row.createdAt);
        return image;
    }
    static getTagsForImage(imageId) {
        const db = (0, database_1.getDb)();
        const rows = db.prepare(`
            SELECT t.name
            FROM tags t
            INNER JOIN image_tags it ON it.tag_id = t.id
            WHERE it.image_id = ?
            ORDER BY t.name ASC
        `).all(imageId);
        return rows.map((row) => row.name);
    }
    static normalizeTags(tags) {
        return Array.from(new Set(tags
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter((tag) => tag.length > 0)
            .map((tag) => tag.toLowerCase()))).map((lowerTag) => {
            const original = tags.find((candidate) => candidate && candidate.toLowerCase() === lowerTag);
            return original ? original.trim() : lowerTag;
        });
    }
}
exports.default = Image;
