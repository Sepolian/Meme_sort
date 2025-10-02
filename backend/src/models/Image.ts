import { randomUUID } from 'crypto';
import { getDb } from '../config/database';
import Tag from './Tag';
import { deleteImageFile } from '../utils/fileHandler';

type ImageRow = {
    id: string;
    url: string;
    ocrText: string | null;
    createdAt: string;
};

type TagRow = {
    name: string;
};

class Image {
    id: string;
    url: string;
    tags: string[];
    ocrText: string;
    createdAt: Date;

    constructor(data: { url: string; tags: string[]; ocrText?: string }) {
        this.id = randomUUID();
        this.url = data.url;
        this.tags = data.tags;
        this.ocrText = data.ocrText ?? '';
        this.createdAt = new Date();
    }

    static async create(imageData: { url: string; tags: string[]; ocrText?: string }): Promise<Image> {
        const db = getDb();
        const image = new Image(imageData);

        const insertImage = db.prepare(
            'INSERT INTO images (id, url, ocr_text, created_at) VALUES (?, ?, ?, ?)'
        );
        insertImage.run(
            image.id,
            image.url,
            image.ocrText,
            image.createdAt.toISOString()
        );

        const uniqueTags = this.normalizeTags(image.tags);

        if (uniqueTags.length > 0) {
            const insertMapping = db.prepare(
                'INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)'
            );

            for (const normalized of uniqueTags) {
                const tag = await Tag.findOrCreateByName(normalized);
                insertMapping.run(image.id, tag.id);
            }
        }

        image.tags = this.getTagsForImage(image.id);
        return image;
    }

    static async findByTag(tag: string): Promise<Image[]> {
        const db = getDb();
        const rows = db.prepare(
            `
            SELECT i.id, i.url, i.ocr_text AS ocrText, i.created_at AS createdAt
            FROM images i
            INNER JOIN image_tags it ON it.image_id = i.id
            INNER JOIN tags t ON t.id = it.tag_id
            WHERE t.name = ?
            ORDER BY datetime(i.created_at) DESC
        `
        ).all(tag.trim()) as ImageRow[];

        return rows.map((row: ImageRow) => this.mapRowToImage(row));
    }

    static async findByQuery(query: string): Promise<Image[]> {
        const db = getDb();
        const searchTerm = `%${query.trim()}%`;
        const rows = db.prepare(
            `
            SELECT DISTINCT i.id, i.url, i.ocr_text AS ocrText, i.created_at AS createdAt
            FROM images i
            LEFT JOIN image_tags it ON it.image_id = i.id
            LEFT JOIN tags t ON t.id = it.tag_id
            WHERE t.name LIKE ? OR i.ocr_text LIKE ?
            ORDER BY datetime(i.created_at) DESC
        `
        ).all(searchTerm, searchTerm) as ImageRow[];

        return rows.map((row: ImageRow) => this.mapRowToImage(row));
    }

    static async findAll(): Promise<Image[]> {
        const db = getDb();
        const rows = db.prepare(
            `
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt
            FROM images
            ORDER BY datetime(created_at) DESC
        `
        ).all() as ImageRow[];

        return rows.map((row: ImageRow) => this.mapRowToImage(row));
    }

    static async findById(id: string): Promise<Image | null> {
        const db = getDb();
        const row = db.prepare(
            `
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt
            FROM images
            WHERE id = ?
        `
        ).get(id) as ImageRow | undefined;

        if (!row) {
            return null;
        }

        return this.mapRowToImage(row);
    }

    static async update(id: string, updateData: { tags?: string[]; ocrText?: string }): Promise<Image | null> {
        const db = getDb();
        const existing = db.prepare(
            `
            SELECT id, url, ocr_text AS ocrText, created_at AS createdAt
            FROM images
            WHERE id = ?
        `
        ).get(id) as ImageRow | undefined;

        if (!existing) {
            return null;
        }

        if (updateData.ocrText !== undefined) {
            const normalizedText = typeof updateData.ocrText === 'string' ? updateData.ocrText : '';
            db.prepare('UPDATE images SET ocr_text = ? WHERE id = ?').run(normalizedText, id);
        }

        if (updateData.tags !== undefined) {
            const normalizedTags = this.normalizeTags(updateData.tags);
            const deleteMappings = db.prepare('DELETE FROM image_tags WHERE image_id = ?');
            deleteMappings.run(id);

            if (normalizedTags.length > 0) {
                const insertMapping = db.prepare(
                    'INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)'
                );

                for (const tagName of normalizedTags) {
                    const tag = await Tag.findOrCreateByName(tagName);
                    insertMapping.run(id, tag.id);
                }
            }
        }

        return this.findById(id);
    }

    static async delete(id: string): Promise<boolean> {
        const db = getDb();
        const row = db.prepare('SELECT url FROM images WHERE id = ?').get(id) as { url: string } | undefined;

        if (!row) {
            return false;
        }

        const result = db.prepare('DELETE FROM images WHERE id = ?').run(id);

        if (result.changes && result.changes > 0) {
            deleteImageFile(row.url);
            return true;
        }

        return false;
    }

    private static mapRowToImage(row: ImageRow): Image {
        const tags = this.getTagsForImage(row.id);
        const image = new Image({ url: row.url, tags, ocrText: row.ocrText ?? '' });
        image.id = row.id;
        image.createdAt = new Date(row.createdAt);
        return image;
    }

    private static getTagsForImage(imageId: string): string[] {
        const db = getDb();
        const rows = db.prepare(
            `
            SELECT t.name
            FROM tags t
            INNER JOIN image_tags it ON it.tag_id = t.id
            WHERE it.image_id = ?
            ORDER BY t.name ASC
        `
        ).all(imageId) as TagRow[];

        return rows.map((row: TagRow) => row.name);
    }

    private static normalizeTags(tags: string[]): string[] {
        return Array.from(
            new Set(
                tags
                    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
                    .filter((tag) => tag.length > 0)
                    .map((tag) => tag.toLowerCase())
            )
        ).map((lowerTag) => {
            const original = tags.find(
                (candidate) => candidate && candidate.toLowerCase() === lowerTag
            );
            return original ? original.trim() : lowerTag;
        });
    }
}

export default Image;