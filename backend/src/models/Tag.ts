import { randomUUID } from 'crypto';
import { getDb } from '../config/database';

class Tag {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    static async create(name: string): Promise<Tag> {
        const db = getDb();
        const normalized = name.trim();
        const id = randomUUID();
        const statement = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
        statement.run(id, normalized);
        return new Tag(id, normalized);
    }

    static async findById(id: string): Promise<Tag | null> {
        const db = getDb();
        const row = db
            .prepare('SELECT id, name FROM tags WHERE id = ?')
            .get(id) as { id: string; name: string } | undefined;
        return row ? new Tag(row.id, row.name) : null;
    }

    static async findByName(name: string): Promise<Tag | null> {
        const db = getDb();
        const row = db
            .prepare('SELECT id, name FROM tags WHERE name = ?')
            .get(name.trim()) as { id: string; name: string } | undefined;
        return row ? new Tag(row.id, row.name) : null;
    }

    static async findOrCreateByName(name: string): Promise<Tag> {
        const existing = await this.findByName(name);
        if (existing) {
            return existing;
        }
        return this.create(name);
    }

    static async getAll(): Promise<Tag[]> {
        const db = getDb();
        const rows = db
            .prepare('SELECT id, name FROM tags ORDER BY name ASC')
            .all() as { id: string; name: string }[];
        return rows.map((row) => new Tag(row.id, row.name));
    }
}

export default Tag;